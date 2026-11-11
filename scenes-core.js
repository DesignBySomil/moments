/* moments - tonal scene toolkit. Scenes are animated scalar fields over a
   character grid, shaded through a 10-level ramp, on saturated color fields. */
'use strict';
(function (root) {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const S = (t, n = 1, p = 0) => Math.sin(TAU * (t * n + p));
  const B = (t, n = 1, p = 0) => (1 - Math.cos(TAU * (t * n + p))) / 2;
  function hash(x, y) { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v);
  }
  function fbm(x, y, oct) {
    let a = 0.5, f = 1, s = 0;
    for (let i = 0; i < (oct || 4); i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; }
    return s;
  }
  const sdC = (X, Y, cx, cy, r) => Math.hypot(X - cx, Y - cy) - r;
  const sdE = (X, Y, cx, cy, rx, ry) => {
    const dx = (X - cx) / rx, dy = (Y - cy) / ry;
    return (Math.hypot(dx, dy) - 1) * Math.min(rx, ry);
  };
  const sdBox = (X, Y, cx, cy, hx, hy) => {
    const dx = Math.abs(X - cx) - hx, dy = Math.abs(Y - cy) - hy;
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
  };
  const sdSeg = (X, Y, ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    const t = clamp(((X - ax) * dx + (Y - ay) * dy) / L2, 0, 1);
    return Math.hypot(X - ax - dx * t, Y - ay - dy * t);
  };
  const sdVesica = (X, Y, cx, cy, r, d) => {
    const px = Math.abs(X - cx), py = Y - cy;
    const b = Math.sqrt(Math.max(r * r - d * d, 0.001));
    return ((py - b) * d > px * b) ? Math.hypot(px, py - b) : Math.hypot(px - d, py) - r;
  };
  /* Directional-light shading of an SDF. Returns 0 outside, soft ramp inside. */
  function shade(sd, X, Y, Lx, Ly, e) {
    e = e || 0.55;
    const d = sd(X, Y);
    if (d > 0.9) return 0;
    const gx = (sd(X + e, Y) - sd(X - e, Y)) / (2 * e);
    const gy = (sd(X, Y + e) - sd(X, Y - e)) / (2 * e);
    const gl = Math.hypot(gx, gy) || 1;
    const l = clamp((-gx / gl) * Lx + (-gy / gl) * Ly, -1, 1);
    return ss(0.5, -0.9, d) * clamp(0.40 + 0.62 * l, 0.10, 1);
  }
  const glow = (d, rad) => d > 0 ? Math.exp(-d / rad) : 1;
  const over = (a, b) => (typeof b === 'number' ? b : b[0]) > (typeof a === 'number' ? a : (a ? a[0] : 0)) ? b : a;

  /* Sparse drifting particle layer (depth behind the subject). */
  function drift(X, Y, t, opt) {
    const o = opt || {};
    const sc = o.scale || 0.55, th = o.thresh || 0.86, sp = o.speed || 6;
    const wx = X * sc + (o.windX || 0) * t * sp, wy = Y * sc + (o.windY || 0) * t * sp;
    const n = vnoise(wx, wy);
    if (n < th) return 0;
    const tw = 0.55 + 0.45 * S(t, o.twinkle || 2, n * 7);
    return ss(th, th + 0.09, n) * tw * (o.gain || 0.5);
  }
  /* Horizontal wave band filling lower frame; n in cell-noise units. */
  function waveField(X, Y, topY, t, opt) {
    const o = opt || {};
    if (Y < topY - 2) return 0;
    const ph = o.phase || 0;
    const edge = topY + (o.amp || 1.6) * S(t, o.rate || 1, ph + X * (o.freq || 0.05));
    if (Y < edge) return 0;
    const depth = ss(0, o.deep || 14, Y - edge);
    const tex = fbm(X * 0.14 + t * (o.drift || 2.2), Y * 0.22 - t * 0.8, 3);
    return clamp(0.22 + 0.55 * depth + 0.30 * (tex - 0.5), 0, 1) * (o.gain || 1);
  }

  /* Baked image-subject support: hex-quantized luminance grids, bilinear sampled. */
  const __bakeCache = {};
  function getBake(id) {
    const raw = globalThis['__BAKE_' + id];
    if (!raw) return null;
    if (!__bakeCache[id]) {
      const n = raw.d.length, a = new Float32Array(n);
      for (let i = 0; i < n; i++) a[i] = parseInt(raw.d[i], 16) / 15;
      __bakeCache[id] = { w: raw.w, h: raw.h, a };
    }
    return __bakeCache[id];
  }
  function sampleBake(bk, u, v) {
    u = clamp(u, 0, bk.w - 1.001); v = clamp(v, 0, bk.h - 1.001);
    const x0 = u | 0, y0 = v | 0, fx = u - x0, fy = v - y0;
    const i = y0 * bk.w + x0;
    const a = bk.a[i], b = bk.a[i + 1], c2 = bk.a[i + bk.w], d = bk.a[i + bk.w + 1];
    return (a + (b - a) * fx) + ((c2 + (d - c2) * fx) - (a + (b - a) * fx)) * fy;
  }

  const items = [];
  function add(id, bg, inks, loop, f) { items.push({ id, name: id, bg, inks, loop, f }); }
  const H = { TAU, clamp, lerp, ss, S, B, hash, vnoise, fbm, sdC, sdE, sdBox, sdSeg, sdVesica, shade, glow, over, drift, waveField, getBake, sampleBake };

  root.ASCII_SCENES = items;
  root.__addScene = add;
  root.__H = H;
})(typeof window !== 'undefined' ? window : globalThis);
