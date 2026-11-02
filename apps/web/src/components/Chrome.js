import Link from 'next/link';
import { MARKE, TEXTE } from '../inhalte/texte';

export function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/"><span className="brand-star" aria-hidden="true">✦</span>{MARKE}</Link>
      <nav aria-label="Hauptnavigation">
        <Link href="/#gestalten">{TEXTE.menue.gestalten}</Link>
        <Link href="/#manufaktur">{TEXTE.menue.fertigung}</Link>
        <Link href="/#ablauf">{TEXTE.menue.ablauf}</Link>
        <Link href="/#fragen">{TEXTE.menue.fragen}</Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <p className="brand">{MARKE}</p>
      <nav aria-label="Rechtliches">
        <Link href="/impressum">{TEXTE.fusszeile.impressum}</Link>
        <Link href="/datenschutz">{TEXTE.fusszeile.datenschutz}</Link>
      </nav>
      <p className="caption">{TEXTE.fusszeile.hinweis}</p>
    </footer>
  );
}
