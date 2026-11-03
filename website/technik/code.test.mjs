import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { generateCode, parseCode } from './code.mjs';

test('erzeugte Codes passen zum Datenbankformat und lassen sich lesen', () => {
  for (let i = 0; i < 2000; i++) {
    const code = generateCode(randomBytes);
    assert.match(code, /^WX-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
    assert.equal(parseCode(code), code);
  }
});

test('Schreibvarianten werden toleriert', () => {
  const code = generateCode(randomBytes);
  assert.equal(parseCode(` ${code.toLowerCase().replace(/-/g, ' ')} `), code);
});

test('ein einzelner Tippfehler wird erkannt', () => {
  const code = 'WX-7K3M-9QF2';
  const valid = parseCode(code) ?? generateCode(() => Uint8Array.from([1, 2, 3, 4, 5, 6, 7]));
  const swapped = valid[3] === '0' ? `WX-1${valid.slice(4)}` : `WX-0${valid.slice(4)}`;
  assert.equal(parseCode(swapped), null);
});

test('Unsinn wird abgelehnt', () => {
  for (const bad of ['', 'Julia', 'WX-1234', '🎄🎄🎄🎄🎄🎄🎄🎄']) assert.equal(parseCode(bad), null);
});
