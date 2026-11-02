import { Footer, Header } from '../components/Chrome';
import { MARKE, TEXTE } from '../inhalte/texte';
import './globals.css';

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
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
