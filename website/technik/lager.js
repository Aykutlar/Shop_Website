// Lesen und Schreiben des Filamentlagers. Geprüft wird vorher in lager-pruefung.mjs.
import catalog from '../../einstellungen/katalog.json';
import { LAGER } from '../../einstellungen/lager';
import { getDb } from './datenbank.js';
import { lieferbareFarben } from './lager-pruefung.mjs';

const SPALTEN = `id, material, color_label, hex, brand, remaining_g, ams_slot, catalog_color_id, note, updated_at`;

const alsRolle = (r) => ({
  id: r.id,
  material: r.material,
  farbe: r.color_label,
  hex: r.hex,
  hersteller: r.brand,
  restGramm: r.remaining_g,
  amsPlatz: r.ams_slot,
  shopFarbe: r.catalog_color_id,
  notiz: r.note,
  geaendert: new Date(r.updated_at).toISOString(),
});

const alsSpalten = (w) => [w.material, w.farbe, w.hex, w.hersteller, w.restGramm, w.amsPlatz, w.shopFarbe, w.notiz];

export async function alleRollen() {
  const db = await getDb();
  const { rows } = await db.query(
    `SELECT ${SPALTEN} FROM filament_spools ORDER BY ams_slot NULLS LAST, material, color_label, created_at`,
  );
  return rows.map(alsRolle);
}

export async function rolleAnlegen(werte) {
  const db = await getDb();
  const { rows } = await db.query(
    `INSERT INTO filament_spools (material, color_label, hex, brand, remaining_g, ams_slot, catalog_color_id, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ${SPALTEN}`,
    alsSpalten(werte),
  );
  return alsRolle(rows[0]);
}

export async function rolleAendern(id, werte) {
  const db = await getDb();
  const { rows } = await db.query(
    `UPDATE filament_spools SET material = $1, color_label = $2, hex = $3, brand = $4, remaining_g = $5,
       ams_slot = $6, catalog_color_id = $7, note = $8, updated_at = now()
     WHERE id = $9 RETURNING ${SPALTEN}`,
    [...alsSpalten(werte), id],
  );
  return rows[0] ? alsRolle(rows[0]) : null;
}

export async function rolleLoeschen(id) {
  const db = await getDb();
  const { rows } = await db.query('DELETE FROM filament_spools WHERE id = $1 RETURNING id', [id]);
  return rows.length > 0;
}

export async function lieferbar() {
  return lieferbareFarben(catalog, LAGER, await alleRollen());
}
