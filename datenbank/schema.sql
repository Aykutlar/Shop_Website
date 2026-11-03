-- Phase 2 · Datenmodell (Entwurf) · PostgreSQL 16+
-- ORM-neutral. Wird in Phase 3 in Migrationen überführt.

-- gen_random_uuid() ist seit PostgreSQL 13 im Kern enthalten; keine Erweiterung nötig.

-- ───────────────────────── Aufzählungen ─────────────────────────

CREATE TYPE workflow_state AS ENUM (
  'CONFIGURATION_CREATED', 'CONFIGURATION_APPROVED', 'ORDER_MATCHED', 'ORDER_APPROVED',
  'CAD_GENERATED', 'CAD_APPROVED', 'SLICING_COMPLETED', 'SLICING_APPROVED',
  'PRINT_TRANSFER_APPROVED', 'PRINT_SUBMITTED', 'PRINT_COMPLETED', 'CANCELLED'
);
CREATE TYPE workflow_block AS ENUM ('FAILED', 'NEEDS_CLARIFICATION', 'REJECTED', 'ON_HOLD');
CREATE TYPE actor_type     AS ENUM ('USER', 'SYSTEM', 'JOB', 'AGENT', 'POLICY');
CREATE TYPE decision       AS ENUM ('APPROVE', 'REJECT');
CREATE TYPE job_kind       AS ENUM ('PREVIEW_RENDER', 'ORDER_SYNC', 'CAD_GENERATE', 'SLICE', 'HANDOFF', 'EMAIL');
CREATE TYPE job_status     AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE check_status   AS ENUM ('PASS', 'WARN', 'FAIL');
CREATE TYPE artifact_kind  AS ENUM (
  'PREVIEW_PNG', 'PREVIEW_GLB', 'RECIPE_JSON', 'MODEL_STL', 'MODEL_SCAD', 'LAYOUT_SVG',
  'QC_REPORT', 'SLICED_3MF', 'SLICE_PREVIEW_PNG', 'SLICE_REPORT', 'PRINT_PHOTO', 'PRODUCT_LABEL_PDF'
);
CREATE TYPE email_status   AS ENUM ('PENDING', 'SENT', 'FAILED');

-- ───────────────────────── Admin / Auth ─────────────────────────

CREATE TABLE admin_users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL UNIQUE,
  totp_secret_enc bytea,                       -- verschlüsselt, Reserve-Login
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE webauthn_credentials (
  id            bytea PRIMARY KEY,             -- credential id
  user_id       uuid NOT NULL REFERENCES admin_users(id),
  public_key    bytea NOT NULL,
  sign_count    bigint NOT NULL DEFAULT 0,
  label         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz
);

-- ───────────────────────── Katalog ─────────────────────────

-- Zentrale, versionierte Produktoptionen. Eine Version ist nach Aktivierung unveränderlich.
CREATE TABLE catalog_versions (
  id           serial PRIMARY KEY,
  version      text NOT NULL UNIQUE,           -- z. B. '2026.1'
  content      jsonb NOT NULL,
  content_hash text NOT NULL,
  is_active    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_active_catalog ON catalog_versions (is_active) WHERE is_active;

-- ───────────────────────── Konfigurationen ─────────────────────────

CREATE TABLE configurations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_code  text NOT NULL UNIQUE CHECK (public_code ~ '^WX-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$'),
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz                     -- nicht bestellte Konfigurationen verfallen
);

-- Jede Änderung erzeugt eine neue, unveränderliche Version.
CREATE TABLE configuration_versions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id   uuid NOT NULL REFERENCES configurations(id),
  version_no         int  NOT NULL CHECK (version_no >= 1),
  catalog_version_id int  NOT NULL REFERENCES catalog_versions(id),
  geometry_version   text NOT NULL,            -- Version der Anhänger-Berechnung
  params             jsonb NOT NULL,           -- alle gewählten Parameter
  params_hash        text NOT NULL,            -- SHA-256 der kanonischen JSON-Form
  quantity           int  NOT NULL CHECK (quantity BETWEEN 1 AND 50),
  unit_price_cents   int  NOT NULL CHECK (unit_price_cents > 0),
  currency           char(3) NOT NULL DEFAULT 'EUR',
  etsy_listing_id    bigint,                   -- erwartetes Etsy-Angebot (Preisstufe)
  created_by         actor_type NOT NULL DEFAULT 'USER',  -- Kunde (öffentlich) oder Admin-Änderung
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (configuration_id, version_no)
);

