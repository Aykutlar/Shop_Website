// Erster Bildschirm rechts neben dem Anhänger.
import { TEXTE } from '../../einstellungen/texte';

const S = TEXTE.start;

export default function Einleitung() {
  return (
    <header className="intro">
      <p className="eyebrow">{S.oberzeile}</p>
      <h1>{S.ueberschrift1}<br /><em>{S.ueberschrift2}</em></h1>
      <p className="lede">{S.einleitung}</p>
      <ul className="promises">
        {S.versprechen.map((text) => <li key={text}>{text}</li>)}
      </ul>
      <a className="button ghost" href="#gestalten">{S.knopf}</a>
    </header>
  );
}
