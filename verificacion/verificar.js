// Verifica el núcleo estadístico de NeuroStat.html contra SciPy/statsmodels.
// Uso: node verificacion/verificar.js   (desde la carpeta neurostat)
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'NeuroStat.html'), 'utf8');
const core = html.match(/<script id="ns-core">([\s\S]*?)<\/script>/)[1];
const m = { exports: {} }; new Function('module', core)(m); const NS = m.exports;
const ref = JSON.parse(fs.readFileSync(path.join(__dirname, 'referencia.json'), 'utf8'));
const t = NS.selfTest(ref);
console.log(`Valores comparados con SciPy ${ref.scipy}: ${t.rows.length}; error relativo máximo: ${t.maxErr.toExponential(2)}`);
const worst = t.rows.reduce((a, b) => a.err > b.err ? a : b); console.log('Peor caso:', worst.caso, worst.q, worst.ours, worst.ref);
// Potencia simulada (20 000 réplicas) frente a la teórica de statsmodels (t de Student, varianzas iguales)
const teor = [[4, 5, 10, 0.3951], [4, 5, 20, 0.6934], [1, 5, 300, 0.6864], [4, 12, 10, 0.1087], [4, 5, 4, 0.1601]];
for (const [delta, sd, n, th] of teor) {
  const r = NS.simulateTwoGroups(123, 1, { n, delta, sdC: sd, sdT: sd }, 20000); let k = 0; for (const p of r.p) if (p < 0.05) k++;
  console.log(`potencia δ=${delta} σ=${sd} n=${n}: simulada ${(k / 20000).toFixed(4)} | teórica ${th}`);
}
{ const r = NS.simulateTwoGroups(123, 2, { n: 10, delta: 0, sdC: 5, sdT: 5 }, 20000); let k = 0; for (const p of r.p) if (p < 0.05) k++; console.log('falsos positivos (δ=0, n=10):', (k / 20000).toFixed(4), '| nominal 0.05'); }
{ const r = NS.simulateNested(123, 1, { k: 4, m: 20, sdB: 4, sdW: 5, effect: 0 }, 20000); let a = 0, b = 0; for (let i = 0; i < 20000; i++) { if (r.pN[i] < .05) a++; if (r.pA[i] < .05) b++; } console.log('anidado sin efecto: ingenuo', (a / 20000).toFixed(4), '| por animal', (b / 20000).toFixed(4)); }
// El camino rápido de simulación debe coincidir con el análisis completo sobre datos explícitos
{ const G = NS.sampleNested(5, { k: 4, m: 20, muC: 20, effect: 3, sdB: 4, sdW: 5 }), A = NS.analyzeNested(G);
  console.log('muestra anidada semilla 5 -> p ingenuo', A.naive.p, 'p animal', A.animal.p, 'gl', A.naive.df, A.animal.df);
  fs.writeFileSync(path.join(__dirname, 'muestra_anidada.json'), JSON.stringify(G.map(g => g.map(a => a.values)))); }
if (t.maxErr > 1e-8) process.exit(1);
