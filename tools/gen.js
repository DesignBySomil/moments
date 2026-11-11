// usage: node gen.js <sceneId|all> <t> <cols> <rows> <outPrefix> [t2 t3...]
const fs = require('fs');
require('/tmp/moments/scenes-core.js');
fs.readdirSync('/tmp/moments').filter(f => /^scenes-.*\.js$/.test(f)).sort()
  .forEach(f => require('/tmp/moments/' + f));
const RAMP = ' .:-=+*x#%@';
const [id, colsS, rowsS, outPrefix, ...ts] = process.argv.slice(2);
const cols = +colsS, rows = +rowsS;
const scenes = id === 'all' ? globalThis.ASCII_SCENES : globalThis.ASCII_SCENES.filter(s => s.id === id);
if (!scenes.length) { console.error('no scene', id); process.exit(1); }
for (const s of scenes) {
  for (const tS of ts) {
    const t = parseFloat(tS);
    const cells = [];
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) {
        const v = s.f(x, y, t, cols, rows);
        let i = 0, ink = 0, a = 1;
        if (typeof v === 'number') i = v; else if (v) { i = v[0]; ink = v[1] || 0; a = v[2] == null ? 1 : v[2]; }
        let lvl = 0;
        if (i > 0.045) { lvl = Math.min(RAMP.length - 1, Math.max(1, (i * (RAMP.length - 1) + 0.5) | 0)); }
        row.push([lvl, ink, Math.round(a * 100) / 100]);
      }
      cells.push(row);
    }
    const out = `${outPrefix}-${s.id}-t${tS}.json`;
    fs.writeFileSync(out, JSON.stringify({ bg: s.bg, inks: s.inks, ramp: RAMP, cells }));
  }
}
console.log('wrote', scenes.length, 'scenes x', ts.length, 'frames');
