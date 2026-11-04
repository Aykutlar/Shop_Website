import { NextResponse } from 'next/server';
import { DAUER_S, neueSitzung, passwortRichtig, sitzungsCookie } from '../../../../technik/anmeldung.js';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_VERSUCHE = 10;
const versuche = new Map();

function gebremst(ip) {
  const jetzt = Date.now();
  const neu = (versuche.get(ip) ?? []).filter((t) => jetzt - t < WINDOW_MS);
  neu.push(jetzt);
  versuche.set(ip, neu);
  return neu.length > MAX_VERSUCHE;
}

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';
  if (gebremst(ip)) return NextResponse.json({ error: 'Zu viele Versuche. Bitte in 10 Minuten erneut.' }, { status: 429 });

  let body;
  try {
    body = JSON.parse((await request.text()).slice(0, 500));
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }
  if (!passwortRichtig(body?.passwort)) return NextResponse.json({ error: 'Passwort falsch.' }, { status: 401 });

  const antwort = NextResponse.json({ ok: true });
  antwort.cookies.set(sitzungsCookie(neueSitzung(), DAUER_S));
  return antwort;
}

export async function DELETE() {
  const antwort = NextResponse.json({ ok: true });
  antwort.cookies.set(sitzungsCookie('', 0));
  return antwort;
}
