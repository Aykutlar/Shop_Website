'use client';

// Das Herzstück: merkt sich die Auswahl des Kunden, lässt die Vorschau berechnen
// und speichert die fertige Gestaltung. Die sichtbaren Teile stehen in eigenen Dateien:
// Buehne.js (links), Einleitung.js (erster Bildschirm), Schritte.js (Auswahl),
// Zusammenfassung.js (Preis und Knopf), CodeFenster.js (nach dem Sichern).

import { useEffect, useMemo, useRef, useState } from 'react';
import { START_ANHAENGER } from '../../einstellungen/deko';
import catalog from '../../einstellungen/katalog.json';
import { TEXTE } from '../../einstellungen/texte';
import { validateParams } from '../../anhaenger/eingabepruefung.mjs';
import { createGeometryClient } from '../technik/vorschau-rechner';
import Buehne from './Buehne';
import CodeFenster from './CodeFenster';
import Einleitung from './Einleitung';
import Schritte from './Schritte';
import Zusammenfassung from './Zusammenfassung';

const DEBOUNCE_MS = 140;

const INITIAL = {
  ...START_ANHAENGER,
  withYear: false,
  year: new Date().getFullYear(),
};

export default function Konfigurator() {
  const [form, setForm] = useState(INITIAL);
  const [model, setModel] = useState(null);
  const [problem, setProblem] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  // Bis das Lager geantwortet hat, gilt die Katalogliste; der Server prüft beim Sichern ohnehin.
  const [farben, setFarben] = useState(() => catalog.colors.filter((c) => c.in_stock).map((c) => c.id));
  const client = useRef(null);

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setSaveError(null); };

  useEffect(() => {
    let aktiv = true;
    fetch('/api/farben')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!aktiv || !Array.isArray(data?.farben)) return;
        setFarben(data.farben);
        setForm((f) => (data.farben.length && !data.farben.includes(f.color) ? { ...f, color: data.farben[0] } : f));
      })
      .catch(() => {});
    return () => { aktiv = false; };
  }, []);
  const shape = catalog.shapes.find((s) => s.id === form.shape);
  const color = catalog.colors.find((c) => c.id === form.color);
  const size = catalog.sizes.find((s) => s.diameter_mm === form.diameterMm);

  const pickShape = (entry) => {
    set({
      shape: entry.id,
      frame: entry.frames.includes(form.frame) ? form.frame : entry.frames[0],
      withYear: entry.supports_year ? form.withYear : false,
    });
  };

  const params = useMemo(() => ({
    name: form.name,
    font: form.font,
    shape: form.shape,
    frame: form.frame,
    symbol: form.symbol,
    diameterMm: form.diameterMm,
    thicknessMm: form.thicknessMm,
    nozzle: 'n04',
    ...(form.withYear ? { year: form.year } : {}),
  }), [form]);

  const errors = useMemo(() => validateParams(catalog, params), [params]);

  useEffect(() => {
    client.current = createGeometryClient((result) => {
      if (result.ok) {
        setModel(result);
        setProblem(null);
      } else {
        setProblem(result.message);
      }
    });
    return () => client.current.close();
  }, []);

  useEffect(() => {
    if (errors.length) return undefined;
    const timer = setTimeout(() => client.current.request(params), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [params, errors.length]);

  const printable = !errors.length && !problem && model?.meta.printable !== false;

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('/api/gestaltungen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, color: form.color, quantity: form.quantity }),
      });
      const data = await response.json();
      if (!response.ok) setSaveError(data.error);
      else setSaved({ ...data, summary: { ...form, shapeLabel: shape.label, colorLabel: color.label } });
    } catch {
      setSaveError(TEXTE.konfigurator.verbindungsfehler);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="workshop">
      <Buehne model={model} color={color} />

      <div className="panel">
        <Einleitung />

        <form id="gestalten" className="steps" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Schritte form={form} set={set} shape={shape} color={color} farben={farben} errors={errors} pickShape={pickShape} />
          <Zusammenfassung
            form={form}
            set={set}
            size={size}
            printable={printable}
            fehler={errors[0]?.message ?? problem}
            saveError={saveError}
            saving={saving}
            bereit={Boolean(model)}
          />
        </form>
      </div>

      {saved && <CodeFenster saved={saved} onClose={() => setSaved(null)} />}
    </div>
  );
}
