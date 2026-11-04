import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { LAGER } from '../../einstellungen/lager.js';
import { lieferbareFarben, materialien, pruefeRolle } from './lager-pruefung.mjs';

const catalog = JSON.parse(readFileSync(new URL('../../einstellungen/katalog.json', import.meta.url), 'utf8'));

const gut = {
  material: 'petg', farbe: 'Gold', hex: '#c9a13b', hersteller: 'Bambu Lab',
  restGramm: 1000, amsPlatz: '2', shopFarbe: 'gold', notiz: '',
};

test('eine vollständige Rolle wird angenommen und vereinheitlicht', () => {
  const { fehler, werte } = pruefeRolle(catalog, LAGER, gut);
  assert.deepEqual(fehler, []);
  assert.equal(werte.hex, '#C9A13B');
  assert.equal(werte.amsPlatz, 2);
});

test('Rollen ohne Shop-Farbe und ohne AMS-Platz sind erlaubt', () => {
  const { fehler, werte } = pruefeRolle(catalog, LAGER, { ...gut, material: 'pla', shopFarbe: '', amsPlatz: '' });
  assert.deepEqual(fehler, []);
  assert.equal(werte.shopFarbe, null);
  assert.equal(werte.amsPlatz, null);
});

test('falsche Eingaben werden mit Meldung abgelehnt', () => {
  const faelle = [
    { material: 'holz' },
    { farbe: '' },
    { hex: 'gold' },
    { restGramm: -1 },
    { restGramm: 2.5 },
    { amsPlatz: catalog.printer.ams_slots + 1 },
    { shopFarbe: 'lila' },
    { notiz: 'x'.repeat(301) },
  ];
  for (const fall of faelle) {
    assert.equal(pruefeRolle(catalog, LAGER, { ...gut, ...fall }).fehler.length, 1, JSON.stringify(fall));
  }
});

test('eine PLA-Rolle kann keine PETG-Shop-Farbe freischalten', () => {
  const { fehler } = pruefeRolle(catalog, LAGER, { ...gut, material: 'pla' });
  assert.match(fehler[0], /Shop-Farbe/);
});

test('Shop-Materialien kommen aus dem Katalog, weitere aus den Einstellungen', () => {
  const liste = materialien(catalog, LAGER);
  assert.equal(liste.petg, 'PETG');
  assert.equal(liste.pla, 'PLA');
});

test('nur Farben mit genug Rest sind lieferbar', () => {
  const rollen = [
    { material: 'petg', shopFarbe: 'gold', restGramm: LAGER.mindestRestGramm },
    { material: 'petg', shopFarbe: 'red', restGramm: LAGER.mindestRestGramm - 1 },
    { material: 'petg', shopFarbe: null, restGramm: 1000 },
  ];
  assert.deepEqual(lieferbareFarben(catalog, LAGER, rollen), ['gold']);
});

test('ein leeres Lager bietet keine Farbe an', () => {
  assert.deepEqual(lieferbareFarben(catalog, LAGER, []), []);
});
