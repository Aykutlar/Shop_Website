// Macht aus einer Etsy-Bestellung die Druckdateien, prüft sie und schreibt den Beipackzettel.
//
// Aufruf (Beispiel):
//   npm run auftrag -- --angebot kranz-schneeflocken --name Julia --groesse Mittel --farbe Gold --jahr 2026 --bestellung 3456789012
//
// Pflicht: --angebot, --name, --groesse, --farbe
// Optional: --schrift (Pacifico, "Dancing Script", Nunito), --jahr, --bestellung (Etsy-Bestellnummer), --anzahl
// Ergebnis: Ordner auftraege/<bestellung>-<name>/ mit model.stl, preview.png, qc_report.json, beipackzettel.txt
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { createGenerator, writeArtifacts } from './erzeugen.mjs';
import { validateParams } from './eingabepruefung.mjs';

const lies = (pfad) => JSON.parse(readFileSync(new URL(pfad, import.meta.url), 'utf8'));
const catalog = lies('../einstellungen/katalog.json');
const { angebote, standard } = lies('../einstellungen/etsy-angebote.json');
const gesperrt = readFileSync(new URL('../einstellungen/gesperrte-woerter.txt', import.meta.url), 'utf8')
  .split('\n').map((z) => z.trim().toLowerCase()).filter((z) => z && !z.startsWith('#'));

function abbrechen(meldung) {
  console.error(`\nFEHLER: ${meldung}\n`);
  process.exit(1);
}

const { values: a } = parseArgs({
  options: {
    angebot: { type: 'string' }, name: { type: 'string' }, groesse: { type: 'string' },
    farbe: { type: 'string' }, schrift: { type: 'string' }, jahr: { type: 'string' },
    bestellung: { type: 'string' }, anzahl: { type: 'string', default: '1' },
  },
});

// Erlaubt IDs ("gold"), Bezeichnungen ("Gold") und Größen in mm ("80").
const klein = (s) => String(s ?? '').trim().toLowerCase();
const finde = (liste, eingabe, felder) => liste.find((e) => felder.some((f) => klein(e[f]) === klein(eingabe)));
const optionen = (liste, feld = 'label') => liste.map((e) => e[feld]).join(', ');

const angebot = angebote[a.angebot];
if (!angebot) abbrechen(`--angebot muss eines davon sein: ${Object.keys(angebote).join(', ')}`);
if (!a.name) abbrechen('--name fehlt (genau so, wie der Kunde ihn geschrieben hat; Leerzeichen in Anführungszeichen setzen).');

const groesse = finde(catalog.sizes, a.groesse, ['id', 'label', 'diameter_mm']);
if (!groesse) abbrechen(`--groesse unbekannt. Möglich: ${optionen(catalog.sizes)}`);
const farbe = finde(catalog.colors, a.farbe, ['id', 'label']);
if (!farbe) abbrechen(`--farbe unbekannt. Möglich: ${optionen(catalog.colors)}`);
const schrift = a.schrift ? finde(catalog.fonts, a.schrift, ['id', 'label', 'family']) : finde(catalog.fonts, standard.schrift, ['id']);
if (!schrift) abbrechen(`--schrift unbekannt. Möglich: ${optionen(catalog.fonts)}`);

const anzahl = Number(a.anzahl);
if (!Number.isInteger(anzahl) || anzahl < 1 || anzahl > catalog.quantity.max) abbrechen(`--anzahl 1 bis ${catalog.quantity.max}`);

const params = {
  name: a.name,
  font: schrift.id,
  shape: angebot.shape,
  frame: angebot.frame,
  symbol: angebot.symbol,
  diameterMm: groesse.diameter_mm,
  thicknessMm: standard.staerke_mm,
  nozzle: standard.duese,
  ...(a.jahr ? { year: Number(a.jahr) } : {}),
};

const fehler = validateParams(catalog, params);
if (fehler.length) abbrechen(`Name oder Auswahl passt nicht:\n  - ${fehler.map((f) => f.message).join('\n  - ')}\nBitte beim Kunden über Etsy-Nachrichten nachfragen.`);
const treffer = gesperrt.find((w) => klein(a.name).includes(w));
if (treffer) abbrechen(`Der Name enthält einen gesperrten Begriff („${treffer}“). Nicht fertigen, Bestellung über Etsy klären.`);

const kennung = a.bestellung ? `ETSY-${a.bestellung.replace(/\D/g, '')}` : `OHNE-NR-${new Date().toISOString().slice(0, 10)}`;
const ordnerName = `${kennung}-${a.name.normalize('NFD').replace(/[^\w-]+/g, '')}`;
const ordner = join('auftraege', ordnerName);

console.log(`\nErzeuge ${angebot.titel} · „${a.name}“ · ${groesse.label} ${groesse.diameter_mm} mm · ${farbe.label} · ${schrift.label}${a.jahr ? ` · ${a.jahr}` : ''}`);
const generate = await createGenerator();
let ergebnis;
try {
  ergebnis = generate(params);
} catch (e) {
  abbrechen(`Berechnung fehlgeschlagen: ${e.message}`);
}
writeArtifacts(ergebnis, params, ordner);

const material = catalog.materials[farbe.material]?.label.split(' – ')[0] ?? farbe.material;
const L = catalog.legal;
writeFileSync(join(ordner, 'beipackzettel.txt'), [
  `Personalisierter Weihnachtsanhänger „${a.name}“`,
  `Artikel: ${angebot.titel}, ${groesse.diameter_mm} mm, ${farbe.label}`,
  `Material: ${material} (3D-Druck)`,
  `Kennung: ${kennung}`,
  '',
  ...L.warnings_de,
  '',
  `Hersteller: ${L.manufacturer.name}, ${L.manufacturer.address}, ${L.manufacturer.email}`,
  '',
].join('\n'));
writeFileSync(join(ordner, 'auftrag.json'), `${JSON.stringify({
  kennung, angebot: a.angebot, anzahl, farbe: farbe.id, filament: catalog.materials[farbe.material]?.slicer_filament_key, params,
}, null, 2)}\n`);

const qc = spawnSync('python', ['pruefung/check_model.py', ordner], { encoding: 'utf8' });
if (qc.error) {
  console.log('\nWARNUNG: Python nicht gefunden, die Qualitätsprüfung wurde NICHT ausgeführt. Nicht ungeprüft drucken.');
  process.exit(2);
}
console.log(qc.stdout.trim() || qc.stderr.trim());
if (!ergebnis.meta.printable || qc.status !== 0) {
  console.log(`\nNICHT DRUCKEN: Die Prüfung hat Probleme gefunden. Details: ${join(ordner, 'qc_report.json')}`);
  console.log('Meist hilft eine größere Ausführung oder eine andere Schrift. Bitte mit dem Kunden über Etsy klären.');
  process.exit(1);
}
console.log(`\nFERTIG: ${ordner}`);
console.log(`  1. preview.png ansehen: Stimmt die Schreibweise genau mit der Bestellung überein?`);
console.log(`  2. model.stl in Bambu Studio öffnen, Filament ${farbe.label} (${material}), ${anzahl}× drucken.`);
console.log(`  3. beipackzettel.txt ausdrucken und beilegen.`);
