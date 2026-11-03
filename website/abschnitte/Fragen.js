import catalog from '../../einstellungen/katalog.json';
import { TEXTE } from '../../einstellungen/texte';

const { oberzeile, ueberschrift, liste, warnhinweise } = TEXTE.fragen;

// Die Warnhinweise kommen aus dem Katalog, weil sie auch auf den Beipackzettel gehören.
const alleFragen = [...liste, [warnhinweise, catalog.legal.warnings_de.join(' ')]];

export default function Fragen() {
  return (
    <section id="fragen" className="band paper">
      <div className="narrow">
        <p className="eyebrow">{oberzeile}</p>
        <h2>{ueberschrift}</h2>
        {alleFragen.map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