-- ───────────────────────── Etsy ─────────────────────────

CREATE TABLE etsy_receipts (
  receipt_id      bigint PRIMARY KEY,
  shop_id         bigint NOT NULL,
  was_paid        boolean NOT NULL,
  is_canceled     boolean NOT NULL DEFAULT false,
  grandtotal_cents int,
  currency        char(3),
  buyer_ref       text,                        -- minimal, kein Klartext-Adressblock
  etsy_created_at timestamptz,
  etsy_updated_at timestamptz,
  fetched_at      timestamptz NOT NULL DEFAULT now(),
  raw_minimized   jsonb                         -- nur benötigte Felder
);

CREATE TABLE etsy_order_items (
  transaction_id     bigint PRIMARY KEY,
  receipt_id         bigint NOT NULL REFERENCES etsy_receipts(receipt_id),
  listing_id         bigint NOT NULL,
  quantity           int NOT NULL,
  price_cents        int NOT NULL,
  variation          jsonb,
  personalization_raw text,
  parsed_code        text,                     -- normalisierter Code oder NULL
  match_problem      text                      -- z. B. 'CODE_MISSING', 'CODE_DUPLICATE', 'PRICE_MISMATCH'
);

CREATE TABLE etsy_webhook_events (
  event_id       text PRIMARY KEY,             -- Deduplizierung
  event_type     text NOT NULL,
  resource_url   text,
  signature_ok   boolean NOT NULL,
  received_at    timestamptz NOT NULL DEFAULT now(),
  processed_at   timestamptz
);

CREATE TABLE etsy_oauth_tokens (
  shop_id            bigint PRIMARY KEY,
  access_token_enc   bytea NOT NULL,           -- AES-256-GCM
  refresh_token_enc  bytea NOT NULL,
  expires_at         timestamptz NOT NULL,
  scopes             text[] NOT NULL,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── Workflow ─────────────────────────

CREATE TABLE workflows (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id          uuid NOT NULL REFERENCES configurations(id),
  configuration_version_id  uuid NOT NULL REFERENCES configuration_versions(id),
  order_item_id             bigint REFERENCES etsy_order_items(transaction_id),
  state                     workflow_state NOT NULL DEFAULT 'CONFIGURATION_CREATED',
  block                     workflow_block,
  block_reason              text,
  row_version               int NOT NULL DEFAULT 1,   -- optimistisches Locking
  is_test                   boolean NOT NULL DEFAULT true,  -- Testbetrieb bis Phase 9
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  CHECK (block IS NULL OR block_reason IS NOT NULL)
);
-- Ein Code darf höchstens einem aktiven Workflow gehören; eine Etsy-Position höchstens einem Workflow.
CREATE UNIQUE INDEX one_workflow_per_configuration ON workflows (configuration_id) WHERE state <> 'CANCELLED';
CREATE UNIQUE INDEX one_workflow_per_order_item    ON workflows (order_item_id) WHERE order_item_id IS NOT NULL;
CREATE INDEX workflows_dashboard ON workflows (state, block);

-- Erlaubte Übergänge. Einzige Quelle in der DB; packages/workflow wird dagegen getestet.
CREATE TABLE workflow_transitions (
  from_state        workflow_state NOT NULL,
  to_state          workflow_state NOT NULL,
  requires_approval boolean NOT NULL,          -- true ⇒ nur mit gültiger Freigabe
  policy_allowed    boolean NOT NULL DEFAULT false, -- darf später automatisiert werden
  PRIMARY KEY (from_state, to_state)
);
INSERT INTO workflow_transitions VALUES
  ('CONFIGURATION_CREATED',  'CONFIGURATION_APPROVED',  true,  true),
  ('CONFIGURATION_APPROVED', 'ORDER_MATCHED',           false, false),
  ('ORDER_MATCHED',          'ORDER_APPROVED',          true,  true),
  ('ORDER_APPROVED',         'CAD_GENERATED',           false, false),
  ('CAD_GENERATED',          'CAD_APPROVED',            true,  true),
  ('CAD_APPROVED',           'SLICING_COMPLETED',       false, false),
  ('SLICING_COMPLETED',      'SLICING_APPROVED',        true,  true),
  ('SLICING_APPROVED',       'PRINT_TRANSFER_APPROVED', true,  false),
  ('PRINT_TRANSFER_APPROVED','PRINT_SUBMITTED',         false, false),
  ('PRINT_SUBMITTED',        'PRINT_COMPLETED',         true,  false);

-- Freigaben/Ablehnungen sind unveränderlich (siehe Trigger unten).
CREATE TABLE approvals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   uuid NOT NULL REFERENCES workflows(id),
  from_state    workflow_state NOT NULL,
  to_state      workflow_state NOT NULL,
  decision      decision NOT NULL,
  target_hash   text NOT NULL,                 -- Hash über die freigegebenen Artefakte
  actor_type    actor_type NOT NULL CHECK (actor_type IN ('USER', 'POLICY')),
  user_id       uuid REFERENCES admin_users(id),
  policy_id     int,
  reason        text,
  step_up       boolean NOT NULL DEFAULT false, -- Passkey-Bestätigung erfolgt
  ip            inet,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK ((actor_type = 'USER' AND user_id IS NOT NULL) OR (actor_type = 'POLICY' AND policy_id IS NOT NULL)),
  CHECK (decision = 'APPROVE' OR reason IS NOT NULL),
  FOREIGN KEY (from_state, to_state) REFERENCES workflow_transitions(from_state, to_state)
);

