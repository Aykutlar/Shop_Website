// Lokale PostgreSQL-Engine (PGlite) mit demselben Schema wie später im Betrieb.
// Beim Umzug auf den Server wird nur diese Datei auf eine echte Verbindung umgestellt.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import catalog from '../../einstellungen/katalog.json';
import { LAGER } from '../../einstellungen/lager';
import { PROJEKT } from './pfade.js';

export const DATA_DIR = process.env.ORNAMENT_DATA_DIR ?? join(PROJEKT, '.data');

async function open() {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new PGlite(join(DATA_DIR, 'pg'));
  await db.waitReady;
  const { rows } = await db.query(`SELECT to_regclass('public.configurations') AS t`);
  if (!rows[0].t) {
    await db.exec(readFileSync(join(PROJEKT, 'datenbank', 'schema.sql'), 'utf8'));
  }
  const content = JSON.stringify(catalog);
  const hash = createHash('sha256').update(content).digest('hex');
  await db.query(
    `INSERT INTO catalog_versions (version, content, content_hash, is_active)
     VALUES ($1, $2, $3, true) ON CONFLICT (version) DO NOTHING`,
    [catalog.version, content, hash],
  );
  await lagerEinrichten(db);
  return db;
}

// Legt das Filamentlager an. Beim allerersten Mal werden die lieferbaren Katalogfarben
// als je eine Rolle übernommen, damit der Shop nicht plötzlich ohne Farben dasteht.
async function lagerEinrichten(db) {
  const { rows } = await db.query(`SELECT to_regclass('public.filament_spools') AS t`);
  await db.exec(readFileSync(join(PROJEKT, 'datenbank', 'lager.sql'), 'utf8'));
  if (rows[0].t) return;
  for (const farbe of catalog.colors.filter((c) => c.in_stock)) {
    await db.query(
      `INSERT INTO filament_spools (material, color_label, hex, remaining_g, catalog_color_id, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [farbe.material, farbe.label, farbe.hex.toUpperCase(), LAGER.neueRolleGramm, farbe.id, 'Aus katalog.json übernommen – Menge bitte prüfen'],
    );
  }
}

export function getDb() {
  // Schlägt das Öffnen fehl, wird der nächste Aufruf neu versuchen statt dauerhaft zu scheitern.
  globalThis.__ornamentDb ??= open().catch((fehler) => {
    globalThis.__ornamentDb = undefined;
    throw fehler;
  });
  return globalThis.__ornamentDb;
}
