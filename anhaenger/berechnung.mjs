// Geometrie-Kern: läuft identisch im Browser und in Node.
// Keine Plattformzugriffe hier; bereits geparste Schriften kommen über `fonts` herein.
// Einheiten: Millimeter. Ursprung: Mittelpunkt des Anhängers.

export const GEOMETRY_VERSION = '0.3.0';
const CIRCLE_SEGMENTS = 180;
const CURVE_STEPS = 10;
const MAX_THIN_AREA_MM2 = 0.5;

export const NOZZLE_LIMITS = {
  n04: { minFeature: 1.2, minGap: 0.8, thicken: 0.15 },
  n02: { minFeature: 0.6, minGap: 0.5, thicken: 0.06 },
};

const HANGER = { holeDiameter: 4.0, outerDiameter: 9.0, overlap: 1.2 };

// ── Text ──────────────────────────────────────────────

function flatten(commands) {
  const contours = [];
  let current = null;
  let px = 0;
  let py = 0;
  const add = (x, y) => {
    current.push([x, -y]); // Schriftkoordinaten zeigen nach unten
    px = x;
    py = y;
  };
  for (const c of commands) {
    if (c.type === 'M') {
      current = [];
      contours.push(current);
      add(c.x, c.y);
    } else if (c.type === 'L') {
      add(c.x, c.y);
    } else if (c.type === 'Q') {
      const [x0, y0] = [px, py];
      for (let i = 1; i <= CURVE_STEPS; i++) {
        const t = i / CURVE_STEPS;
        const m = 1 - t;
        add(m * m * x0 + 2 * m * t * c.x1 + t * t * c.x, m * m * y0 + 2 * m * t * c.y1 + t * t * c.y);
      }
    } else if (c.type === 'C') {
      const [x0, y0] = [px, py];
      for (let i = 1; i <= CURVE_STEPS; i++) {
        const t = i / CURVE_STEPS;
        const m = 1 - t;
        add(
          m * m * m * x0 + 3 * m * m * t * c.x1 + 3 * m * t * t * c.x2 + t * t * t * c.x,
          m * m * m * y0 + 3 * m * m * t * c.y1 + 3 * m * t * t * c.y2 + t * t * t * c.y,
        );
      }
    }
  }
  return contours.filter((c) => c.length >= 3);
}

// Liefert CrossSection des Texts (Grundlinie y=0, Start x=0) in Schrift-Einheiten size=100.
function textSection(CrossSection, parsed, text) {
  const parts = [];
  let x = 0;
  let prev = null;
  let prevFont = null;
  for (const ch of text) {
    const font = parsed.find((f) => f.charToGlyph(ch).index !== 0);
    if (!font) throw new GeometryError('UNSUPPORTED_CHAR', `Zeichen „${ch}“ fehlt in dieser Schrift`);
    const glyph = font.charToGlyph(ch);
    const k = 100 / font.unitsPerEm;
    if (prev && prevFont === font) x += font.getKerningValue(prev, glyph) * k;
    const contours = flatten(glyph.getPath(x, 0, 100).commands);
    if (contours.length) parts.push(new CrossSection(contours, 'NonZero'));
    x += glyph.advanceWidth * k;
    prev = glyph;
    prevFont = font;
  }
  if (!parts.length) throw new GeometryError('EMPTY_TEXT', 'Text enthält keine sichtbaren Zeichen');
  return CrossSection.union(parts);
}

// ── Grundformen ───────────────────────────────────────

function capsule(CrossSection, [ax, ay], [bx, by], width) {
  const r = width / 2;
  const angle = Math.atan2(by - ay, bx - ax);
  const points = [];
  for (let i = 0; i <= 12; i++) {
    const a = angle + Math.PI / 2 + (i / 12) * Math.PI;
    points.push([ax + r * Math.cos(a), ay + r * Math.sin(a)]);
  }
  for (let i = 0; i <= 12; i++) {
    const a = angle - Math.PI / 2 + (i / 12) * Math.PI;
    points.push([bx + r * Math.cos(a), by + r * Math.sin(a)]);
  }
  return new CrossSection([points], 'NonZero');
}

