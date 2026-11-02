// Nur die jeweils neueste Anfrage zählt. Der Worker wird regelmäßig ersetzt,
// weil WASM-Objekte sonst über viele Änderungen hinweg Speicher ansammeln.
const BUILDS_PER_WORKER = 40;

const spawn = () => new Worker(new URL('./geometry.worker.js', import.meta.url), { type: 'module' });

export function createGeometryClient(onResult) {
  let worker = null;
  let builds = 0;
  let running = false;
  let pending = null;
  let nextId = 0;
  let closed = false;

  const run = () => {
    if (running || !pending || closed) return;
    const params = pending;
    pending = null;
    running = true;
    if (!worker || builds >= BUILDS_PER_WORKER) {
      worker?.terminate();
      worker = spawn();
      builds = 0;
      worker.onmessage = ({ data }) => {
        running = false;
        if (!closed) onResult(data);
        run();
      };
      worker.onerror = () => {
        running = false;
        worker?.terminate();
        worker = null;
        if (!closed) onResult({ ok: false, code: 'WORKER', message: 'Die Vorschau konnte nicht berechnet werden.' });
      };
    }
    builds += 1;
    worker.postMessage({ id: nextId++, params });
  };

  return {
    request(params) {
      pending = params;
      run();
    },
    close() {
      closed = true;
      worker?.terminate();
    },
  };
}
