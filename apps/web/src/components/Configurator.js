'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { validateParams } from '@ornament/geometry/src/validate.mjs';
import catalog from '../../../../config/katalog.json';
import { createGeometryClient } from '../lib/geometry-client';
import { DEKO, START_ANHAENGER } from '../inhalte/deko';
import { TEXTE } from '../inhalte/texte';
import Garland from './Garland';
import SaveDialog from './SaveDialog';
import Snow from './Snow';

const Stage = dynamic(() => import('./Stage'), { ssr: false });

const DEBOUNCE_MS = 140;
const { start: S, konfigurator: K } = TEXTE;
const FONT_FAMILY = Object.fromEntries(catalog.fonts.map((f) => [f.id, f.family]));
const euro = (cents) => (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: catalog.currency });
const mm = (value) => value.toLocaleString('de-DE', { maximumFractionDigits: 1 });

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

const INITIAL = {
  ...START_ANHAENGER,
  withYear: false,
  year: new Date().getFullYear(),
};

function Choice({ legend, step, children, hint }) {
  return (
    <fieldset className="step">
      <legend><span className="step-no">{step}</span>{legend}</legend>
      {hint && <p className="hint">{hint}</p>}
      {children}
    </fieldset>
  );
}

function Option({ group, checked, onChange, children, className = '', disabled, title }) {
  return (
    <label className={`option ${checked ? 'is-on' : ''} ${className}`} title={title}>
      <input type="radio" name={group} checked={checked} onChange={onChange} disabled={disabled} />
      {children}
    </label>
  );
}

