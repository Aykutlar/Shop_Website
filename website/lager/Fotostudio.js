'use client';

// Fotostudio: rendert Etsy-Bilder aus der echten Druckgeometrie (2000 × 2000 px, JPEG).
// Ersetzt keine echten Fotos, ist aber bis zum ersten Druck eine ehrliche Darstellung des Produkts.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import angeboteDatei from '../../einstellungen/etsy-angebote.json';
import catalog from '../../einstellungen/katalog.json';
import { MARKE } from '../../einstellungen/texte';
import { validateParams } from '../../anhaenger/eingabepruefung.mjs';
import { applyColor, buildGeometry, newOrnamentMaterial } from '../technik/anhaenger-three';
import { mm } from '../technik/format';

const PIXEL = 2000;
const { angebote, standard } = angeboteDatei;

const SZENEN = {
  nacht: { label: 'Tannengrün mit Lichtern', oben: '#1d4a37', unten: '#06110c', lichter: '#ffcf7a', text: '#f8f1e3', belichtung: 1.05 },
  leinen: { label: 'Hell, Leinen', oben: '#f4ede1', unten: '#d8ccb8', lichter: '#ffffff', text: '#2a1a14', belichtung: 0.95 },
  weiss: { label: 'Weiß (für Größen und Schriften)', oben: '#ffffff', unten: '#ece9e4', lichter: null, text: '#2a1a14', belichtung: 0.95 },
  grau: { label: 'Hellgrau (für die Farbübersicht)', oben: '#e2e4df', unten: '#b9beb6', lichter: null, text: '#1f2320', belichtung: 0.95 },
};

const BILDTYPEN = {
  haupt: 'Hauptbild',
  farben: 'Farbübersicht',
  schriften: 'Schriftübersicht',
  groessen: 'Größenvergleich',
};

