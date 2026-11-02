import Configurator from '../components/Configurator';
import { TEXTE } from '../inhalte/texte';
import catalog from '../../../../config/katalog.json';

// Aufbau der Startseite von oben nach unten. Die Texte stehen in src/inhalte/texte.js.
export default function Home() {
  const { zusagen, fertigung, ablauf, fragen } = TEXTE;
  const alleFragen = [...fragen.liste, [fragen.warnhinweise, catalog.legal.warnings_de.join(' ')]];

  return (
    <main>
      <Configurator />

      <section className="assurance" aria-label="Unser Versprechen">
        {zusagen.map(([title, text]) => (
          <div key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </section>

      <section id="manufaktur" className="band wine">
        <p className="eyebrow">{fertigung.oberzeile}</p>
        <h2>{fertigung.ueberschrift}</h2>
        <div className="columns">
          {fertigung.spalten.map(([title, text]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="ablauf" className="band alt">
        <p className="eyebrow">{ablauf.oberzeile}</p>
        <h2>{ablauf.ueberschrift}</h2>
        <ol className="timeline">
          {ablauf.schritte.map(([title, text]) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="fragen" className="band paper">
        <div className="narrow">
          <p className="eyebrow">{fragen.oberzeile}</p>
          <h2>{fragen.ueberschrift}</h2>
          {alleFragen.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
