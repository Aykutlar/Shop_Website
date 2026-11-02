// Erzeugt die Test-Matrix und prüft Determinismus + Qualitätsprüfung.
// Aufruf: node packages/geometry/matrix.mjs <ausgabeordner>
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { createGenerator, writeArtifacts } from './src/node.mjs';

const out = process.argv[2] ?? 'out';
const base = { diameterMm: 80, thicknessMm: 3, nozzle: 'n04', shape: 'wreath' };
const cases = [
  { name: 'Julia', font: 'pacifico', frame: 'snowflakes' },
  { name: 'Julia', font: 'dancing_bold', frame: 'stars', year: 2026 },
  { name: 'Max', font: 'pacifico', frame: 'stars', symbol: 'star' },
  { name: 'Jörg', font: 'pacifico', frame: 'snowflakes', symbol: 'snowflake', year: 2026 },
  { name: 'Ayşe', font: 'pacifico', frame: 'plain', symbol: 'heart' },
  { name: 'Maximilian', font: 'pacifico', frame: 'fir' },
  { name: 'Emma', font: 'nunito_black', frame: 'snowflakes', symbol: 'bell' },
  { name: 'Lilli', font: 'dancing_bold', frame: 'plain', diameterMm: 60 },
  { name: 'Anna-Lena', font: 'pacifico', frame: 'stars', diameterMm: 100 },
  { name: 'Julia', font: 'pacifico', shape: 'bauble', frame: 'fir', year: 2026 },
  { name: 'Clara', font: 'dancing_bold', shape: 'bauble', frame: 'snowflakes', symbol: 'heart' },
  { name: 'Ida', font: 'pacifico', shape: 'bauble', frame: 'stars', symbol: 'star' },
  { name: 'Leon', font: 'pacifico', shape: 'bauble', frame: 'plain', symbol: 'bell', year: 2026 },
  { name: 'Mia', font: 'pacifico', shape: 'star', frame: 'plain', symbol: 'none' },
  { name: 'Noah', font: 'nunito_black', shape: 'star', frame: 'plain', symbol: 'heart' },
  { name: 'Lotta', font: 'pacifico', shape: 'star', frame: 'plain', symbol: 'snowflake' },
  { name: 'Emil', font: 'pacifico', shape: 'tree', frame: 'plain', symbol: 'star' },
  { name: 'Paula', font: 'dancing_bold', shape: 'tree', frame: 'plain', symbol: 'snowflake' },
  { name: 'Sophie', font: 'dancing_bold', shape: 'pure', frame: 'plain', symbol: 'star' },
  { name: 'Hannah', font: 'pacifico', shape: 'pure', frame: 'plain' },
  { name: 'Greta', font: 'pacifico', frame: 'fir', symbol: 'bell', diameterMm: 70 },
  { name: 'Theo', font: 'dancing_bold', frame: 'snowflakes', diameterMm: 120, thicknessMm: 4 },
];

const generate = await createGenerator();
let failed = 0;
for (const [i, c] of cases.entries()) {
  const params = { ...base, ...c };
  const dir = join(out, `${String(i + 1).padStart(2, '0')}-${c.name}-${params.shape}`);
  try {
    const hashes = writeArtifacts(generate(params), params, dir);
    const again = writeArtifacts(generate(params), params, join(dir, 'rerun'));
    const same = hashes['model.stl'] === again['model.stl'];
    const qc = spawnSync('python', ['services/qc/check_model.py', dir], { encoding: 'utf8' });
    const line = qc.stdout.trim() || qc.stderr.trim().split('\n').slice(-3).join(' | ');
    if (qc.status !== 0 || !same) failed++;
    console.log(`${qc.status === 0 ? 'OK  ' : 'FAIL'} determin=${same} ${c.name}/${c.font}/${c.frame}${c.year ? '/' + c.year : ''}/D${params.diameterMm}: ${line}`);
  } catch (error) {
    failed++;
    console.log(`ERR  ${c.name}/${c.font}: ${error.code ?? ''} ${error.message}`);
  }
}
console.log(`\n${cases.length - failed}/${cases.length} ok`);
process.exit(failed ? 1 : 0);
