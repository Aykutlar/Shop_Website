// Leiste unten im Konfigurator: Anzahl, Preis und der Knopf zum Sichern.
import catalog from '../../einstellungen/katalog.json';
import { TEXTE } from '../../einstellungen/texte';
import { euro } from '../technik/format';

const K = TEXTE.konfigurator;

export default function Zusammenfassung({ form, set, size, printable, fehler, saveError, saving, bereit }) {
  const total = size.unit_price_cents * form.quantity;

  return (
    <>
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
        {!printable && <p className="hint is-error" role="alert">{fehler ?? K.zuFiligran}</p>}
        {saveError && <p className="hint is-error" role="alert">{saveError}</p>}
        <button className="button solid" type="submit" disabled={!printable || saving || !bereit}>
          {saving ? K.knopfLaeuft : K.knopf}
        </button>
      </div>
      <p className="caption after-summary">
        {catalog.legal.price_note_de} {K.hinweisUnten}
      </p>
    </>
  );
}
