// Lokale PostgreSQL-Engine (PGlite) mit demselben Schema wie später im Betrieb.
// Beim Umzug auf den Server wird nur diese Datei auf eine echte Verbindung umgestellt.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import catalog from '../../../../config/katalog.json';

export const DATA_DIR = process.env.ORNAMENT_DATA_DIR ?? join(process.cwd(), '.data');

async function open() {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new PGlite(join(DATA_DIR, 'pg'));
  await db.waitReady;
  const { rows } = await db.query(`SELECT to_regclass('public.configurations') AS t`);
  if (!rows[0].t) {
    await db.exec(readFileSync(join(process.cwd(), '..', '..', 'db', 'schema.sql'), 'utf8'));
  }
  const content = JSON.stringify(catalog);
  const hash = createHash('sha256').update(content).digest('hex');
  await db.query(
    `INSERT INTO catalog_versions (version, content, content_hash, is_active)
     VALUES ($1, $2, $3, true) ON CONFLICT (version) DO NOTHING`,
    [catalog.version, content, hash],
  );
  return db;
}

export function getDb() {
  globalThis.__ornamentDb ??= open();
  return globalThis.__ornamentDb;
}
