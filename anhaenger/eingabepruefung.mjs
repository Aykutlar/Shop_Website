// Eingabeprüfung vor jeder Geometrie-Erzeugung; gleiche Regeln im Browser und auf dem Server.
// Jede Regel kommt aus dem Katalog, nichts ist hier fest verdrahtet.

export function validateParams(catalog, params) {
  const errors = [];
  const fail = (code, message) => errors.push({ code, message });
  const { name, font, shape, frame, symbol, diameterMm, thicknessMm, nozzle, year } = params;
  const t = catalog.text;

  if (typeof name !== 'string' || name.trim() !== name) fail('NAME_FORMAT', 'Name darf nicht mit Leerzeichen beginnen oder enden');
  else {
    const length = [...name].length;
    if (length < t.name_min_chars) fail('NAME_TOO_SHORT', `Mindestens ${t.name_min_chars} Zeichen`);
    if (length > t.name_max_chars) fail('NAME_TOO_LONG', `Höchstens ${t.name_max_chars} Zeichen`);
    if (!new RegExp(t.allowed_chars_regex, 'u').test(name)) fail('NAME_CHARS', 'Name enthält nicht unterstützte Zeichen');
  }

  const fontEntry = catalog.fonts.find((f) => f.id === font);
  if (!fontEntry) fail('FONT_UNKNOWN', 'Unbekannte Schriftart');
  else if (!fontEntry.nozzles.includes(nozzle)) fail('FONT_NOZZLE', 'Schrift für diese Düse nicht freigegeben');

  const shapeEntry = catalog.shapes.find((s) => s.id === shape);
  if (!shapeEntry) fail('SHAPE_UNKNOWN', 'Unbekannte Form');
  else if (!shapeEntry.frames.includes(frame)) fail('FRAME_UNKNOWN', 'Diese Verzierung passt nicht zur Form');

  if (symbol && !catalog.symbols.some((s) => s.id === symbol)) fail('SYMBOL_UNKNOWN', 'Unbekanntes Symbol');

  const size = catalog.sizes.find((s) => s.diameter_mm === diameterMm);
  if (!size) fail('SIZE_UNKNOWN', 'Größe nicht verfügbar');
  else if (!size.nozzles.includes(nozzle)) fail('SIZE_NOZZLE', 'Größe mit dieser Düse nicht verfügbar');

  if (!catalog.thickness_mm[nozzle]?.includes(thicknessMm)) fail('THICKNESS', 'Dicke nicht verfügbar');

  if (year !== undefined && year !== null) {
    const y = t.year;
    if (!Number.isInteger(year) || year < y.min || year > y.max) fail('YEAR', `Jahreszahl ${y.min}–${y.max}`);
    if (shapeEntry && !shapeEntry.supports_year) fail('YEAR_SHAPE', 'Diese Form hat keinen Platz für eine Jahreszahl');
  }
  return errors;
}
