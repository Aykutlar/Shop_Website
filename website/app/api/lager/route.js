// Anlegen, Ändern und Löschen von Filamentrollen. Nur mit Zugang (siehe technik/anmeldung.js).
import { NextResponse } from 'next/server';
import catalog from '../../../../einstellungen/katalog.json';
import { LAGER } from '../../../../einstellungen/lager';
import { angemeldet } from '../../../technik/anmeldung.js';
import { alleRollen, rolleAendern, rolleAnlegen, rolleLoeschen } from '../../../technik/lager.js';
import { pruefeRolle } from '../../../technik/lager-pruefung.mjs';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fehler = (meldung, status = 422) => NextResponse.json({ error: meldung }, { status });

export async function GET() {
  if (!(await angemeldet())) return fehler('Nicht gefunden.', 404);
  return NextResponse.json({ rollen: await alleRollen() });
}

export async function POST(request) {
  if (!(await angemeldet())) return fehler('Nicht gefunden.', 404);
  // Nur echte JSON-Anfragen dieser Seite; einfache Formulare fremder Seiten haben diesen Typ nicht.
  if (!request.headers.get('content-type')?.startsWith('application/json')) return fehler('Ungültige Anfrage.', 415);

  let body;
  try {
    const roh = await request.text();
    if (roh.length > 4000) return fehler('Anfrage zu groß.', 413);
    body = JSON.parse(roh);
  } catch {
    return fehler('Ungültige Anfrage.', 400);
  }

  const { aktion, id, rolle } = body ?? {};
  if (aktion !== 'anlegen' && !UUID.test(id ?? '')) return fehler('Unbekannte Rolle.', 400);

  try {
    if (aktion === 'loeschen') {
      return (await rolleLoeschen(id)) ? NextResponse.json({ ok: true }) : fehler('Rolle nicht gefunden.', 404);
    }
    if (aktion !== 'anlegen' && aktion !== 'aendern') return fehler('Unbekannte Aktion.', 400);

    const { fehler: probleme, werte } = pruefeRolle(catalog, LAGER, rolle);
    if (probleme.length) return fehler(probleme.join(' '));

    const ergebnis = aktion === 'anlegen' ? await rolleAnlegen(werte) : await rolleAendern(id, werte);
    if (!ergebnis) return fehler('Rolle nicht gefunden.', 404);
    return NextResponse.json({ rolle: ergebnis }, { status: aktion === 'anlegen' ? 201 : 200 });
  } catch (e) {
    if (e?.code === '23505') return fehler(`AMS-Platz ${rolle?.amsPlatz} ist schon mit einer anderen Rolle belegt.`, 409);
    throw e;
  }
}
