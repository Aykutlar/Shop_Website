// Node-Anbindung: lädt WASM und Schriften, schreibt die Auftragsdateien.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import Module from 'manifold-3d';
import { buildOrnament } from './berechnung.mjs';
import { toBinaryStl, toScad, toSvg } from './dateiformate.mjs';

const require = createRequire(import.meta.url);
const opentype = require('opentype.js');

const FONT_FILES = {
  pacifico: ['@fontsource/pacifico', 'pacifico', '400'],
  dancing_bold: ['@fontsource/dancing-script', 'dancing-script', '700'],
  nunito_black: ['@fontsource/nunito', 'nunito', '900'],
};

function loadFonts() {
  const fonts = {};
  for (const [id, [pkg, slug, weight]] of Object.entries(FONT_FILES)) {
    const dir = dirname(require.resolve(`${pkg}/package.json`));
    fonts[id] = ['latin', 'latin-ext'].map((subset) => {
      const b = readFileSync(join(dir, 'files', `${slug}-${subset}-${weight}-normal.woff`));
      return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
    });
  }
  return fonts;
}

export async function createGenerator() {
  const wasm = await Module();
  wasm.setup();
  const fonts = loadFonts();
  return (params) => buildOrnament(wasm, fonts, params);
}

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

export function writeArtifacts(result, params, outDir) {
  mkdirSync(outDir, { recursive: true });
  const files = {
    'model.stl': toBinaryStl(result.mesh),
    'model.scad': toScad(result.outline, params, result.meta),
    'layout.svg': toSvg(result.outline),
    'recipe.json': `${JSON.stringify({ params, meta: result.meta }, null, 2)}\n`,
  };
  const hashes = {};
  for (const [name, data] of Object.entries(files)) {
    writeFileSync(join(outDir, name), data);
    hashes[name] = sha256(data);
  }
  return hashes;
}
