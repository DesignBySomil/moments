/* Dense tonal character renderer. Every mark is a literal ASCII glyph drawn
   from a prerendered atlas; scenes are animated tonal fields. */
'use strict';
const Engine = (() => {
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const RAMP = ' .:-=+*x#%@';
  let scene = null, W = 0, H = 0, dpr = 1, cols = 0, rows = 0, cw = 0, ch = 0;
  let atlas = null, lastFrame = 0, atlasPad = 0, bloomScene = false, whiteInk = 0;

  function buildAtlas() {
    bloomScene = !!scene.bloom;
    const pad = bloomScene ? Math.ceil(ch * dpr * 1.4) : 0;
    atlasPad = pad;
    const inkList = bloomScene ? scene.inks.concat(['#ffffff']) : scene.inks;
    whiteInk = inkList.length - 1;
    atlas = inkList.map(color => RAMP.split('').map((c, li) => {
      const scale = bloomScene ? 0.70 + 0.06 * li : 1;
      const fs = ch * 0.98 * dpr * scale;
      const cv = document.createElement('canvas');
      cv.width = Math.max(2, Math.ceil(cw * dpr) + pad * 2);
      cv.height = Math.max(2, Math.ceil(ch * dpr) + pad * 2);
      const c2 = cv.getContext('2d');
      c2.font = '700 ' + fs + 'px "Courier New", monospace';
      c2.textAlign = 'center'; c2.textBaseline = 'middle';
      c2.fillStyle = color;
      if (bloomScene && li >= 5) { c2.shadowColor = color; c2.shadowBlur = (li - 4) * 2.0 * dpr; }
      c2.fillText(c, cv.width / 2, cv.height / 2 + fs * 0.02);
      if (bloomScene && li >= 8) { c2.shadowBlur = 0; c2.fillText(c, cv.width / 2, cv.height / 2 + fs * 0.02); }
      return cv;
    }));
  }

  function resize() {
    W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.5);
    cols = Math.max(68, Math.min(178, Math.round(W / 8.2)));
    cw = W / cols; ch = cw * 1.06; rows = Math.ceil(H / ch); ch = H / rows;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    if (scene) buildAtlas();
  }
  addEventListener('resize', resize);

  function render(time, alpha = 1, force = false) {
    if (!scene) return;
    if (!force && time - lastFrame < 1 / 32) return; // ~30fps cap, plenty for tonal motion
    lastFrame = time;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = scene.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const t = ((time % scene.loop) + scene.loop) % scene.loop / scene.loop;
    const pw = cw * dpr, ph = ch * dpr;
    ctx.globalAlpha = alpha;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = scene.f(x, y, t, cols, rows);
        if (!v) continue;
        let i, ink = 0, a = 1;
        if (typeof v === 'number') i = v; else { i = v[0]; ink = v[1] || 0; a = v[2] == null ? 1 : v[2]; }
        if (i <= 0.045) continue;
        let wl = 0;
        if (bloomScene && i > 1) { wl = i - 1; if (wl > 1) wl = 1; i = 1; }
        let lvl = (i * (RAMP.length - 1) + 0.5) | 0;
        if (lvl < 1) lvl = 1; if (lvl >= RAMP.length) lvl = RAMP.length - 1;
        if (a !== 1) ctx.globalAlpha = alpha * a;
        const dx = ((x * cw * dpr) | 0) - atlasPad, dy = ((y * ch * dpr) | 0) - atlasPad;
        const dw = pw + atlasPad * 2, dh = ph + atlasPad * 2;
        ctx.drawImage(atlas[ink][lvl], dx, dy, dw, dh);
        if (wl > 0) { ctx.globalAlpha = alpha * a * wl; ctx.drawImage(atlas[whiteInk][lvl], dx, dy, dw, dh); }
        if (a !== 1 || wl > 0) ctx.globalAlpha = alpha;
      }
    }
    ctx.globalAlpha = 1;
  }

  resize();
  return {
    render, resize,
    setScene(s) { scene = s; if (s) buildAtlas(); },
    get scene() { return scene; },
    get RAMP() { return RAMP; }
  };
})();
