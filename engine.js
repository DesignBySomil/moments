/* moments - shared render engine.
   Three post-process styles over a low-res scene buffer:
     dots  - halftone dot matrix with glow (ref: dot flowers)
     grain - smooth scene + film grain + vignette (ref: lone walker)
     pixel - hard-upscaled pixel art + scanlines (ref: retro monitor)
*/
'use strict';

const Engine = (() => {
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const buf = document.createElement('canvas');
  const bctx = buf.getContext('2d', { willReadFrequently: true });

  let W = 0, H = 0, BW = 0, BH = 0, DPR = 1;
  let style = 'grain';
  let dotPitch = 4;          // css px per dot cell (dots style)
  let pixelW = 200;          // buffer width (pixel style)
  let grainScale = 0.5;      // buffer scale (grain style)

  // ---- deterministic rng ----
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- grain tiles ----
  const grainTiles = [];
  (function makeGrain() {
    for (let k = 0; k < 4; k++) {
      const g = document.createElement('canvas');
      g.width = 192; g.height = 192;
      const gc = g.getContext('2d');
      const img = gc.createImageData(192, 192);
      const rnd = mulberry32(1234 + k * 77);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 118 + rnd() * 96 | 0;
        img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      gc.putImageData(img, 0, 0);
      grainTiles.push(g);
    }
  })();

  // per-cell jitter for dots style
  let jitterX = null, jitterY = null, jitterSeed = 7;
  function buildJitter() {
    const rnd = mulberry32(jitterSeed);
    jitterX = new Float32Array(BW * BH);
    jitterY = new Float32Array(BW * BH);
    for (let i = 0; i < BW * BH; i++) {
      jitterX[i] = (rnd() - 0.5) * 0.5;
      jitterY[i] = (rnd() - 0.5) * 0.5;
    }
  }

  let vignette = null;
  function buildVignette(strength) {
    vignette = ctx.createRadialGradient(
      W * 0.5, H * 0.46, Math.min(W, H) * 0.34,
      W * 0.5, H * 0.5, Math.max(W, H) * 0.78);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,' + strength + ')');
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.75);
    W = Math.round(window.innerWidth * DPR);
    H = Math.round(window.innerHeight * DPR);
    canvas.width = W; canvas.height = H;
    // ASCII glyph grid: one character per cell
    const cellW = 7, cellH = 12;
    BW = Math.max(24, Math.round(window.innerWidth / cellW));
    BH = Math.max(24, Math.round(window.innerHeight / cellH));
    buf.width = BW; buf.height = BH;
    buildVignette(0.35);
  }

  window.addEventListener('resize', resize);

  // ---- post passes ----
  const colorCache = new Map();
  function dotColor(r, g, b) {
    const key = (r >> 3 << 10) | (g >> 3 << 5) | (b >> 3);
    let c = colorCache.get(key);
    if (!c) { c = 'rgb(' + r + ',' + g + ',' + b + ')'; colorCache.set(key, c); }
    return c;
  }

  // ---- ASCII glyph pass ----
  // luminance ramp, light to dense
  const RAMP = ' .\u00b7:-~=+*x#%@';
  function passASCII(time) {
    const img = bctx.getImageData(0, 0, BW, BH).data;
    const cw = W / BW, ch = H / BH;
    ctx.save();
    ctx.font = '600 ' + Math.round(ch * 1.05) + 'px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const rl = RAMP.length - 1;
    for (let y = 0; y < BH; y++) {
      const row = y * BW;
      const py = (y + 0.52) * ch;
      for (let x = 0; x < BW; x++) {
        const i = (row + x) * 4;
        const r = img[i], g = img[i + 1], b = img[i + 2];
        const lum = (r * 77 + g * 150 + b * 29) >> 8;
        if (lum < 30) continue;
        const gi = Math.min(rl, ((lum - 30) / 225 * rl + 0.5) | 0);
        const glyph = RAMP[gi];
        if (glyph === ' ') continue;
        // brighten: glyph strokes are thinner than filled dots
        const br = Math.min(255, r * 1.35 + 18) | 0;
        const bg2 = Math.min(255, g * 1.35 + 18) | 0;
        const bb = Math.min(255, b * 1.35 + 18) | 0;
        ctx.fillStyle = dotColor(br, bg2, bb);
        ctx.fillText(glyph, (x + 0.5) * cw, py);
      }
    }
    ctx.restore();
  }

  function passDots(time) {
    const img = bctx.getImageData(0, 0, BW, BH).data;
    const sx = W / BW, sy = H / BH;
    // glow underlay
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5;
    ctx.filter = 'blur(' + Math.round(sx * 1.4) + 'px)';
    ctx.drawImage(buf, 0, 0, W, H);
    ctx.restore();
    ctx.filter = 'none';
    const maxR = Math.min(sx, sy) * 0.46;
    const breathe = Math.sin(time * 0.7) * 0.35;
    ctx.save();
    for (let y = 0; y < BH; y++) {
      const row = y * BW;
      const py = (y + 0.5) * sy;
      for (let x = 0; x < BW; x++) {
        const i = (row + x) * 4;
        const r = img[i], g = img[i + 1], b = img[i + 2];
        const lum = (r * 77 + g * 150 + b * 29) >> 8;
        if (lum < 16) continue;
        const f = lum / 255;
        const rad = maxR * Math.pow(f, 0.82);
        if (rad < 0.4) continue;
        const j = row + x;
        const dx = (x + 0.5) * sx + (jitterX[j] * 0.9 + Math.sin(time * 0.5 + j * 0.13) * 0.22 + breathe * 0.1) * sx * 0.22;
        const dy = py + (jitterY[j] * 0.9 + Math.cos(time * 0.45 + j * 0.11) * 0.22) * sy * 0.22;
        ctx.fillStyle = dotColor(r, g, b);
        if (rad < 1.3 * DPR) {
          ctx.fillRect(dx - rad, dy - rad, rad * 2, rad * 2);
        } else {
          ctx.beginPath();
          ctx.arc(dx, dy, rad, 0, 6.28318);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  function passGrain(time) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // subtle exposure flicker
    ctx.globalAlpha = 0.97 + Math.sin(time * 13.7) * 0.015 + Math.sin(time * 7.3) * 0.015;
    ctx.drawImage(buf, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  function passPixel() {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buf, 0, 0, W, H);
    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    const gap = Math.max(3, Math.round(3 * DPR));
    for (let y = 0; y < H; y += gap) ctx.fillRect(0, y, W, Math.max(1, DPR * 0.7));
    ctx.imageSmoothingEnabled = true;
  }

  function grainAndVignette(time, amt) {
    const t1 = grainTiles[(time * 11 | 0) & 3];
    const t2 = grainTiles[(time * 17 | 0) + 1 & 3];
    const ox1 = ((time * 61) % 192) | 0, oy1 = ((time * 43) % 192) | 0;
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = amt;
    const s = DPR;
    for (let y = -oy1 * s; y < H; y += 192 * s)
      for (let x = -ox1 * s; x < W; x += 192 * s)
        ctx.drawImage(t1, x, y, 192 * s, 192 * s);
    ctx.globalAlpha = amt * 0.5;
    for (let y = -(192 - oy1) * s; y < H; y += 192 * s)
      for (let x = -(192 - ox1) * s; x < W; x += 192 * s)
        ctx.drawImage(t2, x, y, 192 * s, 192 * s);
    ctx.restore();
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  let currentScene = null;
  let fade = 1; // 1 = fully visible; used for transitions

  function setScene(scene) {
    currentScene = scene;
    style = scene.style || 'grain';
    resize();
  }

  function render(time, sceneAlpha) {
    if (!currentScene) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, W, H);

    const t01 = ((time % currentScene.loop) + currentScene.loop) % currentScene.loop / currentScene.loop;
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.globalAlpha = 1;
    bctx.globalCompositeOperation = 'source-over';
    bctx.fillStyle = '#000';
    bctx.fillRect(0, 0, BW, BH);
    currentScene.draw(bctx, BW, BH, t01, time);

    passASCII(time);

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    if (sceneAlpha < 1) {
      ctx.fillStyle = 'rgba(5,5,7,' + (1 - sceneAlpha) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ---- drawing helpers available to scenes ----
  const H2 = {
    mulberry32,
    clamp: (v, a, b) => v < a ? a : v > b ? b : v,
    lerp: (a, b, t) => a + (b - a) * t,
    ease: {
      inOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
      out: t => 1 - Math.pow(1 - t, 3),
      outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
      outElastic: t => t === 0 ? 0 : t === 1 ? 1 :
        Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
      in: t => t * t * t,
      sine: t => Math.sin(t * Math.PI),
    },
    // value noise 1D
    noise1: (() => {
      const rnd = mulberry32(999);
      const P = new Float32Array(256);
      for (let i = 0; i < 256; i++) P[i] = rnd();
      return x => {
        const xi = Math.floor(x), xf = x - xi;
        const a = P[xi & 255], b = P[(xi + 1) & 255];
        const u = xf * xf * (3 - 2 * xf);
        return a + (b - a) * u;
      };
    })(),
    star(c, x, y, r, color, alpha) {
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.beginPath(); c.arc(x, y, r, 0, 6.28318); c.fill();
      c.globalAlpha = 1;
    },
    starfield(c, w, h, n, seed, yMax, tw, time) {
      const rnd = mulberry32(seed);
      for (let i = 0; i < n; i++) {
        const x = rnd() * w, y = rnd() * h * (yMax || 0.7);
        const r = 0.4 + rnd() * rnd() * 1.6;
        const a = 0.25 + rnd() * 0.55 + (tw ? Math.sin(time * (1 + rnd() * 2) + rnd() * 9) * 0.2 : 0);
        this.star(c, x, y, r, '#dfe6ff', Math.max(0.05, Math.min(0.9, a)));
      }
    },
    glowCircle(c, x, y, r, inner, outer) {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, inner);
      g.addColorStop(1, outer);
      c.fillStyle = g;
      c.beginPath(); c.arc(x, y, r, 0, 6.28318); c.fill();
    },
  };

  return { setScene, render, resize, H: H2, get scene() { return currentScene; } };
})();