CREATE TABLE approval_invalidations (
  approval_id   uuid PRIMARY KEY REFERENCES approvals(id),
  reason        text NOT NULL,                 -- z. B. 'CONFIGURATION_CHANGED'
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE state_transitions (
  id            bigserial PRIMARY KEY,
  workflow_id   uuid NOT NULL REFERENCES workflows(id),
  from_state    workflow_state NOT NULL,
  to_state      workflow_state NOT NULL,
  from_block    workflow_block,
  to_block      workflow_block,
  actor_type    actor_type NOT NULL,
  actor_id      text,
  approval_id   uuid REFERENCES approvals(id),
  job_id        uuid,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Spätere Automatik. In v1 vorhanden, aber deaktiviert und vom Code ignoriert.
CREATE TABLE automation_policies (
  id           serial PRIMARY KEY,
  from_state   workflow_state NOT NULL,
  to_state     workflow_state NOT NULL,
  enabled      boolean NOT NULL DEFAULT false,
  conditions   jsonb NOT NULL DEFAULT '{}',
  enabled_by   uuid REFERENCES admin_users(id),
  enabled_at   timestamptz,
  FOREIGN KEY (from_state, to_state) REFERENCES workflow_transitions(from_state, to_state),
  CHECK (NOT enabled OR (enabled_by IS NOT NULL AND enabled_at IS NOT NULL))
);

-- ───────────────────────── Jobs, Artefakte, Prüfungen ─────────────────────────

CREATE TABLE jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id      uuid REFERENCES workflows(id),
  kind             job_kind NOT NULL,
  status           job_status NOT NULL DEFAULT 'QUEUED',
  idempotency_key  text NOT NULL UNIQUE,       -- z. B. 'SLICE:<approval_id>'
  approval_id      uuid REFERENCES approvals(id), -- Freigabe, die diesen Job erlaubt
  input            jsonb NOT NULL DEFAULT '{}',
  input_hash       text,                       -- erwarteter Hash der Eingabedatei
  target           text NOT NULL DEFAULT 'SERVER' CHECK (target IN ('SERVER', 'AGENT')),
  attempt          int NOT NULL DEFAULT 0,
  lease_until      timestamptz,                -- abgelaufen ⇒ Job gilt als FAILED
  worker_id        text,
  error            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  started_at       timestamptz,
  finished_at      timestamptz,
  CHECK (kind NOT IN ('SLICE', 'HANDOFF') OR (approval_id IS NOT NULL AND input_hash IS NOT NULL AND target = 'AGENT'))
);
CREATE INDEX jobs_queue ON jobs (target, status, created_at) WHERE status = 'QUEUED';

CREATE TABLE artifacts (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id              uuid REFERENCES workflows(id),
  configuration_version_id uuid NOT NULL REFERENCES configuration_versions(id),
  kind                     artifact_kind NOT NULL,
  object_key               text NOT NULL UNIQUE,   -- Pfad im privaten Speicher, serverseitig vergeben
  sha256                   text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes               bigint NOT NULL CHECK (size_bytes > 0),
  produced_by_job_id       uuid REFERENCES jobs(id),
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE check_results (
  id           bigserial PRIMARY KEY,
  job_id       uuid NOT NULL REFERENCES jobs(id),
  artifact_id  uuid REFERENCES artifacts(id),
  check_name   text NOT NULL,                  -- z. B. 'single_body', 'min_feature_width'
  status       check_status NOT NULL,
  measured     jsonb,
  threshold    jsonb,
  message      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── E-Mail, Agent, Audit ─────────────────────────

CREATE TABLE emails (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id        uuid REFERENCES workflows(id),
  kind               text NOT NULL,            -- z. B. 'CAD_FILES', 'PRINT_PACKAGE'
  idempotency_key    text NOT NULL UNIQUE,     -- kein Doppelversand
  recipient          text NOT NULL,
  artifact_ids       uuid[] NOT NULL DEFAULT '{}',
  status             email_status NOT NULL DEFAULT 'PENDING',
  attempts           int NOT NULL DEFAULT 0,
  provider_message_id text,
  last_error         text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  sent_at            timestamptz
);

CREATE TABLE print_agents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL UNIQUE,
  public_key    bytea NOT NULL,               -- Ed25519
  is_enabled    boolean NOT NULL DEFAULT true,
  last_seen_at  timestamptz,
  reported_dry_run boolean,                   -- vom Agent gemeldeter Trockenlauf-Status
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE agent_nonces (                    -- Replay-Schutz
  agent_id   uuid NOT NULL REFERENCES print_agents(id),
  nonce      text NOT NULL,
  seen_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (agent_id, nonce)
);

CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  actor_type  actor_type NOT NULL,
  actor_id    text,
  action      text NOT NULL,                  -- z. B. 'LOGIN', 'APPROVE', 'POLICY_ENABLE'
  subject     text,
  details     jsonb,
  ip          inet,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── Schutz-Trigger ─────────────────────────

-- Unveränderliche Tabellen: kein UPDATE/DELETE.
CREATE FUNCTION forbid_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Tabelle % ist unveränderlich', TG_TABLE_NAME;
END $$;

CREATE TRIGGER approvals_immutable          BEFORE UPDATE OR DELETE ON approvals              FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER transitions_immutable        BEFORE UPDATE OR DELETE ON state_transitions      FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER audit_immutable              BEFORE UPDATE OR DELETE ON audit_log              FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER config_versions_immutable    BEFORE UPDATE OR DELETE ON configuration_versions FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER invalidations_immutable      BEFORE UPDATE OR DELETE ON approval_invalidations FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- Policies für Druckübertragung und Druckabschluss dürfen nie aktiviert werden.
CREATE FUNCTION guard_policy() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.enabled AND NOT (SELECT policy_allowed FROM workflow_transitions
                          WHERE from_state = NEW.from_state AND to_state = NEW.to_state) THEN
    RAISE EXCEPTION 'Automatik für % -> % ist nicht erlaubt', NEW.from_state, NEW.to_state;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER automation_policies_guard BEFORE INSERT OR UPDATE ON automation_policies
  FOR EACH ROW EXECUTE FUNCTION guard_policy();

-- Zustandswechsel nur entlang erlaubter Übergänge; Freigabe-Stufen nur mit gültiger, passender Freigabe.
-- Die Anwendung setzt vorher: SET LOCAL app.approval_id = '<uuid>' (falls Freigabe-Übergang).
CREATE FUNCTION guard_workflow_state() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  t        workflow_transitions%ROWTYPE;
  appr_id  uuid;
  appr     approvals%ROWTYPE;
BEGIN
  IF NEW.state = OLD.state THEN
    -- Kein Statuswechsel: nur Sperre/Metadaten. Zurücksetzen auf CONFIGURATION_CREATED läuft über reset_workflow().
    RETURN NEW;
  END IF;

  IF NEW.state = 'CANCELLED' THEN
    IF OLD.state = 'PRINT_COMPLETED' THEN
      RAISE EXCEPTION 'Abgeschlossener Workflow kann nicht abgebrochen werden';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.state = 'CANCELLED' THEN
    RAISE EXCEPTION 'Abgebrochener Workflow ist endgültig';
  END IF;

  IF current_setting('app.reset', true) = 'on' AND NEW.state = 'CONFIGURATION_CREATED' THEN
    RETURN NEW;                                   -- nur aus reset_workflow()
  END IF;

  IF OLD.block IS NOT NULL THEN
    RAISE EXCEPTION 'Workflow % ist gesperrt (%)', OLD.id, OLD.block;
  END IF;

  SELECT * INTO t FROM workflow_transitions WHERE from_state = OLD.state AND to_state = NEW.state;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unerlaubter Übergang % -> %', OLD.state, NEW.state;
  END IF;

  IF t.requires_approval THEN
    appr_id := nullif(current_setting('app.approval_id', true), '')::uuid;
    IF appr_id IS NULL THEN
      RAISE EXCEPTION 'Übergang % -> % braucht eine Freigabe', OLD.state, NEW.state;
    END IF;
    SELECT * INTO appr FROM approvals WHERE id = appr_id;
    IF NOT FOUND OR appr.workflow_id <> OLD.id OR appr.decision <> 'APPROVE'
       OR appr.from_state <> OLD.state OR appr.to_state <> NEW.state
       OR EXISTS (SELECT 1 FROM approval_invalidations WHERE approval_id = appr_id) THEN
      RAISE EXCEPTION 'Freigabe % passt nicht zum Übergang % -> %', appr_id, OLD.state, NEW.state;
    END IF;
    IF NEW.state = 'PRINT_TRANSFER_APPROVED' AND NOT appr.step_up THEN
      RAISE EXCEPTION 'Druckübertragung braucht Passkey-Bestätigung';
    END IF;
  END IF;

  NEW.row_version := OLD.row_version + 1;
  NEW.updated_at  := now();
  RETURN NEW;
END $$;
CREATE TRIGGER workflows_state_guard BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION guard_workflow_state();

-- Neuer Workflow beginnt immer am Anfang.
CREATE FUNCTION guard_workflow_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.state <> 'CONFIGURATION_CREATED' THEN
    RAISE EXCEPTION 'Neuer Workflow muss mit CONFIGURATION_CREATED beginnen';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER workflows_insert_guard BEFORE INSERT ON workflows
  FOR EACH ROW EXECUTE FUNCTION guard_workflow_insert();

-- Konfigurationsänderung: neue Version setzen, alle Freigaben entwerten, an den Anfang zurück.
CREATE FUNCTION reset_workflow(p_workflow uuid, p_new_version uuid, p_actor text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE old_state workflow_state;
BEGIN
  SELECT state INTO old_state FROM workflows WHERE id = p_workflow FOR UPDATE;
  IF old_state IN ('CANCELLED', 'PRINT_SUBMITTED', 'PRINT_COMPLETED') THEN
    RAISE EXCEPTION 'Workflow im Zustand % kann nicht mehr geändert werden', old_state;
  END IF;
  INSERT INTO approval_invalidations (approval_id, reason)
    SELECT a.id, 'CONFIGURATION_CHANGED' FROM approvals a
    WHERE a.workflow_id = p_workflow
      AND NOT EXISTS (SELECT 1 FROM approval_invalidations i WHERE i.approval_id = a.id);
  PERFORM set_config('app.reset', 'on', true);
  UPDATE workflows
     SET state = 'CONFIGURATION_CREATED', configuration_version_id = p_new_version,
         block = NULL, block_reason = NULL, row_version = row_version + 1, updated_at = now()
   WHERE id = p_workflow;
  PERFORM set_config('app.reset', 'off', true);
  INSERT INTO state_transitions (workflow_id, from_state, to_state, actor_type, actor_id, note)
    VALUES (p_workflow, old_state, 'CONFIGURATION_CREATED', 'USER', p_actor, 'Konfiguration geändert, Freigaben entwertet');
END $$;
