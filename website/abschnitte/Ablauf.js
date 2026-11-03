import { TEXTE } from '../../einstellungen/texte';

const { oberzeile, ueberschrift, schritte } = TEXTE.ablauf;

export default function Ablauf() {
  return (
    <section id="ablauf" className="band alt">
      <p className="eyebrow">{oberzeile}</p>
      <h2>{ueberschrift}</h2>
      <ol className="timeline">
        {schritte.map(([title, text]) => (
          <li key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
