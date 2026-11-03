import { RECHTLICHES as LEGAL } from '../../../einstellungen/texte';

export const metadata = { title: 'Datenschutz' };

export default function Datenschutz() {
  return (
    <main className="legal">
      <p className="draft">Entwurf: Dieser Text ist eine technische Vorlage, keine Rechtsberatung. Er muss vor dem Livegang ergänzt und geprüft werden.</p>
      <h1>Datenschutzerklärung</h1>
      <h2>Verantwortlicher</h2>
      <p>{LEGAL.betreiber}, {LEGAL.strasse}, {LEGAL.ort}, {LEGAL.email}</p>
      <h2>Hosting</h2>
      <p>Diese Website wird bei {LEGAL.hoster} betrieben. Beim Aufruf fallen technisch notwendige Verbindungsdaten an (Art. 6 Abs. 1 lit. f DSGVO).</p>
      <h2>Konfigurationsdaten</h2>
      <p>Wenn Sie Ihre Gestaltung sichern, speichern wir die gewählten Angaben einschließlich des eingegebenen Schriftzugs sowie einen Code. Nicht bestellte Gestaltungen werden nach 90 Tagen gelöscht. Bestellte Gestaltungen bewahren wir 24 Monate nach Abschluss auf, um Nachdrucke und Gewährleistung zu ermöglichen.</p>
      <h2>Bestellung über Etsy</h2>
      <p>Bestellung und Bezahlung erfolgen über Etsy. Dort gilt die Datenschutzerklärung von Etsy. Von Bestellungen verarbeiten wir nur die für die Zuordnung und Fertigung nötigen Angaben.</p>
      <h2>Cookies und Reichweitenmessung</h2>
      <p>Diese Website setzt keine Cookies zur Reichweitenmessung oder Werbung ein. Schriften und Programmbibliotheken liegen auf unserem eigenen Server, es werden keine Inhalte von Drittanbietern nachgeladen.</p>
      <h2>Ihre Rechte</h2>
      <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, sich bei einer Aufsichtsbehörde zu beschweren.</p>
    </main>
  );
}
