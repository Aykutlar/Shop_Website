import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createGenerator } from './src/node.mjs';
import { validateParams } from './src/validate.mjs';

const catalog = JSON.parse(readFileSync(new URL('../../config/katalog.json', import.meta.url)));
const good = { name: 'Julia', font: 'pacifico', shape: 'wreath', frame: 'snowflakes', diameterMm: 80, thicknessMm: 3, nozzle: 'n04' };
const codes = (changes) => validateParams(catalog, { ...good, ...changes }).map((e) => e.code);

test('gültige Konfiguration hat keine Fehler', () => assert.deepEqual(codes({}), []));
test('Name zu lang', () => assert.ok(codes({ name: 'Maximiliane-Sophie' }).includes('NAME_TOO_LONG')));
test('Name zu kurz', () => assert.ok(codes({ name: 'A' }).includes('NAME_TOO_SHORT')));
test('Sonderzeichen', () => assert.ok(codes({ name: 'Jul<ia>' }).includes('NAME_CHARS')));
test('Emoji', () => assert.ok(codes({ name: 'Julia🎄' }).includes('NAME_CHARS')));
test('unbekannte Schrift', () => assert.ok(codes({ font: 'comic' }).includes('FONT_UNKNOWN')));
test('Größe nicht verfügbar', () => assert.ok(codes({ diameterMm: 300 }).includes('SIZE_UNKNOWN')));
test('Größe passt nicht zur Düse', () => assert.ok(codes({ diameterMm: 100, nozzle: 'n02', thicknessMm: 2 }).includes('SIZE_NOZZLE')));
test('Dicke nicht verfügbar', () => assert.ok(codes({ thicknessMm: 0.4 }).includes('THICKNESS')));
test('Jahreszahl auf Form ohne Platz', () => assert.ok(codes({ shape: 'star', frame: 'plain', year: 2026 }).includes('YEAR_SHAPE')));
test('Verzierung passt nicht zur Form', () => assert.ok(codes({ shape: 'star', frame: 'fir' }).includes('FRAME_UNKNOWN')));
test('Jahreszahl ungültig', () => assert.ok(codes({ year: 1800 }).includes('YEAR')));

test('Kern lehnt fehlendes Zeichen kontrolliert ab', async () => {
  const generate = await createGenerator();
  assert.throws(() => generate({ ...good, name: 'Jul中' }), (e) => e.code === 'UNSUPPORTED_CHAR');
});

test('gleiche Eingabe ergibt identische Kontur', async () => {
  const generate = await createGenerator();
  assert.deepEqual(generate(good).outline, generate(good).outline);
});
