// Hintergrundseite: Etsy-Bilder aus der Druckgeometrie. Gleicher Schutz wie /lager.
import { notFound } from 'next/navigation';
import Fotostudio from '../../../lager/Fotostudio';
import { angemeldet } from '../../../technik/anmeldung.js';
import { lieferbar } from '../../../technik/lager.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Fotostudio', robots: { index: false, follow: false } };

export default async function FotostudioSeite() {
  if (!(await angemeldet())) notFound();
  return <Fotostudio lieferbar={await lieferbar()} />;
}
