// Findet den Projektordner, egal von wo aus die Website gestartet wurde.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

function findeProjekt(start) {
  let ordner = start;
  while (!existsSync(join(ordner, 'einstellungen'))) {
    const oben = dirname(ordner);
    if (oben === ordner) throw new Error('Projektordner nicht gefunden');
    ordner = oben;
  }
  return ordner;
}

export const PROJEKT = findeProjekt(process.cwd());