function snowflake(CrossSection, r, stroke) {
  const parts = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const dir = (t, off = 0) => [t * Math.cos(a + off), t * Math.sin(a + off)];
    const tip = dir(r);
    parts.push(capsule(CrossSection, [0, 0], tip, stroke));
    const base = dir(r * 0.58);
    for (const side of [-1, 1]) {
      const b = r * 0.34;
      const c = a + (side * Math.PI) / 3;
      parts.push(capsule(CrossSection, base, [base[0] + b * Math.cos(c), base[1] + b * Math.sin(c)], stroke));
    }
  }
  return CrossSection.union(parts);
}

function polygon(CrossSection, points) {
  return new CrossSection([points], 'NonZero');
}

// Rundet Ecken in beide Richtungen.
function rounded(section, r) {
  return section.offset(-r, 'Round', 2, 16).offset(r * 2, 'Round', 2, 16).offset(-r, 'Round', 2, 16);
}

// Durchbrochener Stil: nur die Kontur bleibt, passend zum Ausschnitt-Charakter des Anhängers.
function outlined(section, stroke) {
  const inner = section.offset(-stroke, 'Round', 2, 16);
  return inner.isEmpty() ? section : section.subtract(inner);
}

function starPolygon(CrossSection, r, innerRatio) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? r * innerRatio : r;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    points.push([radius * Math.cos(a), radius * Math.sin(a)]);
  }
  return polygon(CrossSection, points);
}

function firSprig(CrossSection, r, stroke) {
  const parts = [capsule(CrossSection, [-r, 0], [r, 0], stroke)];
  for (let i = 0; i < 4; i++) {
    const x = -r * 0.85 + (i * r * 1.7) / 3;
    const needle = r * (0.66 - i * 0.09);
    for (const side of [-1, 1]) {
      parts.push(capsule(CrossSection, [x, 0], [x + needle * 0.7, side * needle], stroke));
    }
  }
  return CrossSection.union(parts);
}

function heart(CrossSection, r) {
  const points = [];
  for (let i = 0; i < 72; i++) {
    const t = (i / 72) * 2 * Math.PI;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    points.push([(x * r) / 16, ((y + 2) * r) / 16]);
  }
  return polygon(CrossSection, points);
}

function bell(CrossSection, r) {
  const side = [[0.0, 1], [0.28, 0.92], [0.42, 0.55], [0.5, 0.05], [0.68, -0.42], [0.92, -0.62]];
  const points = [...side.map(([x, y]) => [-x * r, y * r]), ...[...side].reverse().map(([x, y]) => [x * r, y * r])];
  return polygon(CrossSection, points);
}

// Alle Figuren stehen aufrecht und kommen aus dieser einen Quelle:
// Verzierung und Symbol derselben Art sehen dadurch immer gleich aus.
function figure(CrossSection, kind, r, stroke) {
  if (kind === 'snowflake') return snowflake(CrossSection, r, stroke).rotate(30);
  if (kind === 'star') return outlined(rounded(starPolygon(CrossSection, r, 0.5), 0.45), stroke);
  if (kind === 'fir') return firSprig(CrossSection, r, stroke);
  if (kind === 'heart') return outlined(heart(CrossSection, r), stroke);
  if (kind === 'bell') {
    return outlined(rounded(bell(CrossSection, r), 0.5), stroke)
      .add(CrossSection.circle(r * 0.2, 24).translate([0, -r * 0.8]));
  }
  throw new GeometryError('BAD_SYMBOL', `Unbekanntes Symbol ${kind}`);
}

const FRAME_FIGURE = { snowflakes: 'snowflake', stars: 'star', fir: 'fir' };

const widthOf = (section) => {
  const b = section.bounds();
  return b.max[0] - b.min[0];
};

// Schiebt eine Figur nach außen, bis sie tragfähig im Ring sitzt.
function seatRadial(figureSection, ring, start, angleDeg, needArea) {
  const a = (angleDeg * Math.PI) / 180;
  const tilted = figureSection.rotate(angleDeg - 90);
  let radial = start;
  for (let i = 0; i < 60; i++) {
    const placed = tilted.translate([radial * Math.cos(a), radial * Math.sin(a)]);
    if (placed.intersect(ring).area() >= needArea) return radial;
    radial += 0.2;
  }
  throw new GeometryError('MOTIF_UNSEATED', 'Motiv findet keinen Halt am Rahmen');
}

