// Ausgabeformate. Alles deterministisch: gleiche Eingabe, gleiche Bytes.

export function toBinaryStl(mesh) {
  const { vertProperties: v, triVerts: t, numProp: n } = mesh;
  const count = t.length / 3;
  const buffer = new ArrayBuffer(84 + count * 50);
  const view = new DataView(buffer);
  view.setUint32(80, count, true);
  let at = 84;
  for (let i = 0; i < count; i++) {
    const p = [0, 1, 2].map((c) => {
      const k = t[i * 3 + c] * n;
      return [v[k], v[k + 1], v[k + 2]];
    });
    const u = [0, 1, 2].map((a) => p[1][a] - p[0][a]);
    const w = [0, 1, 2].map((a) => p[2][a] - p[0][a]);
    const normal = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const len = Math.hypot(...normal) || 1;
    for (const value of [...normal.map((x) => x / len), ...p.flat()]) {
      view.setFloat32(at, value, true);
      at += 4;
    }
    at += 2;
  }
  return new Uint8Array(buffer);
}

const fmt = (x) => x.toFixed(3);

export function toSvg(outline) {
  const xs = outline.flat().map(([x]) => x);
  const ys = outline.flat().map(([, y]) => y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const [width, height] = [maxX - minX + 4, maxY - minY + 4];
  const d = outline
    .map((c) => `M${c.map(([x, y]) => `${fmt(x)} ${fmt(-y)}`).join('L')}Z`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(width)}mm" height="${fmt(height)}mm" `
    + `viewBox="${fmt(minX - 2)} ${fmt(-maxY - 2)} ${fmt(width)} ${fmt(height)}">`
    + `<path fill="#222" fill-rule="evenodd" d="${d}"/></svg>\n`;
}

export function toScad(outline, params, meta) {
  const points = [];
  const paths = [];
  for (const contour of outline) {
    const path = [];
    for (const [x, y] of contour) {
      path.push(points.length);
      points.push(`[${fmt(x)},${fmt(y)}]`);
    }
    paths.push(`[${path.join(',')}]`);
  }
  return `// Anhänger „${params.name}“, Geometrie-Kern ${meta.geometryVersion}
// Editierbar: Dicke und Skalierung. Text und Layout ändern = neu erzeugen aus recipe.json.
thickness = ${params.thicknessMm};
scale_xy = 1.0;

outline_points = [${points.join(',')}];
outline_paths = [${paths.join(',')}];

linear_extrude(height = thickness)
  scale([scale_xy, scale_xy])
    polygon(points = outline_points, paths = outline_paths);
`;
}
