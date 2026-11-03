import { TEXTE } from '../../einstellungen/texte';

const { oberzeile, ueberschrift, spalten } = TEXTE.fertigung;

export default function Fertigung() {
  return (
    <section id="manufaktur" className="band wine">
      <p className="eyebrow">{oberzeile}</p>
      <h2>{ueberschrift}</h2>
      <div className="columns">
        {spalten.map(([title, text]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
