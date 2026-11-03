import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const db = new PGlite();
await db.exec(readFileSync(process.argv[2], 'utf8'));

let pass = 0, fail = 0;
const ok = (name) => { pass++; console.log('PASS', name); };
const bad = (name, e) => { fail++; console.log('FAIL', name, e ?? ''); };
async function expectError(name, sql, re) {
  try { await db.exec(sql); bad(name, '(kein Fehler)'); }
  catch (e) { re.test(e.message) ? ok(name) : bad(name, e.message); }
}
async function expectOk(name, sql) {
  try { await db.exec(sql); ok(name); } catch (e) { bad(name, e.message); }
}
const one = async (sql) => (await db.query(sql)).rows[0];

// Grunddaten
const user = await one(`INSERT INTO admin_users (email) VALUES ('admin@test') RETURNING id`);
await db.exec(`INSERT INTO catalog_versions (version, content, content_hash, is_active) VALUES ('2026.1', '{}', 'x', true)`);
const cfg = await one(`INSERT INTO configurations (public_code) VALUES ('WX-7K3M-9QF2') RETURNING id`);
const ver = await one(`INSERT INTO configuration_versions (configuration_id, version_no, catalog_version_id, geometry_version, params, params_hash, quantity, unit_price_cents)
  VALUES ('${cfg.id}', 1, 1, '0.1.0', '{"name":"Julia"}', 'h1', 1, 1490) RETURNING id`);
const wf = await one(`INSERT INTO workflows (configuration_id, configuration_version_id) VALUES ('${cfg.id}', '${ver.id}') RETURNING id`);
const W = wf.id;

await expectError('Ungültiger Code wird abgelehnt', `INSERT INTO configurations (public_code) VALUES ('WX-ILOU-0000')`, /check/i);
await expectError('Workflow kann nicht mitten in der Kette starten',
  `INSERT INTO workflows (configuration_id, configuration_version_id, state) VALUES ('${cfg.id}', '${ver.id}', 'CAD_APPROVED')`, /beginnen/);
await expectError('Stufe überspringen verboten', `UPDATE workflows SET state='ORDER_MATCHED' WHERE id='${W}'`, /Unerlaubter/);
await expectError('Freigabe-Stufe ohne Freigabe verboten', `UPDATE workflows SET state='CONFIGURATION_APPROVED' WHERE id='${W}'`, /braucht eine Freigabe/);

const approve = async (from, to, stepUp = false) => (await one(`INSERT INTO approvals (workflow_id, from_state, to_state, decision, target_hash, actor_type, user_id, step_up)
  VALUES ('${W}', '${from}', '${to}', 'APPROVE', 'hash', 'USER', '${user.id}', ${stepUp}) RETURNING id`)).id;
const move = (to, approvalId) => `BEGIN; SELECT set_config('app.approval_id', '${approvalId ?? ''}', true); UPDATE workflows SET state='${to}' WHERE id='${W}'; COMMIT;`;

const wrongA = await approve('ORDER_MATCHED', 'ORDER_APPROVED');
await expectError('Freigabe für falschen Übergang verboten', move('CONFIGURATION_APPROVED', wrongA), /passt nicht/);
await db.exec('ROLLBACK').catch(() => {});

await expectError('Approval für nicht existierenden Übergang verboten',
  `INSERT INTO approvals (workflow_id, from_state, to_state, decision, target_hash, actor_type, user_id) VALUES ('${W}','CONFIGURATION_CREATED','CAD_APPROVED','APPROVE','h','USER','${user.id}')`, /foreign key/i);
await expectError('Ablehnung ohne Begründung verboten',
  `INSERT INTO approvals (workflow_id, from_state, to_state, decision, target_hash, actor_type, user_id) VALUES ('${W}','CONFIGURATION_CREATED','CONFIGURATION_APPROVED','REJECT','h','USER','${user.id}')`, /check/i);

const a1 = await approve('CONFIGURATION_CREATED', 'CONFIGURATION_APPROVED');
await expectOk('Gültige Freigabe CONFIGURATION_APPROVED', move('CONFIGURATION_APPROVED', a1));
await expectOk('System: ORDER_MATCHED ohne Freigabe', move('ORDER_MATCHED'));

await db.exec(`UPDATE workflows SET block='NEEDS_CLARIFICATION', block_reason='Preis weicht ab' WHERE id='${W}'`);
const a2 = await approve('ORDER_MATCHED', 'ORDER_APPROVED');
await expectError('Gesperrter Workflow kann nicht weiter', move('ORDER_APPROVED', a2), /gesperrt/);
await db.exec('ROLLBACK').catch(() => {});
await db.exec(`UPDATE workflows SET block=NULL, block_reason=NULL WHERE id='${W}'`);
await expectOk('Nach Klärung weiter mit Freigabe', move('ORDER_APPROVED', a2));