// Motive werden ganz gesetzt oder gar nicht, immer spiegelbildlich paarweise.
function placeMotifs(CrossSection, { kind, r, stroke, ring, ri, forbidden, gap, skipTopHalfWidth, keepBottomFree, needArea }) {
  const shape = figure(CrossSection, kind, r, stroke);
  const width = widthOf(shape);
  const radial = seatRadial(shape, ring, ri - r * 1.3, 90, needArea);
  const place = (deg) => {
    const a = (deg * Math.PI) / 180;
    return shape.rotate(deg - 90).translate([radial * Math.cos(a), radial * Math.sin(a)]);
  };
  const fits = (part) => part.intersect(forbidden).isEmpty();
  const step = ((width + gap * 1.6) / radial) * (180 / Math.PI);
  const placed = [];

  for (const [center, centerFree] of [[90, skipTopHalfWidth === null], [270, !keepBottomFree]]) {
    const firstOffset = center === 90 && skipTopHalfWidth !== null
      ? ((skipTopHalfWidth + width / 2 + gap * 1.6) / radial) * (180 / Math.PI)
      : step;
    if (centerFree && fits(place(center))) placed.push(place(center));
    for (let offset = firstOffset; offset <= 74; offset += step) {
      const left = place(center + offset);
      const right = place(center - offset);
      if (fits(left) && fits(right)) placed.push(left, right);
    }
  }
  return placed.length ? CrossSection.union(placed) : null;
}

// Unterlinie: oben gerade (trägt die Buchstaben), unten leicht gebaucht.
function swash(CrossSection, y, halfWidth, width, belly) {
  const top = [[-halfWidth, y + 0.3], [halfWidth, y + 0.3]];
  const bottom = [];
  for (let i = 0; i <= 40; i++) {
    const x = halfWidth - (2 * halfWidth * i) / 40;
    const u = x / halfWidth;
    bottom.push([x, y - width - belly * (1 - u * u)]);
  }
  return polygon(CrossSection, [...top, ...bottom]);
}

// ── Inseln anbinden, Mindeststärke erzwingen ──────────

function nearestPair(a, b) {
  let best = null;
  for (const pa of a.toPolygons()) {
    for (const p of pa) {
      for (const qa of b.toPolygons()) {
        for (const q of qa) {
          const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
          if (!best || d < best.d) best = { d, p, q };
        }
      }
    }
  }
  return best;
}

// Bevorzugt einen geraden, senkrechten Steg: i-Punkte und Umlaute sitzen dann sauber auf dem Buchstaben.
function verticalBridge(CrossSection, island, main) {
  const box = island.bounds();
  const x = (box.min[0] + box.max[0]) / 2;
  const y = (box.min[1] + box.max[1]) / 2;
  const reach = 14;
  const strip = (from, to) => CrossSection.square([0.8, Math.abs(to - from)], true).translate([x, (from + to) / 2]);
  const below = main.intersect(strip(y - reach, box.min[1]));
  if (!below.isEmpty()) return [[x, y], [x, below.bounds().max[1] - 0.5]];
  const above = main.intersect(strip(box.max[1], y + reach));
  if (!above.isEmpty()) return [[x, y], [x, above.bounds().min[1] + 0.5]];
  return null;
}

function bridgeIslands(CrossSection, section, width) {
  const bridges = [];
  let current = section;
  for (let round = 0; round < 16; round++) {
    const pieces = current.decompose().sort((x, y) => y.area() - x.area());
    if (pieces.length <= 1) return { section: current, bridges };
    const straight = verticalBridge(CrossSection, pieces[1], pieces[0]);
    const nearest = straight ? null : nearestPair(pieces[1], pieces[0]);
    const [from, to] = straight ?? [nearest.p, nearest.q];
    bridges.push({ from, to, length: Math.hypot(from[0] - to[0], from[1] - to[1]) });
    current = current.add(capsule(CrossSection, from, to, width));
  }
  throw new GeometryError('ISLANDS_UNRESOLVED', 'Lose Teile konnten nicht angebunden werden');
}

