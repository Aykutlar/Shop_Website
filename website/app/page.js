// Die Startseite von oben nach unten.
// Reihenfolge ändern: Zeilen verschieben. Abschnitt entfernen: Zeile löschen.
import Ablauf from '../abschnitte/Ablauf';
import Fertigung from '../abschnitte/Fertigung';
import Fragen from '../abschnitte/Fragen';
import Zusagen from '../abschnitte/Zusagen';
import Konfigurator from '../konfigurator/Konfigurator';

export default function Startseite() {
  return (
    <main>
      <Konfigurator />
      <Zusagen />
      <Fertigung />
      <Ablauf />
      <Fragen />
    </main>
  );
}
