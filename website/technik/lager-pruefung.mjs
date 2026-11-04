// Prüft eine Rolle aus dem Lagerformular und berechnet, welche Shop-Farben lieferbar sind.
// Reine Funktionen ohne Datenbank, damit sie sich direkt testen lassen.

export function materialien(catalog, lager) {
  const ausKatalog = Object.fromEntries(
    Object.entries(catalog.materials).map(([id, m]) => [id, m.label.split(' – ')[0]]),
  );
  return { ...ausKatalog, ...Object.fromEntries(
    Object.entries(lager.weitereMaterialien).filter(([id]) => !(id in ausKatalog)),
  ) };
}

const text = (wert) => (typeof wert === 'string' ? wert.trim() : '');

export function pruefeRolle(catalog, lager, eingabe) {
  const fehler = [];
  const e = eingabe ?? {};
  const erlaubt = materialien(catalog, lager);

  const material = text(e.material);
  if (!(material in erlaubt)) fehler.push('Bitte ein Material wählen.');

  const farbe = text(e.farbe);
  if (farbe.length < 1 || farbe.length > 40) fehler.push('Farbname: 1 bis 40 Zeichen.');

  const hex = text(e.hex).toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(hex)) fehler.push('Farbcode im Format #RRGGBB, z. B. #C9A13B.');

  const hersteller = text(e.hersteller);
  if (hersteller.length > 60) fehler.push('Hersteller: höchstens 60 Zeichen.');

  const rest = Number(e.restGramm);
  if (!Number.isInteger(rest) || rest < 0 || rest > 5000) fehler.push('Restmenge: ganze Zahl von 0 bis 5000 g.');

  let amsPlatz = null;
  if (e.amsPlatz !== null && e.amsPlatz !== undefined && e.amsPlatz !== '') {
    amsPlatz = Number(e.amsPlatz);
    const plaetze = catalog.printer.ams_slots;
    if (!Number.isInteger(amsPlatz) || amsPlatz < 1 || amsPlatz > plaetze) {
      fehler.push(`AMS-Platz: 1 bis ${plaetze} oder leer.`);
    }
  }

  let shopFarbe = null;
  if (e.shopFarbe) {
    const eintrag = catalog.colors.find((c) => c.id === e.shopFarbe);
    if (!eintrag) fehler.push('Unbekannte Shop-Farbe.');
    else if (material in erlaubt && eintrag.material !== material) {
      fehler.push(`Die Shop-Farbe „${eintrag.label}“ ist ${erlaubt[eintrag.material] ?? eintrag.material}, diese Rolle aber ${erlaubt[material]}.`);
    } else shopFarbe = eintrag.id;
  }

  const notiz = text(e.notiz);
  if (notiz.length > 300) fehler.push('Notiz: höchstens 300 Zeichen.');

  return {
    fehler,
    werte: { material, farbe, hex, hersteller, restGramm: rest, amsPlatz, shopFarbe, notiz },
  };
}

// Eine Shop-Farbe ist lieferbar, wenn sie im Katalog angeboten wird, ihr Material
// freigeschaltet ist und mindestens eine verknüpfte Rolle genug Rest hat.
export function lieferbareFarben(catalog, lager, rollen) {
  return catalog.colors
    .filter((c) => c.in_stock && catalog.materials[c.material]?.enabled)
    .filter((c) => rollen.some((r) => r.shopFarbe === c.id && r.material === c.material && r.restGramm >= lager.mindestRestGramm))
    .map((c) => c.id);
}