const opening = (section, r) => section.offset(-r, 'Round', 2, 16).offset(r, 'Round', 2, 16);
const closing = (section, r) => section.offset(r, 'Round', 2, 16).offset(-r, 'Round', 2, 16);

// Findet zu dünne Abschnitte und verstärkt genau dort, der Rest bleibt unberührt.
function thickenThin(CrossSection, section, half) {
  let current = section;
  for (let round = 0; round < 3; round++) {
    const thin = current.subtract(opening(current, half).offset(0.02, 'Round', 2, 16))
      .decompose().filter((piece) => piece.area() > 0.2);
    if (!thin.length) break;
    current = current.add(CrossSection.union(thin).offset(half * 0.7, 'Round', 2, 16));
  }
  return current;
}

function thinResidueMm2(CrossSection, section, half) {
  const thin = section.subtract(opening(section, half).offset(0.02, 'Round', 2, 16));
  return thin.offset(-0.1, 'Round', 2, 16).area();
}

// ── Formen ────────────────────────────────────────────

function shapeOutline(CrossSection, shape, D) {
  const R = D / 2;
  if (shape === 'wreath') return CrossSection.circle(R, CIRCLE_SEGMENTS);
  if (shape === 'bauble') {
    const capW = 0.22 * D;
    const capH = 0.075 * D;
    const cap = rounded(CrossSection.square([capW, capH + 6], true).translate([0, R + capH / 2 - 3]), 0.9);
    return CrossSection.circle(R, CIRCLE_SEGMENTS).add(cap);
  }
  if (shape === 'star') {
    return rounded(starPolygon(CrossSection, R / Math.cos((18 * Math.PI) / 180), 0.6), 2.2);
  }
  if (shape === 'tree') {
    const half = [[0.2, 0.3], [0.1, 0.3], [0.34, -0.02], [0.2, -0.02], [0.5, -0.46], [0.08, -0.46], [0.08, -0.6]];
    const left = [...half].reverse().map(([x, y]) => [-x, y]);
    const points = [[0, 0.62], ...half, ...left].map(([x, y]) => [x * D, y * D]);
    return rounded(polygon(CrossSection, points), 1.6);
  }
  return null;
}

// Freier Bereich für den Schriftzug je Form (Anteil von D).
const TEXT_ZONE = {
  wreath: { floor: -0.3, ceiling: 0.32 },
  bauble: { floor: -0.3, ceiling: 0.32 },
  star: { floor: -0.17, ceiling: 0.17 },
  tree: { floor: -0.42, ceiling: -0.1 },
  pure: { floor: -0.3, ceiling: 0.3 },
};

function chordWidth(CrossSection, inner, y, D) {
  const strip = CrossSection.square([3 * D, 0.4], true).translate([0, y]);
  const hit = inner.intersect(strip);
  return hit.isEmpty() ? 0 : widthOf(hit);
}

export class GeometryError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function buildOrnament(wasm, fonts, params) {
  const { CrossSection } = wasm;
  const { name, font, shape = 'wreath', frame, diameterMm: D, thicknessMm, nozzle, year, symbol } = params;
  const limits = NOZZLE_LIMITS[nozzle];
  if (!limits) throw new GeometryError('BAD_NOZZLE', `Unbekannte Düse ${nozzle}`);
  const fontFiles = fonts[font];
  if (!fontFiles) throw new GeometryError('BAD_FONT', `Unbekannte Schrift ${font}`);
  const zone = TEXT_ZONE[shape];
  if (!zone) throw new GeometryError('BAD_SHAPE', `Unbekannte Form ${shape}`);

  const R = D / 2;
  const half = limits.minFeature / 2;
  const ringWidth = Math.max(0.03 * D, limits.minFeature * 2);
  const ri = R - ringWidth;
  const stroke = Math.max(0.02 * D, limits.minFeature * 1.3);
  const round = shape === 'wreath' || shape === 'bauble';
  const hasSymbol = Boolean(symbol) && symbol !== 'none';
  const motifKind = round ? FRAME_FIGURE[frame] : undefined;
  const seatArea = stroke * 1.4;

