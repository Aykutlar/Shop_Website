// Konfigurationscode WX-XXXX-XXXX: Crockford-Base32, 7 Zufallszeichen (35 Bit) + 1 Prüfzeichen.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function checkChar(body) {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += (i + 1) * ALPHABET.indexOf(body[i]);
  return ALPHABET[sum % 32];
}

export function generateCode(randomBytes) {
  const body = [...randomBytes(7)].map((b) => ALPHABET[b % 32]).join('');
  const full = body + checkChar(body);
  return `WX-${full.slice(0, 4)}-${full.slice(4)}`;
}

// Toleriert Kleinschreibung, Leerzeichen, fehlende Bindestriche und O/I/L-Verwechslungen.
export function parseCode(input) {
  const cleaned = String(input).toUpperCase().replace(/[\s-]/g, '').replace(/^WX/, '')
    .replace(/O/g, '0').replace(/[IL]/g, '1');
  if (cleaned.length !== 8 || [...cleaned].some((c) => !ALPHABET.includes(c))) return null;
  if (checkChar(cleaned.slice(0, 7)) !== cleaned[7]) return null;
  return `WX-${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}
