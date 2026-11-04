'use client';

// Die Lagerseite: Überblick, welche Shop-Farben lieferbar sind, und die Liste aller Rollen.
import { useMemo, useState } from 'react';
import catalog from '../../einstellungen/katalog.json';
import { LAGER } from '../../einstellungen/lager';
import { lieferbareFarben, materialien } from '../technik/lager-pruefung.mjs';

const MATERIALIEN = materialien(catalog, LAGER);
const AMS_PLAETZE = Array.from({ length: catalog.printer.ams_slots }, (_, i) => i + 1);

const LEER = {
  material: Object.keys(catalog.materials).find((m) => catalog.materials[m].enabled) ?? Object.keys(MATERIALIEN)[0],
  farbe: '',
  hex: '#FFFFFF',
  hersteller: 'Bambu Lab',
  restGramm: LAGER.neueRolleGramm,
  amsPlatz: '',
  shopFarbe: '',
  notiz: '',
};

async function senden(daten) {
  const antwort = await fetch('/api/lager', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(daten),
  });
  const json = await antwort.json().catch(() => ({}));
  if (!antwort.ok) throw new Error(json.error ?? 'Speichern fehlgeschlagen.');
  return json;
}

function Formular({ start, titel, onSpeichern, onAbbrechen, belegt }) {
  const [werte, setWerte] = useState(start);
  const [fehler, setFehler] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const set = (patch) => setWerte((w) => ({ ...w, ...patch }));

  const passendeShopFarben = catalog.colors.filter((c) => c.material === werte.material);

  const shopFarbeWaehlen = (id) => {
    const eintrag = catalog.colors.find((c) => c.id === id);
    // Name und Farbcode aus dem Katalog vorschlagen, solange noch nichts Eigenes eingetragen ist.
    set({
      shopFarbe: id,
      ...(eintrag && !werte.farbe ? { farbe: eintrag.label } : {}),
      ...(eintrag && werte.hex === LEER.hex ? { hex: eintrag.hex.toUpperCase() } : {}),
    });
  };

  async function absenden(e) {
    e.preventDefault();
    setLaeuft(true);
    setFehler(null);
    try {
      await onSpeichern({ ...werte, restGramm: Number(werte.restGramm) });
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <form className="lager-form" onSubmit={absenden}>
      <h2>{titel}</h2>
      <div className="lager-felder">
        <label>
          <span>Material</span>
          <select value={werte.material} onChange={(e) => set({ material: e.target.value, shopFarbe: '' })}>
            {Object.entries(MATERIALIEN).map(([id, label]) => (
              <option key={id} value={id}>{label}{catalog.materials[id] ? ' (Shop)' : ''}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Shop-Farbe</span>
          <select value={werte.shopFarbe ?? ''} onChange={(e) => shopFarbeWaehlen(e.target.value)}>
            <option value="">– nicht im Shop –</option>
            {passendeShopFarben.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>

        <label>
          <span>Farbname</span>
          <input value={werte.farbe} maxLength={40} required placeholder="z. B. Gold Metallic" onChange={(e) => set({ farbe: e.target.value })} />
        </label>

        <label className="lager-farbwahl">
          <span>Farbcode</span>
          <span className="lager-farbfeld">
            <input type="color" aria-label="Farbe auswählen" value={/^#[0-9A-Fa-f]{6}$/.test(werte.hex) ? werte.hex : '#FFFFFF'} onChange={(e) => set({ hex: e.target.value.toUpperCase() })} />
            <input value={werte.hex} maxLength={7} pattern="#[0-9A-Fa-f]{6}" onChange={(e) => set({ hex: e.target.value })} />
          </span>
        </label>

        <label>
          <span>Hersteller</span>
          <input value={werte.hersteller} maxLength={60} onChange={(e) => set({ hersteller: e.target.value })} />
        </label>

        <label>
          <span>Rest in Gramm</span>
          <input type="number" min={0} max={5000} step={1} required value={werte.restGramm} onChange={(e) => set({ restGramm: e.target.value })} />
        </label>

        <label>
          <span>AMS-Platz</span>
          <select value={werte.amsPlatz ?? ''} onChange={(e) => set({ amsPlatz: e.target.value })}>
            <option value="">– im Regal –</option>
            {AMS_PLAETZE.map((p) => (
              <option key={p} value={p} disabled={belegt.has(p)}>Platz {p}{belegt.has(p) ? ' (belegt)' : ''}</option>
            ))}
          </select>
        </label>

        <label className="lager-breit">
          <span>Notiz</span>
          <input value={werte.notiz} maxLength={300} placeholder="z. B. angebrochen, trocknen vor Gebrauch" onChange={(e) => set({ notiz: e.target.value })} />
        </label>
      </div>

      {fehler && <p className="lager-fehler" role="alert">{fehler}</p>}
      <div className="lager-knoepfe">
        <button className="button solid small" type="submit" disabled={laeuft}>{laeuft ? 'Speichert …' : 'Speichern'}</button>
        <button className="button ghost small" type="button" onClick={onAbbrechen}>Abbrechen</button>
      </div>
    </form>
  );
}

function Rest({ gramm }) {
  const anteil = Math.min(100, Math.round((gramm / LAGER.neueRolleGramm) * 100));
  const zustand = gramm < LAGER.mindestRestGramm ? 'leer' : gramm < LAGER.fastLeerGramm ? 'knapp' : 'gut';
  return (
    <span className={`lager-rest is-${zustand}`}>
      <span className="lager-balken"><span style={{ width: `${anteil}%` }} /></span>
      {gramm} g{zustand === 'knapp' ? ' · fast leer' : zustand === 'leer' ? ' · leer' : ''}
    </span>
  );
}

export default function LagerVerwaltung({ start }) {
  const [rollen, setRollen] = useState(start);
  const [bearbeiten, setBearbeiten] = useState(null); // null, 'neu' oder eine Rolle
  const [meldung, setMeldung] = useState(null);
  const [formNr, setFormNr] = useState(0); // neuer Schlüssel = frisches Formular bei jedem Öffnen

  const oeffnen = (ziel) => { setBearbeiten(ziel); setFormNr((n) => n + 1); setMeldung(null); };

  const lieferbar = useMemo(() => lieferbareFarben(catalog, LAGER, rollen), [rollen]);
  const angeboten = catalog.colors.filter((c) => c.in_stock && catalog.materials[c.material]?.enabled);

  const belegtAusser = (id) => new Set(rollen.filter((r) => r.amsPlatz && r.id !== id).map((r) => r.amsPlatz));

  async function speichern(werte) {
    if (bearbeiten === 'neu' || !bearbeiten.id) {
      const { rolle } = await senden({ aktion: 'anlegen', rolle: werte });
      setRollen((liste) => [...liste, rolle]);
      setMeldung(`„${rolle.farbe}“ angelegt.`);
    } else {
      const { rolle } = await senden({ aktion: 'aendern', id: bearbeiten.id, rolle: werte });
      setRollen((liste) => liste.map((r) => (r.id === rolle.id ? rolle : r)));
      setMeldung(`„${rolle.farbe}“ gespeichert.`);
    }
    setBearbeiten(null);
  }

  async function loeschen(rolle) {
    if (!window.confirm(`Rolle „${rolle.farbe}“ (${MATERIALIEN[rolle.material] ?? rolle.material}) wirklich löschen?`)) return;
    try {
      await senden({ aktion: 'loeschen', id: rolle.id });
      setRollen((liste) => liste.filter((r) => r.id !== rolle.id));
      setMeldung(`„${rolle.farbe}“ gelöscht.`);
    } catch (err) {
      setMeldung(err.message);
    }
  }

  async function abmelden() {
    await fetch('/api/lager/anmelden', { method: 'DELETE' });
    window.location.href = '/';
  }

  const formStart = (rolle) => (rolle === 'neu' ? LEER : {
    ...rolle,
    amsPlatz: rolle.amsPlatz ?? '',
    shopFarbe: rolle.shopFarbe ?? '',
  });

  return (
    <main className="lager">
      <header className="lager-kopf">
        <div>
          <p className="eyebrow">Hintergrund</p>
          <h1>Filamentlager</h1>
        </div>
        <div className="lager-knoepfe">
          <a className="button ghost small" href="/lager/fotostudio">Fotostudio</a>
          <button className="button ghost small" type="button" onClick={abmelden}>Abmelden</button>
        </div>
      </header>

      <section className="lager-block" aria-labelledby="shop-farben">
        <h2 id="shop-farben">Im Shop lieferbar: {lieferbar.length} von {angeboten.length} Farben</h2>
        <p className="caption">
          Eine Farbe erscheint im Konfigurator, sobald eine verknüpfte Rolle mindestens {LAGER.mindestRestGramm} g Rest hat.
          Neue Shop-Farben trägst du in <code>einstellungen/katalog.json</code> ein.
        </p>
        <ul className="lager-shopfarben">
          {angeboten.map((c) => {
            const da = lieferbar.includes(c.id);
            return (
              <li key={c.id} className={da ? 'is-da' : 'is-weg'}>
                <span className="lager-punkt" style={{ background: c.hex }} />
                <span>{c.label}</span>
                <span className="caption">{da ? 'lieferbar' : 'fehlt'}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="lager-block" aria-labelledby="rollen">
        <div className="lager-zeile">
          <h2 id="rollen">Rollen ({rollen.length})</h2>
          {!bearbeiten && <button className="button ghost small" type="button" onClick={() => oeffnen('neu')}>Rolle hinzufügen</button>}
        </div>
        {meldung && <p className="caption lager-meldung" role="status">{meldung}</p>}

        {bearbeiten && (
          <Formular
            key={formNr}
            titel={bearbeiten === 'neu' || !bearbeiten.id ? 'Neue Rolle' : `„${bearbeiten.farbe}“ bearbeiten`}
            start={formStart(bearbeiten)}
            belegt={belegtAusser(bearbeiten.id)}
            onSpeichern={speichern}
            onAbbrechen={() => setBearbeiten(null)}
          />
        )}

        {rollen.length === 0 ? (
          <p className="caption">Noch keine Rollen eingetragen. Ohne Rollen bietet der Shop keine Farbe an.</p>
        ) : (
          <div className="lager-tabelle-rahmen">
            <table className="lager-tabelle">
              <thead>
                <tr>
                  <th scope="col">Farbe</th>
                  <th scope="col">Material</th>
                  <th scope="col">Rest</th>
                  <th scope="col">AMS</th>
                  <th scope="col">Shop</th>
                  <th scope="col"><span className="lager-versteckt">Aktionen</span></th>
                </tr>
              </thead>
              <tbody>
                {rollen.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="lager-farbe">
                        <span className="lager-punkt" style={{ background: r.hex }} />
                        <span>
                          {r.farbe}
                          <span className="caption">{[r.hersteller, r.hex].filter(Boolean).join(' · ')}</span>
                          {r.notiz && <span className="caption lager-notiz">{r.notiz}</span>}
                        </span>
                      </span>
                    </td>
                    <td>{MATERIALIEN[r.material] ?? r.material}</td>
                    <td><Rest gramm={r.restGramm} /></td>
                    <td>{r.amsPlatz ? `Platz ${r.amsPlatz}` : '–'}</td>
                    <td>{catalog.colors.find((c) => c.id === r.shopFarbe)?.label ?? '–'}</td>
                    <td className="lager-aktionen">
                      <button type="button" onClick={() => oeffnen(r)}>Bearbeiten</button>
                      <button type="button" onClick={() => oeffnen({ ...r, id: undefined, amsPlatz: null, restGramm: LAGER.neueRolleGramm, notiz: '' })}>Weitere Rolle</button>
                      <button type="button" className="lager-loeschen" onClick={() => loeschen(r)}>Löschen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