  // Bei der Kugel bleibt die Kappe massiv, das Innere ist nur der Kreis.
  let outer = shapeOutline(CrossSection, shape, D);
  const inner = !outer ? null
    : shape === 'bauble' ? CrossSection.circle(ri, CIRCLE_SEGMENTS)
      : outer.offset(-ringWidth, 'Round', 2, 32);
  let ring = outer ? outer.subtract(inner) : null;

  let floor = zone.floor * D;
  let ceiling = zone.ceiling * D;
  if (motifKind) {
    ceiling = Math.min(ceiling, 0.24 * D);
    floor = Math.max(floor, -0.24 * D);
  }

  // Symbol: dieselbe Figur wie die Verzierung, nur größer, und immer fest verbunden.
  const motifR = 0.08 * D;
  let symbolPart = null;
  let symbolHalfWidth = null;
  if (hasSymbol && shape !== 'pure') {
    const r = shape === 'tree' ? 0.13 * D : motifR * 1.25;
    const art = figure(CrossSection, symbol, r, stroke);
    symbolHalfWidth = widthOf(art) / 2;
    if (round) {
      const y = seatRadial(art, ring, ri - r * 1.3, 90, seatArea);
      symbolPart = art.translate([0, y]);
      ceiling = Math.min(ceiling, y - r - limits.minGap * 2);
    } else if (shape === 'tree') {
      // Baumspitze: das Symbol krönt den Baum.
      const tip = outer.bounds().max[1];
      symbolPart = art.translate([0, tip + r * 0.42]);
      outer = outer.add(symbolPart);
    } else {
      // Stern: das Symbol füllt den oberen Zacken und berührt beide Wände.
      let y = inner.bounds().max[1] - 1;
      while (y > 0 && chordWidth(CrossSection, inner, y, D) < symbolHalfWidth * 1.72) y -= 0.25;
      symbolPart = art.translate([0, y]);
      ceiling = Math.min(ceiling, y - r - limits.minGap * 2);
    }
  }

  // Jahreszahl steht im Rahmen auf einem Steg über dem unteren Rand.
  let yearPart = null;
  if (year && round) {
    const digitHeight = 0.08 * D;
    const yb = -ri * 0.8;
    const barHalf = Math.sqrt(ri * ri - yb * yb) + 0.8;
    const rawYear = textSection(CrossSection, fonts.nunito_black, String(year));
    const box = rawYear.bounds();
    const s = digitHeight / (box.max[1] - box.min[1]);
    yearPart = rawYear
      .scale([s, s])
      .translate([-(s * (box.min[0] + box.max[0])) / 2, yb - 0.3 - s * box.min[1]])
      .offset(limits.thicken, 'Round', 2, 16)
      .add(capsule(CrossSection, [-barHalf, yb - stroke / 2], [barHalf, yb - stroke / 2], stroke));
    floor = Math.max(floor, yb + digitHeight + limits.minGap * 2);
  }

  // Schriftzug: so groß wie möglich, aber vollständig im Rahmen. Er wird nie angeschnitten.
  const raw = textSection(CrossSection, fontFiles, name);
  const box = raw.bounds();
  const rawW = box.max[0] - box.min[0];
  const rawH = box.max[1] - box.min[1];
  const centerY = (ceiling + floor) / 2;
  const placeText = (s) => raw
    .scale([s, s])
    .translate([-(s * (box.min[0] + box.max[0])) / 2, centerY - (s * (box.min[1] + box.max[1])) / 2])
    .offset(limits.thicken, 'Round', 2, 16);
  const textRoom = inner?.offset(-limits.minGap, 'Round', 2, 32);
  const fitsFrame = (s) => !textRoom || placeText(s).subtract(textRoom).area() < 0.01;
  const maxWidth = shape === 'pure' && hasSymbol ? 0.84 * D : D;
  let high = Math.min(Math.min(0.46 * D, ceiling - floor) / rawH, maxWidth / rawW);
  let low = 0;
  if (!fitsFrame(high)) {
    for (let i = 0; i < 12; i++) {
      const middle = (low + high) / 2;
      if (fitsFrame(middle)) low = middle;
      else high = middle;
    }
    high = low;
  }
  const scale = high;
  if (!(scale > 0)) throw new GeometryError('TEXT_NO_FIT', 'Der Name passt nicht in diese Form');
  const baselineY = centerY - (scale * (box.min[1] + box.max[1])) / 2;
  const text = placeText(scale);

