// ─────────────────────────────────────────────────────────────
//  DEKORATION UND STARTANSICHT
//
//  Zahlen und true/false darfst du frei ändern.
//  true = eingeschaltet, false = ausgeschaltet
// ─────────────────────────────────────────────────────────────

export const DEKO = {
  schneeAn: true,
  schneeflocken: 70, // Anzahl gleichzeitig; 30 = wenig, 150 = Schneesturm

  girlandeAn: true,
  lichter: 19, // Anzahl der Lichter auf der Girlande

  // Kugeln an der Girlande.
  // x: Position von links (0 bis 1000), groesse: Radius, faden: Länge des Fadens
  // farbe: 'gold' oder 'wein'
  kugeln: [
    { x: 96, groesse: 15, faden: 40, farbe: 'gold' },
    { x: 214, groesse: 11, faden: 30, farbe: 'wein' },
    { x: 332, groesse: 13, faden: 46, farbe: 'gold' },
    { x: 668, groesse: 13, faden: 44, farbe: 'wein' },
    { x: 790, groesse: 11, faden: 30, farbe: 'gold' },
    { x: 908, groesse: 15, faden: 40, farbe: 'wein' },
  ],
};

// So sieht der Anhänger aus, wenn jemand die Seite öffnet.
// Die Werte müssen im Katalog (config/katalog.json) vorkommen.
export const START_ANHAENGER = {
  name: 'Julia',
  font: 'pacifico',
  shape: 'wreath',
  frame: 'snowflakes',
  symbol: 'snowflake',
  color: 'gold',
  diameterMm: 80,
  thicknessMm: 3,
  quantity: 1,
};
