// Rechnet die echte Produktionsgeometrie im Browser, abseits der Oberfläche.
import { buildOrnament } from '@ornament/geometry/src/kernel.mjs';
import { parse } from 'opentype.js';

const FONT_FILES = {
  pacifico: ['pacifico', '400'],
  dancing_bold: ['dancing-script', '700'],
  nunito_black: ['nunito', '900'],
};

async function loadFonts() {
  const fonts = {};
  await Promise.all(Object.entries(FONT_FILES).map(async ([id, [slug, weight]]) => {
    fonts[id] = await Promise.all(['latin', 'latin-ext'].map(async (subset) => {
      const response = await fetch(`/fonts/${slug}-${subset}-${weight}-normal.woff`);
      if (!response.ok) throw new Error(`Schrift ${slug} nicht ladbar`);
      return parse(await response.arrayBuffer());
    }));
  }));
  return fonts;
}

async function start() {
  // Bewusst nicht gebündelt: die Datei liegt selbst gehostet in public/vendor.
  const { default: Module } = await import(/* webpackIgnore: true */ '/vendor/manifold.js');
  const wasm = await Module();
  wasm.setup();
  return { wasm, fonts: await loadFonts() };
}

const ready = start();

self.onmessage = async ({ data: { id, params } }) => {
  try {
    const { wasm, fonts } = await ready;
    const { mesh, meta } = buildOrnament(wasm, fonts, params);
    const vertices = Float32Array.from(mesh.vertProperties);
    const indices = Uint32Array.from(mesh.triVerts);
    self.postMessage(
      { id, ok: true, vertices, indices, stride: mesh.numProp, meta },
      [vertices.buffer, indices.buffer],
    );
  } catch (error) {
    self.postMessage({ id, ok: false, code: error.code ?? 'GEOMETRY', message: error.message });
  }
};