await expectError('Freigabe ist unveränderlich', `UPDATE approvals SET decision='REJECT', reason='x' WHERE id='${a2}'`, /unveränderlich/);
await expectError('Freigabe nicht löschbar', `DELETE FROM approvals WHERE id='${a2}'`, /unveränderlich/);
await expectError('Konfigurationsversion unveränderlich', `UPDATE configuration_versions SET params='{"name":"X"}'`, /unveränderlich/);

// bis SLICING_APPROVED
await db.exec(move('CAD_GENERATED'));
await db.exec(move('CAD_APPROVED', await approve('CAD_GENERATED', 'CAD_APPROVED')));
await db.exec(move('SLICING_COMPLETED'));
await db.exec(move('SLICING_APPROVED', await approve('SLICING_COMPLETED', 'SLICING_APPROVED')));
const noStep = await approve('SLICING_APPROVED', 'PRINT_TRANSFER_APPROVED', false);
await expectError('Druckübertragung ohne Passkey verboten', move('PRINT_TRANSFER_APPROVED', noStep), /Passkey/);
await db.exec('ROLLBACK').catch(() => {});

// Konfigurationsänderung entwertet Freigaben
const ver2 = await one(`INSERT INTO configuration_versions (configuration_id, version_no, catalog_version_id, geometry_version, params, params_hash, quantity, unit_price_cents)
  VALUES ('${cfg.id}', 2, 1, '0.1.0', '{"name":"Julie"}', 'h2', 1, 1490) RETURNING id`);
await expectOk('Reset bei Konfigurationsänderung', `SELECT reset_workflow('${W}', '${ver2.id}', 'admin')`);
const st = await one(`SELECT state FROM workflows WHERE id='${W}'`);
st.state === 'CONFIGURATION_CREATED' ? ok('Zustand zurück auf CONFIGURATION_CREATED') : bad('Zustand nach Reset', st.state);
const inv = await one(`SELECT count(*)::int n FROM approvals a WHERE workflow_id='${W}' AND NOT EXISTS (SELECT 1 FROM approval_invalidations i WHERE i.approval_id=a.id)`);
inv.n === 0 ? ok('Alle alten Freigaben entwertet') : bad('Gültige Freigaben nach Reset', inv.n);
await expectError('Entwertete Freigabe nicht wiederverwendbar', move('CONFIGURATION_APPROVED', a1), /passt nicht/);
await db.exec('ROLLBACK').catch(() => {});
await expectError('Reset nur über reset_workflow()', `SELECT set_config('app.reset','off',false); UPDATE workflows SET state='CONFIGURATION_CREATED', block=NULL WHERE id='${W}' AND false; UPDATE workflows SET state='ORDER_MATCHED' WHERE id='${W}'`, /Unerlaubter/);

// Doppelte Verarbeitung
await expectError('Zweiter aktiver Workflow mit gleichem Code verboten',
  `INSERT INTO workflows (configuration_id, configuration_version_id) VALUES ('${cfg.id}', '${ver2.id}')`, /duplicate|unique/i);
await db.exec(`INSERT INTO jobs (kind, idempotency_key) VALUES ('CAD_GENERATE', 'CAD:x')`);
await expectError('Doppelter Job verboten', `INSERT INTO jobs (kind, idempotency_key) VALUES ('CAD_GENERATE', 'CAD:x')`, /duplicate|unique/i);
await expectError('Agent-Job ohne Freigabe+Hash verboten', `INSERT INTO jobs (kind, idempotency_key, target) VALUES ('HANDOFF', 'H:1', 'AGENT')`, /check/i);
await db.exec(`INSERT INTO etsy_webhook_events (event_id, event_type, signature_ok) VALUES ('evt1', 'order.paid', true)`);
await expectError('Doppeltes Webhook-Ereignis verboten', `INSERT INTO etsy_webhook_events (event_id, event_type, signature_ok) VALUES ('evt1', 'order.paid', true)`, /duplicate|unique/i);

// Automatik
await expectOk('Policy deaktiviert anlegbar', `INSERT INTO automation_policies (from_state, to_state) VALUES ('CAD_GENERATED','CAD_APPROVED')`);
await expectError('Policy für Druckübertragung nie aktivierbar',
  `INSERT INTO automation_policies (from_state, to_state, enabled, enabled_by, enabled_at) VALUES ('SLICING_APPROVED','PRINT_TRANSFER_APPROVED', true, '${user.id}', now())`, /nicht erlaubt/);
await expectError('Policy-Aktivierung ohne Urheber verboten', `UPDATE automation_policies SET enabled=true`, /check/i);

// Abbruch endgültig
await expectOk('Abbrechen', `UPDATE workflows SET state='CANCELLED' WHERE id='${W}'`);
await expectError('Abgebrochen bleibt abgebrochen', `UPDATE workflows SET state='CONFIGURATION_APPROVED' WHERE id='${W}'`, /endgültig/);

const hist = await one(`SELECT count(*)::int n FROM state_transitions WHERE workflow_id='${W}'`);
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen (Historie-Einträge aus reset: ${hist.n})`);
process.exit(fail ? 1 : 0);
