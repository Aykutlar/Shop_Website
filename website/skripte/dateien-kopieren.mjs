// Kopiert WASM und Schriften nach public/: alles wird selbst gehostet, nichts kommt von Drittservern.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const root = (pkg) => dirname(require.resolve(`${pkg}/package.json`));

const copy = (from, to) => {
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
};

const manifold = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'node_modules', 'manifold-3d');
copy(join(manifold, 'manifold.js'), join(pub, 'vendor', 'manifold.js'));
copy(join(manifold, 'manifold.wasm'), join(pub, 'vendor', 'manifold.wasm'));
copy(join(manifold, 'LICENSE'), join(pub, 'vendor', 'manifold.LICENSE.txt'));

for (const [pkg, slug, weights] of [
  ['@fontsource/pacifico', 'pacifico', ['400']],
  ['@fontsource/dancing-script', 'dancing-script', ['700']],
  ['@fontsource/nunito', 'nunito', ['900']],
]) {
  const dir = join(root(pkg), 'files');
  for (const weight of weights) {
    for (const subset of ['latin', 'latin-ext']) {
      const name = `${slug}-${subset}-${weight}-normal.woff`;
      copy(join(dir, name), join(pub, 'fonts', name));
    }
  }
  copy(join(root(pkg), 'LICENSE'), join(pub, 'fonts', `${slug}.LICENSE.txt`));
}

for (const [pkg, slug, files] of [
  ['@fontsource/cormorant-garamond', 'cormorant-garamond', ['latin-400-normal', 'latin-500-normal', 'latin-400-italic', 'latin-ext-400-normal']],
  ['@fontsource/jost', 'jost', ['latin-300-normal', 'latin-400-normal', 'latin-500-normal', 'latin-ext-400-normal']],
]) {
  for (const file of files) {
    const name = `${slug}-${file}.woff2`;
    copy(join(root(pkg), 'files', name), join(pub, 'fonts', name));
  }
  copy(join(root(pkg), 'LICENSE'), join(pub, 'fonts', `${slug}.LICENSE.txt`));
}
console.log('Assets kopiert');
