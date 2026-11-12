// Dump scene frames as JSON grids for offline rendering.
// usage: node dump.js <sceneId|all> <t0..tN comma phases> <cols> <rows>
'use strict';
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..');
const files = [
  'scenes-core.js',
  'scenes-bake-balloon.js','scenes-bake-bloom.js','scenes-bake-butterfly.js',
  'scenes-bake-candle.js','scenes-bake-cycle.js','scenes-bake-jellyfish.js',
  'scenes-bake-lantern2.js','scenes-bake-leaves.js','scenes-bake-lighthouse.js',
  'scenes-bake-pendulum.js','scenes-bake-swing.js','scenes-bake-train.js',
  'scenes-bake-wave.js','scenes-bake-windmill.js',
  'scenes-1.js','scenes-2.js','scenes-3.js','scenes-4.js','scenes-5.js'
];
for (const f of files) eval(fs.readFileSync(path.join(dir, f), 'utf8'));
const scenes = globalThis.ASCII_SCENES;
const [,, sceneId='all', phases='0.35', colsS='68', rowsS='139'] = process.argv;
const cols = +colsS, rows = +rowsS;
const list = sceneId === 'all' ? scenes : scenes.filter(s => s.id === sceneId);
const RAMP = ' .:-=+*x#%@';
const out = [];
for (const sc of list) {
  for (const ph of phases.split(',').map(Number)) {
    const t = ((ph % 1) + 1) % 1;
    const cells = [];
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        const v = sc.f(x, y, t, cols, rows);
        if (!v) { row.push(0); continue; }
        let i, ink = 0, a = 1;
        if (typeof v === 'number') i = v; else { i = v[0]; ink = v[1] || 0; a = v[2] == null ? 1 : v[2]; }
        if (i <= 0.045) { row.push(0); continue; }
        let lvl = (i * (RAMP.length - 1) + 0.5) | 0;
        if (lvl < 1) lvl = 1; if (lvl >= RAMP.length) lvl = RAMP.length - 1;
        row.push([lvl, ink, Math.round(a * 100) / 100, Math.round(i * 100) / 100]);
      }
      cells.push(row);
    }
    out.push({ id: sc.id, name: sc.name, bg: sc.bg, inks: sc.inks, loop: sc.loop, bloom: !!sc.bloom, phase: ph, cols, rows, cells });
  }
}
fs.writeFileSync(process.argv[6] || '/tmp/frames.json', JSON.stringify(out));
console.log('wrote', out.length, 'frames for', list.map(s=>s.id).join(','));