// Gleiche Eingabe, gleiches Bild: Zufallszahlen mit festem Startwert.
function zufall(start) {
  let s = start >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function hintergrund(szene) {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  const verlauf = g.createRadialGradient(512, 380, 60, 512, 512, 760);
  verlauf.addColorStop(0, szene.oben);
  verlauf.addColorStop(1, szene.unten);
  g.fillStyle = verlauf;
  g.fillRect(0, 0, 1024, 1024);
  if (szene.lichter) {
    const r = zufall(7);
    g.filter = 'blur(14px)';
    for (let i = 0; i < 34; i++) {
      g.globalAlpha = 0.08 + r() * 0.22;
      g.fillStyle = szene.lichter;
      g.beginPath();
      g.arc(r() * 1024, r() * 1024, 14 + r() * 46, 0, Math.PI * 2);
      g.fill();
    }
  }
  const textur = new THREE.CanvasTexture(c);
  textur.colorSpace = THREE.SRGBColorSpace;
  return textur;
}

// Rechnet Geometrien im selben Worker wie der Konfigurator, eine nach der anderen.
function geometrieRechner() {
  const worker = new Worker(new URL('../technik/vorschau-rechner.worker.js', import.meta.url), { type: 'module' });
  let naechste = 0;
  const offen = new Map();
  worker.onmessage = ({ data }) => {
    const p = offen.get(data.id);
    offen.delete(data.id);
    if (data.ok) p?.resolve(data); else p?.reject(new Error(data.message));
  };
  worker.onerror = () => {
    for (const p of offen.values()) p.reject(new Error('Der Rechner ist abgestürzt.'));
    offen.clear();
  };
  return {
    rechne: (params) => new Promise((resolve, reject) => {
      const id = naechste++;
      offen.set(id, { resolve, reject });
      worker.postMessage({ id, params });
    }),
    beenden: () => worker.terminate(),
  };
}

// Baut die Liste der Anhänger für einen Bildtyp.
function motive(typ, form, lieferbar) {
  const basis = {
    name: form.name, font: form.schrift, shape: form.angebot.shape, frame: form.angebot.frame,
    symbol: form.angebot.symbol, diameterMm: form.groesse, thicknessMm: standard.staerke_mm, nozzle: standard.duese,
    ...(form.jahr && form.angebot.shapeEntry.supports_year ? { year: Number(form.jahr) } : {}),
  };
  const farbe = (id) => catalog.colors.find((c) => c.id === id);
  if (typ === 'farben') {
    return lieferbar.map((id) => ({ params: basis, farbe: farbe(id), label: farbe(id).label }));
  }
  if (typ === 'schriften') {
    return catalog.fonts.map((f) => ({ params: { ...basis, font: f.id }, farbe: farbe(form.farbe), label: f.label }));
  }
  if (typ === 'groessen') {
    return catalog.sizes.filter((s) => s.nozzles.includes(standard.duese)).map((s) => ({
      params: { ...basis, diameterMm: s.diameter_mm }, farbe: farbe(form.farbe), label: `${s.label} · ${s.diameter_mm} mm`,
    }));
  }
  return [{ params: basis, farbe: farbe(form.farbe), label: null }];
}

async function rendern({ typ, form, lieferbar, szeneId, marke }) {
  const szene = SZENEN[szeneId];
  const liste = motive(typ, form, lieferbar);
  for (const m of liste) {
    const fehler = validateParams(catalog, m.params);
    if (fehler.length) throw new Error(`${m.label ?? form.name}: ${fehler[0].message}`);
  }

  const rechner = geometrieRechner();
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  const entsorgen = [];
  try {
    const modelle = [];
    for (const m of liste) modelle.push(await rechner.rechne(m.params));

    renderer.setPixelRatio(1);
    renderer.setSize(PIXEL, PIXEL, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = szene.belichtung;

    const welt = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    entsorgen.push(pmrem);
    welt.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    welt.environmentIntensity = 0.75;
    welt.background = hintergrund(szene);
    entsorgen.push(welt.background);

    const key = new THREE.DirectionalLight(0xffe8c8, 2.4);
    key.position.set(-90, 130, 200);
    const rim = new THREE.DirectionalLight(0xbfd6ff, 1.1);
    rim.position.set(160, -40, -120);
    welt.add(key, rim);

    const einzeln = liste.length === 1;
    const drehung = einzeln ? 0.38 : 0.16;
    const breiteste = Math.max(...modelle.map((m) => m.meta.expected.widthMm));
    const hoechste = Math.max(...modelle.map((m) => m.meta.expected.heightMm));
    const abstand = breiteste * 1.3;
    // Bis 4 Anhänger in einer Reihe, darüber ein Raster mit zwei Reihen (z. B. 8 Farben = 4 × 2).
    const spalten = liste.length <= 4 ? liste.length : Math.ceil(liste.length / 2);
    const reihenAbstand = hoechste * 1.55;
    const mehrreihig = liste.length > spalten;
    const platz = (i) => {
      const reihe = Math.floor(i / spalten);
      const inReihe = Math.min(spalten, liste.length - reihe * spalten);
      return { x: ((i % spalten) - (inReihe - 1) / 2) * abstand, y: -reihe * reihenAbstand };
    };
    // Einreihig hängt der Faden aus dem Bild heraus; im Raster nur ein kurzes Stück, sonst kreuzt er die obere Reihe.
    const fadenLaenge = mehrreihig ? hoechste * 0.22 : 600;
    const faden = new THREE.MeshStandardMaterial({ color: '#c7a76c', roughness: 0.6 });
    entsorgen.push(faden);
    const rahmen = new THREE.Box3();
    const unterkanten = [];

    modelle.forEach((modell, i) => {
      const geometrie = buildGeometry(modell);
      const material = newOrnamentMaterial();
      applyColor(material, liste[i].farbe);
      entsorgen.push(geometrie, material);
      const gruppe = new THREE.Group();
      const koerper = new THREE.Mesh(geometrie, material);
      koerper.rotation.y = drehung;
      gruppe.add(koerper);
      const fadenNetz = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, fadenLaenge, 8), faden);
      fadenNetz.position.y = fadenLaenge / 2;
      entsorgen.push(fadenNetz.geometry);
      gruppe.add(fadenNetz);
      const { x, y } = platz(i);
      gruppe.position.set(x, y, 0);
      welt.add(gruppe);
      gruppe.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(koerper);
      rahmen.union(box);
      unterkanten.push(new THREE.Vector3(x, box.min.y, 0));
    });

    // Unter jeder Reihe Platz für die Beschriftung, dann die Kamera auf den Inhalt einpassen.
    if (!einzeln) rahmen.min.y -= hoechste * 0.32;
    const kamera = new THREE.PerspectiveCamera(24, 1, 10, 5000);
    const groesse = rahmen.getSize(new THREE.Vector3());
    const mitte = rahmen.getCenter(new THREE.Vector3());
    const rand = einzeln ? 1.5 : 1.14;
    const tan = Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2));
    const entfernung = (Math.max(groesse.x, groesse.y) * rand) / (2 * tan) + breiteste * 0.5;
    kamera.position.set(mitte.x, mitte.y, entfernung);
    kamera.lookAt(mitte.x, mitte.y, 0);
    kamera.updateMatrixWorld();

    renderer.render(welt, kamera);

    // Beschriftung und Markenzeichen als 2D-Ebene darüber.
    const bild = document.createElement('canvas');
    bild.width = bild.height = PIXEL;
    const g = bild.getContext('2d');
    g.drawImage(renderer.domElement, 0, 0);
    await document.fonts.load('400 52px Jost');
    await document.fonts.load('500 64px "Cormorant Garamond"');
    g.fillStyle = szene.text;
    g.textAlign = 'center';
    if (!einzeln) {
      // Schriftgröße so wählen, dass die längste Beschriftung in eine Spalte passt.
      const sichtbareBreite = 2 * tan * entfernung;
      const spaltePx = (PIXEL / sichtbareBreite) * abstand * 0.92;
      let px = 64;
      g.font = `400 ${px}px Jost`;
      const laengste = Math.max(...liste.map((m) => g.measureText(m.label).width));
      px = Math.max(30, Math.min(64, Math.floor(px * (spaltePx / laengste))));
      g.font = `400 ${px}px Jost`;
      liste.forEach((m, i) => {
        const p = unterkanten[i].clone().project(kamera);
        const x = (p.x + 1) / 2 * PIXEL;
        const y = Math.min(PIXEL - 40, (1 - p.y) / 2 * PIXEL + px * 1.6);
        g.fillText(m.label, x, y);
      });
    }
    if (marke) {
      g.globalAlpha = 0.8;
      g.textAlign = 'left';
      g.font = '500 64px "Cormorant Garamond"';
      g.fillText(MARKE, 80, 130);
      g.globalAlpha = 1;
    }
    return bild.toDataURL('image/jpeg', 0.92);
  } finally {
    rechner.beenden();
    for (const ding of entsorgen) ding.dispose?.();
    renderer.dispose();
  }
}

