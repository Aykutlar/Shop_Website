// Bordeauxrote Leiste unter dem Konfigurator.
import { TEXTE } from '../../einstellungen/texte';

export default function Zusagen() {
  return (
    <section className="assurance" aria-label="Unser Versprechen">
      {TEXTE.zusagen.map(([title, text]) => (
        <div key={title}>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      ))}
    </section>
  );
}