  const lineHalf = inner
    ? chordWidth(CrossSection, inner, baselineY - stroke, D) / 2 + 0.8
    : (rawW * scale) / 2;
  const line = swash(CrossSection, baselineY, lineHalf, stroke * 0.8, 0.012 * D);

  if (shape === 'pure' && hasSymbol) {
    const art = figure(CrossSection, symbol, motifR, stroke);
    symbolPart = art.translate([lineHalf + widthOf(art) * 0.32, baselineY - stroke / 2]);
  }

  let motifs = null;
  if (motifKind) {
    const kept = [text, line, ...(yearPart ? [yearPart] : []), ...(symbolPart ? [symbolPart] : [])];
    motifs = placeMotifs(CrossSection, {
      kind: motifKind,
      r: motifR,
      stroke,
      ring,
      ri,
      forbidden: CrossSection.union(kept).offset(limits.minGap * 1.5, 'Round', 2, 16),
      gap: limits.minGap,
      skipTopHalfWidth: symbolPart ? symbolHalfWidth : null,
      keepBottomFree: Boolean(yearPart),
      needArea: seatArea,
    });
  }

  if (shape === 'tree' && symbolPart) ring = ring.add(symbolPart);

  let body = CrossSection.union([
    text.add(line),
    ...(ring ? [ring] : []),
    ...(motifs ? [motifs] : []),
    ...(yearPart ? [yearPart] : []),
    ...(symbolPart ? [symbolPart] : []),
  ]);
  if (outer) body = body.intersect(outer);

  // Reihenfolge ist wichtig: erst dünne Stellen verstärken, dann enge Spalten schließen,
  // zuletzt Spitzen runden. Danach ist alles mindestens so breit wie der Mindeststeg.
  body = thickenThin(CrossSection, body, half);
  body = closing(body, limits.minGap / 2);
  body = opening(body, half * 0.98);
  const fragments = body.decompose().filter((piece) => piece.area() >= 1.5);
  body = CrossSection.union(fragments);

  const { section: joined, bridges } = bridgeIslands(CrossSection, body, limits.minFeature + 0.3);

  const eyeR = HANGER.outerDiameter / 2;
  const top = joined.bounds().max[1];
  const eyeY = top + eyeR - HANGER.overlap;
  let carrier = joined;
  if (!outer) {
    // Ohne Rahmen trägt ein Stiel die Öse über den höchsten Buchstaben hinweg.
    const column = joined.intersect(CrossSection.square([6, 4 * D], true));
    const stemEnd = column.isEmpty() ? baselineY : column.bounds().max[1] - 1;
    carrier = carrier.add(capsule(CrossSection, [0, eyeY], [0, stemEnd], stroke * 1.4));
  }
  carrier = closing(carrier.add(CrossSection.circle(eyeR, 64).translate([0, eyeY])), limits.minGap / 2);

  // Loch zuletzt, damit es frei bleibt.
  const hole = CrossSection.circle(HANGER.holeDiameter / 2, 64).translate([0, eyeY]);
  // Offsets hinterlassen Kanten im Nanometerbereich, die im STL (float32) zusammenfallen würden.
  const outline = carrier.subtract(hole).simplify(0.005);

  const thinAreaMm2 = thinResidueMm2(CrossSection, outline, half);
  const size = outline.bounds();
  const mesh = outline.extrude(thicknessMm).getMesh();
  return {
    outline: outline.toPolygons(),
    mesh: { vertProperties: mesh.vertProperties, triVerts: mesh.triVerts, numProp: mesh.numProp },
    meta: {
      geometryVersion: GEOMETRY_VERSION,
      textScale: scale,
      textHeightMm: rawH * scale,
      bridges,
      printable: thinAreaMm2 <= MAX_THIN_AREA_MM2,
      thinAreaMm2,
      expected: {
        widthMm: size.max[0] - size.min[0],
        heightMm: size.max[1] - size.min[1],
        thicknessMm,
        holeDiameterMm: HANGER.holeDiameter,
        holeCenterMm: [0, eyeY],
        minFeatureMm: limits.minFeature,
        minGapMm: limits.minGap,
      },
    },
  };
}