export default function Configurator() {
  const [form, setForm] = useState(INITIAL);
  const [model, setModel] = useState(null);
  const [problem, setProblem] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const client = useRef(null);

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setSaveError(null); };
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
  const total = size.unit_price_cents * form.quantity;
  const dims = model?.meta.expected;

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('/api/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, color: form.color, quantity: form.quantity }),
      });
      const data = await response.json();
      if (!response.ok) setSaveError(data.error);
      else setSaved({ ...data, summary: { ...form, shapeLabel: shape.label, colorLabel: color.label } });
    } catch {
      setSaveError(K.verbindungsfehler);
    } finally {
      setSaving(false);
    }
  }

  let stepIndex = 0;
  const nextStep = () => ROMAN[stepIndex++];

  return (
    <div className="workshop">
      <section className="stage" aria-label="Vorschau">
        <div className="bokeh" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <Stage model={model} color={color} />
        {DEKO.girlandeAn && <Garland />}
        {DEKO.schneeAn && <Snow />}
        <div className="stage-foot">
          <p className="stage-dims">
            {dims ? <>{mm(dims.widthMm)} × {mm(dims.heightMm)} × {mm(dims.thicknessMm)} mm</> : K.vorschauLaedt}
          </p>
          <p className="stage-note">{K.vorschauHinweis}</p>
        </div>
      </section>

      <div className="panel">
        <header className="intro">
          <p className="eyebrow">{S.oberzeile}</p>
          <h1>{S.ueberschrift1}<br /><em>{S.ueberschrift2}</em></h1>
          <p className="lede">{S.einleitung}</p>
          <ul className="promises">
            {S.versprechen.map((text) => <li key={text}>{text}</li>)}
          </ul>
          <a className="button ghost" href="#gestalten">{S.knopf}</a>
        </header>

        <form id="gestalten" className="steps" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <div className="step">
            <label className="step-title" htmlFor="name"><span className="step-no">{nextStep()}</span>{K.name}</label>
            <input
              id="name"
              className="name-input"
              value={form.name}
              maxLength={catalog.text.name_max_chars + 4}
              autoComplete="off"
              spellCheck="false"
              aria-describedby="name-note"
              aria-invalid={errors.some((e) => e.code.startsWith('NAME'))}
              style={{ fontFamily: FONT_FAMILY[form.font] }}
              onChange={(e) => set({ name: e.target.value })}
            />
            <p id="name-note" className={`hint ${errors.length ? 'is-error' : ''}`} role="status">
              {errors[0]?.message ?? `${[...form.name].length} von ${catalog.text.name_max_chars} Zeichen`}
            </p>
          </div>

          <Choice legend={K.schrift} step={nextStep()}>
            <div className="grid three">
              {catalog.fonts.map((f) => (
                <Option key={f.id} group="font" checked={form.font === f.id} onChange={() => set({ font: f.id })} className="font-card">
                  <span className="font-sample" style={{ fontFamily: f.family }}>{form.name || 'Name'}</span>
                  <span className="caption">{f.label}</span>
                </Option>
              ))}
            </div>
          </Choice>

          <Choice legend={K.form} step={nextStep()}>
            <div className="grid five">
              {catalog.shapes.map((s) => (
                <Option key={s.id} group="shape" checked={form.shape === s.id} onChange={() => pickShape(s)}>
                  <span className="caption">{s.label}</span>
                </Option>
              ))}
            </div>
          </Choice>

          {shape.frames.length > 1 && (
            <Choice legend={K.verzierung} step={nextStep()}>
              <div className="grid five">
                {shape.frames.map((id) => (
                  <Option key={id} group="frame" checked={form.frame === id} onChange={() => set({ frame: id })}>
                    <span className="caption">{catalog.frames.find((f) => f.id === id).label}</span>
                  </Option>
                ))}
              </div>
            </Choice>
          )}

          <Choice legend={K.symbol} step={nextStep()}>
            <div className="grid five">
              {catalog.symbols.map((s) => (
                <Option key={s.id} group="symbol" checked={form.symbol === s.id} onChange={() => set({ symbol: s.id })}>
                  <span className="caption">{s.label}</span>
                </Option>
              ))}
            </div>
          </Choice>

          <Choice legend={K.groesse} step={nextStep()}>
            <div className="grid three">
              {catalog.sizes.filter((s) => s.nozzles.includes('n04')).map((s) => (
                <Option key={s.id} group="size" checked={form.diameterMm === s.diameter_mm} onChange={() => set({ diameterMm: s.diameter_mm })}>
                  <span className="caption strong">{s.label}</span>
                  <span className="caption">{s.diameter_mm} mm · {euro(s.unit_price_cents)}</span>
                </Option>
              ))}
            </div>
          </Choice>

          <Choice legend={K.staerke} step={nextStep()}>
            <div className="grid three">
              {catalog.thickness_mm.n04.map((t) => (
                <Option key={t} group="thickness" checked={form.thicknessMm === t} onChange={() => set({ thicknessMm: t })}>
                  <span className="caption">{mm(t)} mm</span>
                </Option>
              ))}
            </div>
          </Choice>

          <Choice legend={K.farbe} step={nextStep()} hint={`${color.label}, ${K.farbeHinweis}`}>
            <div className="swatches">
              {catalog.colors.filter((c) => c.in_stock).map((c) => (
                <label key={c.id} className={`swatch ${form.color === c.id ? 'is-on' : ''}`} title={c.label}>
                  <input type="radio" name="color" aria-label={c.label} checked={form.color === c.id} onChange={() => set({ color: c.id })} />
                  <span style={{ background: c.hex }} />
                </label>
              ))}
            </div>
          </Choice>

          {shape.supports_year && (
            <div className="step">
              <span className="step-title"><span className="step-no">{nextStep()}</span>{K.jahreszahl}</span>
              <label className="toggle">
                <input type="checkbox" checked={form.withYear} onChange={(e) => set({ withYear: e.target.checked })} />
                <span>{K.jahreszahlAuswahl}</span>
              </label>
              {form.withYear && (
                <input
                  className="year-input"
                  type="number"
                  aria-label="Jahreszahl"
                  min={catalog.text.year.min}
                  max={catalog.text.year.max}
                  value={form.year}
                  onChange={(e) => set({ year: Number(e.target.value) })}
                />
              )}
            </div>
          )}

          <div className="summary">
            <div className="quantity">
              <span className="caption">{K.anzahl}</span>
              <div className="stepper">
                <button type="button" aria-label="Weniger" disabled={form.quantity <= catalog.quantity.min} onClick={() => set({ quantity: form.quantity - 1 })}>−</button>
                <output aria-live="polite">{form.quantity}</output>
                <button type="button" aria-label="Mehr" disabled={form.quantity >= catalog.quantity.max} onClick={() => set({ quantity: form.quantity + 1 })}>+</button>
              </div>
            </div>
            <div className="price">
              <span className="price-value">{euro(total)}</span>
              <span className="caption">{K.preisHinweis}</span>
            </div>
            {!printable && (
              <p className="hint is-error" role="alert">
                {errors[0]?.message ?? problem ?? K.zuFiligran}
              </p>
            )}
            {saveError && <p className="hint is-error" role="alert">{saveError}</p>}
            <button className="button solid" type="submit" disabled={!printable || saving || !model}>
              {saving ? K.knopfLaeuft : K.knopf}
            </button>
          </div>
          <p className="caption after-summary">
            {catalog.legal.price_note_de} {K.hinweisUnten}
          </p>
        </form>
      </div>

      {saved && <SaveDialog saved={saved} euro={euro} onClose={() => setSaved(null)} />}
    </div>
  );
}