const dateiname = (form, typ) => `${MARKE.toLowerCase()}-${form.angebotId}-${typ}-${form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`;

function speichern(url, name) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
}

export default function Fotostudio({ lieferbar }) {
  const [form, setForm] = useState({
    angebotId: Object.keys(angebote)[0],
    name: 'Julia',
    schrift: standard.schrift,
    groesse: 80,
    // Gold hebt sich auf jedem Hintergrund ab; sonst die erste lieferbare Farbe.
    farbe: lieferbar.includes('gold') ? 'gold' : (lieferbar[0] ?? catalog.colors[0].id),
    jahr: '',
  });
  const [typ, setTyp] = useState('haupt');
  const [szene, setSzene] = useState('nacht');
  const [marke, setMarke] = useState(false);
  const [bild, setBild] = useState(null);
  const [laeuft, setLaeuft] = useState(null);
  const [fehler, setFehler] = useState(null);
  const lauf = useRef(0);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const angebot = angebote[form.angebotId];
  const shapeEntry = catalog.shapes.find((s) => s.id === angebot.shape);
  const daten = { ...form, angebot: { ...angebot, shapeEntry } };

  async function erzeugen(welcherTyp, welcheSzene) {
    const nr = ++lauf.current;
    setLaeuft(BILDTYPEN[welcherTyp]);
    setFehler(null);
    try {
      const url = await rendern({ typ: welcherTyp, form: daten, lieferbar, szeneId: welcheSzene, marke });
      if (nr === lauf.current) setBild({ url, name: dateiname(form, welcherTyp) });
      return { url, name: dateiname(form, welcherTyp) };
    } catch (e) {
      setFehler(e.message);
      return null;
    } finally {
      if (nr === lauf.current) setLaeuft(null);
    }
  }

  // Ein kompletter Satz für ein Angebot: Haupt- und Stimmungsbild, dann die Übersichten.
  async function allesErzeugen() {
    const satz = [['haupt', 'nacht'], ['haupt', 'leinen'], ['farben', 'grau'], ['schriften', 'grau'], ['groessen', 'grau']];
    for (const [t, s] of satz) {
      const ergebnis = await erzeugen(t, s);
      if (!ergebnis) return;
      speichern(ergebnis.url, ergebnis.name.replace('.jpg', `-${s}.jpg`));
    }
  }

  useEffect(() => { setBild(null); }, [form, typ, szene, marke]);

  return (
    <main className="lager">
      <header className="lager-kopf">
        <div>
          <p className="eyebrow">Hintergrund</p>
          <h1>Fotostudio</h1>
        </div>
        <a className="button ghost small" href="/lager">Zum Lager</a>
      </header>

      <p className="caption lager-hinweis">
        Die Bilder entstehen aus derselben Geometrie, die gedruckt wird. Farben am Bildschirm weichen etwas vom echten Filament ab.
        Sobald es echte Fotos gibt, diese bevorzugen und als Hauptbild verwenden.
      </p>

      <section className="lager-block">
        <form className="lager-form" onSubmit={(e) => { e.preventDefault(); erzeugen(typ, szene); }}>
          <div className="lager-felder">
            <label>
              <span>Angebot</span>
              <select value={form.angebotId} onChange={(e) => set({ angebotId: e.target.value, jahr: '' })}>
                {Object.entries(angebote).map(([id, a]) => <option key={id} value={id}>{a.titel}</option>)}
              </select>
            </label>
            <label>
              <span>Beispielname</span>
              <input value={form.name} maxLength={catalog.text.name_max_chars} onChange={(e) => set({ name: e.target.value })} />
            </label>
            <label>
              <span>Schrift</span>
              <select value={form.schrift} onChange={(e) => set({ schrift: e.target.value })}>
                {catalog.fonts.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </label>
            <label>
              <span>Größe</span>
              <select value={form.groesse} onChange={(e) => set({ groesse: Number(e.target.value) })}>
                {catalog.sizes.filter((s) => s.nozzles.includes(standard.duese)).map((s) => (
                  <option key={s.id} value={s.diameter_mm}>{s.label} · {mm(s.diameter_mm)} mm</option>
                ))}
              </select>
            </label>
            <label>
              <span>Farbe</span>
              <select value={form.farbe} onChange={(e) => set({ farbe: e.target.value })}>
                {catalog.colors.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}{lieferbar.includes(c.id) ? '' : ' (nicht im Lager)'}</option>
                ))}
              </select>
            </label>
            {shapeEntry.supports_year && (
              <label>
                <span>Jahreszahl (leer = ohne)</span>
                <input type="number" min={catalog.text.year.min} max={catalog.text.year.max} value={form.jahr} onChange={(e) => set({ jahr: e.target.value })} />
              </label>
            )}
            <label>
              <span>Bildtyp</span>
              <select value={typ} onChange={(e) => setTyp(e.target.value)}>
                {Object.entries(BILDTYPEN).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
            <label>
              <span>Hintergrund</span>
              <select value={szene} onChange={(e) => setSzene(e.target.value)}>
                {Object.entries(SZENEN).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
              </select>
            </label>
            <label className="lager-haken">
              <input type="checkbox" checked={marke} onChange={(e) => setMarke(e.target.checked)} />
              <span>Shopnamen „{MARKE}“ oben links einblenden</span>
            </label>
          </div>
          {fehler && <p className="lager-fehler" role="alert">{fehler}</p>}
          <div className="lager-knoepfe">
            <button className="button solid small" type="submit" disabled={Boolean(laeuft)}>{laeuft ? `${laeuft} wird berechnet …` : 'Bild erzeugen'}</button>
            <button className="button ghost small" type="button" disabled={Boolean(laeuft)} onClick={allesErzeugen}>Kompletten Satz herunterladen (5 Bilder)</button>
          </div>
        </form>

        {bild && (
          <figure className="studio-bild">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bild.url} alt={`${BILDTYPEN[typ]}: ${form.name}`} />
            <figcaption>
              <button className="button solid small" type="button" onClick={() => speichern(bild.url, bild.name)}>Herunterladen (2000 × 2000 px)</button>
            </figcaption>
          </figure>
        )}
      </section>
    </main>
  );
}
