// Rahmen um jede Seite: Kopfzeile, Inhalt, Fußzeile und alle Stildateien.
import Fusszeile from '../abschnitte/Fusszeile';
import Kopfzeile from '../abschnitte/Kopfzeile';
import { MARKE, TEXTE } from '../../einstellungen/texte';
import '../stil/schriften.css';
import '../../einstellungen/farben.css';
import '../stil/grundlagen.css';
import '../stil/kopf-und-fuss.css';
import '../stil/buehne.css';
import '../stil/konfigurator.css';
import '../stil/code-fenster.css';
import '../stil/abschnitte.css';
import '../stil/rechtstexte.css';
import '../stil/bildschirmgroessen.css';

export const metadata = {
  title: `${MARKE} – ${TEXTE.seite.untertitel}`,
  description: TEXTE.seite.beschreibung,
};

export const viewport = { themeColor: '#0b1a14' };

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <a className="skip" href="#gestalten">Zum Konfigurator springen</a>
        <Kopfzeile />
        {children}
        <Fusszeile />
      </body>
    </html>
  );
}
