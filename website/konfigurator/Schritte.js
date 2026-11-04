// Die Auswahlschritte von oben nach unten. Reihenfolge ändern: Blöcke verschieben,
// die Nummerierung passt sich an. Die Optionen selbst stehen in einstellungen/katalog.json.
import catalog from '../../einstellungen/katalog.json';
import { TEXTE } from '../../einstellungen/texte';
import { euro, mm } from '../technik/format';

const K = TEXTE.konfigurator;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
const FONT_FAMILY = Object.fromEntries(catalog.fonts.map((f) => [f.id, f.family]));

function Schritt({ titel, nummer, hinweis, children }) {
  return (
    <fieldset className="step">
      <legend><span className="step-no">{nummer}</span>{titel}</legend>
      {hinweis && <p className="hint">{hinweis}</p>}
      {children}
    </fieldset>
  );
}

function Option({ gruppe, aktiv, onChange, className = '', children }) {
  return (
    <label className={`option ${aktiv ? 'is-on' : ''} ${className}`}>
      <input type="radio" name={gruppe} checked={aktiv} onChange={onChange} />
      {children}
    </label>
  );
}

export default function Schritte({ form, set, shape, color, farben, errors, pickShape }) {
  let index = 0;
  const nummer = () => ROMAN[index++];

  return (
    <>
      <div className="step">
        <label className="step-title" htmlFor="name"><span className="step-no">{nummer()}</span>{K.name}</label>
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

      <Schritt titel={K.schrift} nummer={nummer()}>
        <div className="grid three">
          {catalog.fonts.map((f) => (
            <Option key={f.id} gruppe="font" aktiv={form.font === f.id} onChange={() => set({ font: f.id })} className="font-card">
              <span className="font-sample" style={{ fontFamily: f.family }}>{form.name || 'Name'}</span>
              <span className="caption">{f.label}</span>
            </Option>
          ))}
        </div>
      </Schritt>

      <Schritt titel={K.form} nummer={nummer()}>
        <div className="grid five">
          {catalog.shapes.map((s) => (
            <Option key={s.id} gruppe="shape" aktiv={form.shape === s.id} onChange={() => pickShape(s)}>
              <span className="caption">{s.label}</span>
            </Option>
          ))}
        </div>
      </Schritt>

      {shape.frames.length > 1 && (
        <Schritt titel={K.verzierung} nummer={nummer()}>
          <div className="grid five">
            {shape.frames.map((id) => (
              <Option key={id} gruppe="frame" aktiv={form.frame === id} onChange={() => set({ frame: id })}>
                <span className="caption">{catalog.frames.find((f) => f.id === id).label}</span>
              </Option>
            ))}
          </div>
        </Schritt>
      )}

      <Schritt titel={K.symbol} nummer={nummer()}>
        <div className="grid five">
          {catalog.symbols.map((s) => (
            <Option key={s.id} gruppe="symbol" aktiv={form.symbol === s.id} onChange={() => set({ symbol: s.id })}>
              <span className="caption">{s.label}</span>
            </Option>
          ))}
        </div>
      </Schritt>

      <Schritt titel={K.groesse} nummer={nummer()}>
        <div className="grid three">
          {catalog.sizes.filter((s) => s.nozzles.includes('n04')).map((s) => (
            <Option key={s.id} gruppe="size" aktiv={form.diameterMm === s.diameter_mm} onChange={() => set({ diameterMm: s.diameter_mm })}>
              <span className="caption strong">{s.label}</span>
              <span className="caption">{s.diameter_mm} mm · {euro(s.unit_price_cents)}</span>
            </Option>
          ))}
        </div>
      </Schritt>

      <Schritt titel={K.staerke} nummer={nummer()}>
        <div className="grid three">
          {catalog.thickness_mm.n04.map((t) => (
            <Option key={t} gruppe="thickness" aktiv={form.thicknessMm === t} onChange={() => set({ thicknessMm: t })}>
              <span className="caption">{mm(t)} mm</span>
            </Option>
          ))}
        </div>
      </Schritt>

      <Schritt titel={K.farbe} nummer={nummer()} hinweis={farben.length ? `${color.label}, ${K.farbeHinweis}` : K.keineFarbe}>
        <div className="swatches">
          {catalog.colors.filter((c) => farben.includes(c.id)).map((c) => (
            <label key={c.id} className={`swatch ${form.color === c.id ? 'is-on' : ''}`} title={c.label}>
              <input type="radio" name="color" aria-label={c.label} checked={form.color === c.id} onChange={() => set({ color: c.id })} />
              <span style={{ background: c.hex }} />
            </label>
          ))}
        </div>
      </Schritt>

      {shape.supports_year && (
        <div className="step">
          <span className="step-title"><span className="step-no">{nummer()}</span>{K.jahreszahl}</span>
          <label className="toggle">
            <input type="checkbox" checked={form.withYear} onChange={(e) => set({ withYear: e.target.checked })} />
            <span>{K.jahreszahlAuswahl}</span>
          </label>
          {form.withYear && (
            <input
              className="year-input"
              type="number"
              aria-label={K.jahreszahl}
              min={catalog.text.year.min}
              max={catalog.text.year.max}
              value={form.year}
              onChange={(e) => set({ year: Number(e.target.value) })}
            />
          )}
        </div>
      )}
    </>
  );
}
