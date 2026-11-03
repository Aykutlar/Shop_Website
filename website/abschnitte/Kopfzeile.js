import Link from 'next/link';
import { MARKE, TEXTE } from '../../einstellungen/texte';

export default function Kopfzeile() {
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
