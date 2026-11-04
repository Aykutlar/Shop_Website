// Schutz für die Hintergrundseiten (z. B. /lager).
// Zugang nur mit dem Passwort aus der Umgebungsvariable LAGER_PASSWORT, auch lokal.
// Ist keins gesetzt, ist der Hintergrund für alle verschlossen. Das Passwort steht nie im Code.
// Später wird das durch die Passkey-Anmeldung aus dem Datenmodell (admin_users) ersetzt.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SITZUNG = 'lager_sitzung';
export const DAUER_S = 12 * 60 * 60;

const passwort = () => process.env.LAGER_PASSWORT || null;

const signatur = (ablauf) => createHmac('sha256', passwort()).update(`lager:${ablauf}`).digest('hex');

const gleich = (a, b) => {
  const x = createHash('sha256').update(String(a)).digest();
  const y = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(x, y);
};

export function neueSitzung() {
  const ablauf = Date.now() + DAUER_S * 1000;
  return `${ablauf}.${signatur(ablauf)}`;
}

function sitzungGueltig(wert) {
  if (!passwort() || typeof wert !== 'string') return false;
  const [ablauf, sig] = wert.split('.');
  if (!/^\d+$/.test(ablauf ?? '') || Number(ablauf) < Date.now()) return false;
  return gleich(sig, signatur(ablauf));
}

export const passwortRichtig = (eingabe) => Boolean(passwort()) && typeof eingabe === 'string' && gleich(eingabe, passwort());

export async function angemeldet() {
  return sitzungGueltig((await cookies()).get(SITZUNG)?.value);
}

export const sitzungsCookie = (wert, maxAge) => ({
  name: SITZUNG,
  value: wert,
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge,
});
