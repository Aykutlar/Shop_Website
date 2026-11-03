import { RECHTLICHES as LEGAL } from '../../../einstellungen/texte';

export const metadata = { title: 'Impressum' };

export default function Impressum() {
  return (
    <main className="legal">
      <p className="draft">Entwurf: Die Angaben in eckigen Klammern müssen vor dem Livegang ersetzt und rechtlich geprüft werden.</p>
      <h1>Impressum</h1>
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>{LEGAL.betreiber}<br />{LEGAL.strasse}<br />{LEGAL.ort}</p>
      <h2>Kontakt</h2>
      <p>E-Mail: {LEGAL.email}<br />Telefon: {LEGAL.telefon}</p>
      <h2>Umsatzsteuer</h2>
      <p>{LEGAL.ustId}</p>
    </main>
  );
}
