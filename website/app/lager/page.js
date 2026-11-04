// Hintergrundseite: Welche Filamente und Farben sind da?
// Ohne Anmeldung antwortet sie wie eine nicht vorhandene Seite. Der Einstieg ist versteckt
// in der Fußzeile (abschnitte/GeheimerZugang.js).
import { notFound } from 'next/navigation';
import LagerVerwaltung from '../../lager/LagerVerwaltung';
import { angemeldet } from '../../technik/anmeldung.js';
import { alleRollen } from '../../technik/lager.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Filamentlager', robots: { index: false, follow: false } };

export default async function Lager() {
  if (!(await angemeldet())) notFound();
  return <LagerVerwaltung start={await alleRollen()} />;
}
