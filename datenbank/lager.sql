-- Filamentlager: eine Zeile pro Rolle.
-- Wird bei jedem Start ausgeführt und ist deshalb wiederholbar (IF NOT EXISTS).
-- Eine Shop-Farbe gilt als lieferbar, solange mindestens eine verknüpfte Rolle
-- genug Rest hat (siehe einstellungen/lager.js).

CREATE TABLE IF NOT EXISTS filament_spools (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material         text NOT NULL CHECK (material ~ '^[a-z0-9_]{1,40}$'),
  color_label      text NOT NULL CHECK (length(color_label) BETWEEN 1 AND 40),
  hex              text NOT NULL CHECK (hex ~ '^#[0-9A-F]{6}$'),
  brand            text NOT NULL DEFAULT '' CHECK (length(brand) <= 60),
  remaining_g      integer NOT NULL CHECK (remaining_g BETWEEN 0 AND 5000),
  ams_slot         smallint CHECK (ams_slot BETWEEN 1 AND 16),
  catalog_color_id text CHECK (catalog_color_id ~ '^[a-z0-9_]{1,40}$'),
  note             text NOT NULL DEFAULT '' CHECK (length(note) <= 300),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Ein AMS-Platz kann nur eine Rolle halten.
CREATE UNIQUE INDEX IF NOT EXISTS filament_spools_ams_slot_key
  ON filament_spools (ams_slot) WHERE ams_slot IS NOT NULL;

CREATE INDEX IF NOT EXISTS filament_spools_catalog_color_idx
  ON filament_spools (catalog_color_id) WHERE catalog_color_id IS NOT NULL;
