import Link from 'next/link';
import { MARKE, TEXTE } from '../../einstellungen/texte';
import GeheimerZugang from './GeheimerZugang';

export default function Fusszeile() {
  return (
    <footer className="site-footer">
      <GeheimerZugang>{MARKE}</GeheimerZugang>
      <nav aria-label="Rechtliches">
        <Link href="/impressum">{TEXTE.fusszeile.impressum}</Link>
        <Link href="/datenschutz">{TEXTE.fusszeile.datenschutz}</Link>
      </nav>
      <p className="caption">{TEXTE.fusszeile.hinweis}</p>
    </footer>
  );
}
