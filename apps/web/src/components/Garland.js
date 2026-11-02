import { DEKO } from '../inhalte/deko';

// Tannengirlande, aus der der Anhänger hängt. Kugeln und Lichter stehen in src/inhalte/deko.js.
// Die Nadeln entstehen mit festem Startwert, damit Server und Browser dasselbe Bild erzeugen.
function seeded(seed) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

const WIDTH = 1000;
// Ganzzahlig: Gleitkommawerte dürfen zwischen Server und Browser nicht abweichen.
const sag = (x) => Math.round(26 + 34 * Math.sin((x / WIDTH) * Math.PI));

function needles() {
  const random = seeded(4711);
  const shades = ['#0f3a2a', '#14503a', '#1b6347', '#0c2e22'];
  const lines = [];
  for (let x = -20; x < WIDTH + 20; x += 3.2) {
    const y = sag(x);
    for (let i = 0; i < 5; i++) {
      const angle = (random() * 1.5 + 0.2) * (random() > 0.5 ? 1 : -1) + Math.PI / 2;
      const length = 26 + random() * 34;
      lines.push({
        x1: x.toFixed(1),
        y1: y.toFixed(1),
        x2: (x + Math.cos(angle) * length * 1.3).toFixed(1),
        y2: (y + Math.sin(angle) * length * 0.9).toFixed(1),
        shade: shades[Math.floor(random() * shades.length)],
      });
    }
  }
  return lines;
}

const LIGHTS = Array.from({ length: DEKO.lichter }, (_, i) => {
  const x = Math.round(26 + (i * 948) / Math.max(DEKO.lichter - 1, 1));
  return { x, y: sag(x) + (i % 2 ? 22 : 8), delay: (i * 0.37) % 2.6 };
});

export default function Garland() {
  return (
    <svg className="garland" viewBox={`0 0 ${WIDTH} 170`} preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <defs>
        <radialGradient id="gold" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fbeec6" />
          <stop offset="0.45" stopColor="#d4af6a" />
          <stop offset="1" stopColor="#7a5a24" />
        </radialGradient>
        <radialGradient id="wine" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#c9465a" />
          <stop offset="0.5" stopColor="#7c1428" />
          <stop offset="1" stopColor="#35060f" />
        </radialGradient>
      </defs>
      {needles().map((n, i) => (
        <line key={i} x1={n.x1} y1={n.y1} x2={n.x2} y2={n.y2} stroke={n.shade} strokeWidth="1.7" strokeLinecap="round" />
      ))}
      {DEKO.kugeln.map((k) => (
        <g key={k.x}>
          <line x1={k.x} y1={sag(k.x)} x2={k.x} y2={sag(k.x) + k.faden} stroke="#d4af6a" strokeWidth="0.9" />
          <rect x={k.x - 3} y={sag(k.x) + k.faden - 3} width="6" height="5" fill="#d4af6a" />
          <circle cx={k.x} cy={sag(k.x) + k.faden + k.groesse} r={k.groesse} fill={`url(#${k.farbe})`} />
        </g>
      ))}
      {LIGHTS.map((l) => (
        <circle key={l.x} className="fairy" cx={l.x} cy={l.y} r="3" style={{ animationDelay: `${l.delay}s` }} />
      ))}
    </svg>
  );
}
