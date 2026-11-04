'use client';

// Versteckter Einstieg in den Hintergrund: fünfmal schnell auf den Markennamen in der
// Fußzeile klicken (oder tippen). Für alle anderen sieht das aus wie normaler Text.
import { useRef, useState } from 'react';

const KLICKS = 5;
const ZEITFENSTER_MS = 2500;

export default function GeheimerZugang({ children }) {
  const fenster = useRef(null);
  const klicks = useRef([]);
  const [passwort, setPasswort] = useState('');
  const [fehler, setFehler] = useState(null);
  const [laeuft, setLaeuft] = useState(false);

  function klick() {
    const jetzt = Date.now();
    klicks.current = [...klicks.current.filter((t) => jetzt - t < ZEITFENSTER_MS), jetzt];
    if (klicks.current.length >= KLICKS) {
      klicks.current = [];
      setFehler(null);
      setPasswort('');
      fenster.current?.showModal();
    }
  }

  async function anmelden(e) {
    e.preventDefault();
    setLaeuft(true);
    setFehler(null);
    try {
      const antwort = await fetch('/api/lager/anmelden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwort }),
      });
      if (antwort.ok) {
        window.location.href = '/lager';
        return;
      }
      setFehler((await antwort.json().catch(() => ({}))).error ?? 'Anmeldung fehlgeschlagen.');
    } catch {
      setFehler('Keine Verbindung zum Server.');
    }
    setLaeuft(false);
  }

  return (
    <>
      <p className="brand geheim" onClick={klick}>{children}</p>
      <dialog ref={fenster} className="geheim-fenster" onClose={() => setPasswort('')}>
        <form className="lager-form" onSubmit={anmelden}>
          <label>
            <span>Passwort</span>
            <input type="password" autoComplete="current-password" required autoFocus value={passwort} onChange={(e) => setPasswort(e.target.value)} />
          </label>
          {fehler && <p className="lager-fehler" role="alert">{fehler}</p>}
          <div className="lager-knoepfe">
            <button className="button solid small" type="submit" disabled={laeuft}>{laeuft ? 'Prüft …' : 'Anmelden'}</button>
            <button className="button ghost small" type="button" onClick={() => fenster.current?.close()}>Schließen</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
