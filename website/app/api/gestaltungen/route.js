import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { toSvg } from '../../../../anhaenger/dateiformate.mjs';
import { GEOMETRY_VERSION } from '../../../../anhaenger/berechnung.mjs';
import { createGenerator } from '../../../../anhaenger/erzeugen.mjs';
import { validateParams } from '../../../../anhaenger/eingabepruefung.mjs';
import { generateCode } from '../../../technik/code.mjs';
import { DATA_DIR, getDb } from '../../../technik/datenbank.js';
import { PROJEKT } from '../../../technik/pfade.js';
import catalog from '../../../../einstellungen/katalog.json';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 30;
const MAX_BODY_BYTES = 2000;
const NOZZLE = 'n04'; // Feine Ausführung kommt erst nach den Testdrucken

const attempts = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const blocklist = () => readFileSync(join(PROJEKT, 'einstellungen', 'gesperrte-woerter.txt'), 'utf8')
  .split('\n').map((l) => l.trim().toLowerCase()).filter((l) => l && !l.startsWith('#'));

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

function etsyUrl(size) {
  if (size.etsy_listing_id) return `https://www.etsy.com/listing/${size.etsy_listing_id}`;
  return process.env.ETSY_SHOP_URL || null;
}

const refuse = (message, status = 422) => NextResponse.json({ error: message }, { status });

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';
  if (rateLimited(ip)) return refuse('Zu viele Anfragen. Bitte versuchen Sie es später erneut.', 429);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return refuse('Anfrage zu groß.', 413);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return refuse('Ungültige Anfrage.', 400);
  }

  // Nur bekannte Felder übernehmen; Preis und Düse bestimmt allein der Server.
  const { name, font, shape, frame, symbol, color, diameterMm, thicknessMm, quantity } = body ?? {};
  const year = body?.year ?? undefined;
  const params = { name, font, shape, frame, symbol: symbol ?? 'none', diameterMm, thicknessMm, nozzle: NOZZLE, ...(year ? { year } : {}) };

  const errors = validateParams(catalog, params);
  if (errors.length) return refuse(errors[0].message);
  if (!catalog.colors.some((c) => c.id === color && c.in_stock)) return refuse('Farbe nicht verfügbar.');
  const { min, max } = catalog.quantity;
  if (!Number.isInteger(quantity) || quantity < min || quantity > max) return refuse(`Anzahl ${min}–${max}.`);

  const lowered = name.toLowerCase();
  if (blocklist().some((term) => lowered.includes(term))) {
    return refuse('Dieser Schriftzug kann leider nicht gefertigt werden.');
  }

  globalThis.__ornamentGenerator ??= createGenerator();
  const generate = await globalThis.__ornamentGenerator;
  let result;
  try {
    result = generate(params);
  } catch (error) {
    if (error.code) return refuse(error.message);
    throw error;
  }
  if (!result.meta.printable) {
    return refuse('Diese Kombination wäre zu filigran für den Druck. Bitte wählen Sie eine größere Ausführung oder einen kürzeren Namen.');
  }

  const size = catalog.sizes.find((s) => s.diameter_mm === diameterMm);
  const stored = { ...params, color };
  const svg = toSvg(result.outline);
  const code = generateCode(randomBytes);

  const db = await getDb();
  await db.transaction(async (tx) => {
    const { rows: [catalogRow] } = await tx.query('SELECT id FROM catalog_versions WHERE is_active');
    const { rows: [config] } = await tx.query(
      `INSERT INTO configurations (public_code, expires_at) VALUES ($1, now() + interval '90 days') RETURNING id`,
      [code],
    );
    const { rows: [version] } = await tx.query(
      `INSERT INTO configuration_versions
         (configuration_id, version_no, catalog_version_id, geometry_version, params, params_hash, quantity, unit_price_cents, currency, etsy_listing_id, created_by)
       VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9, 'SYSTEM') RETURNING id`,
      [config.id, catalogRow.id, GEOMETRY_VERSION, JSON.stringify(stored), sha256(canonical(stored)), quantity, size.unit_price_cents, catalog.currency, size.etsy_listing_id],
    );
    const { rows: [workflow] } = await tx.query(
      'INSERT INTO workflows (configuration_id, configuration_version_id) VALUES ($1, $2) RETURNING id',
      [config.id, version.id],
    );
    await tx.query(
      `INSERT INTO artifacts (workflow_id, configuration_version_id, kind, object_key, sha256, size_bytes)
       VALUES ($1, $2, 'LAYOUT_SVG', $3, $4, $5)`,
      [workflow.id, version.id, `${config.id}/v1/layout.svg`, sha256(svg), Buffer.byteLength(svg)],
    );
    const dir = join(DATA_DIR, 'artifacts', config.id, 'v1');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'layout.svg'), svg);
  });

  return NextResponse.json({
    code,
    unitPriceCents: size.unit_price_cents,
    totalCents: size.unit_price_cents * quantity,
    etsyUrl: etsyUrl(size),
  }, { status: 201 });
}
