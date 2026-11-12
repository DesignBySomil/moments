/* Batch 2: candle, campfire, moonsea, meteors, dandelion, leaves */
'use strict';
(function (root) {
  const H = root.__H, add = root.__addScene;
  const { TAU, clamp, lerp, ss, S, B, vnoise, fbm, sdC, sdE, sdBox, sdSeg, sdVesica, shade, glow, over, drift, waveField, hash, getBake, sampleBake } = H;
  const flame = (px, py, fx, fy, w, hgt, t, seed) => {
    const wob = S(t, 3, seed) * w * 0.22 + (vnoise(t * 9 + seed, seed * 3) - 0.5) * w * 0.3;
    const bul = sdE(px, py, fx + wob * 0.3, fy - hgt * 0.22, w * (0.62 + 0.10 * S(t, 4, seed)), hgt * 0.30);
    const tip = sdE(px, py, fx + wob, fy - hgt * 0.62, w * 0.34, hgt * 0.42);
    return Math.min(bul, tip);
  };

  add('candle', '#160d08', ['#ffc46b', '#9a7852'], 10, (x, y, t, cols, rows) => {
    const bk = getBake('candle');
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const amb = () => { const a = drift(X, Y, t, { gain: 0.10, thresh: 0.95, speed: 1.6 }); return a ? [a, 0, 0.5] : 0; };
    if (!bk) return amb();
    // flame flicker: lateral wobble weighted to the flame (upper bake), brightness breathing
    const wob = S(t, 3) * 0.008 + (vnoise(t * 7, 3.1) - 0.5) * 0.012;
    const flick = 0.90 + 0.10 * S(t, 5) + 0.06 * (vnoise(t * 11, 7.7) - 0.5);
    const fw = u * 0.34, fh = u * 0.46, cyc = u * 0.50;
    const dx = X, dy = Y - cyc;
    if (Math.abs(dx) > fw || Math.abs(dy) > fh) return amb();
    let sx = dx / (fw * 2) + 0.5 + wob * (1 - 2 * (dy / (fh * 2) + 0.5)) * -2.0;
    const sy = dy / (fh * 2) + 0.5;
    if (sx < 0 || sx > 1) return amb();
    const v0 = sampleBake(bk, sx * (bk.w - 1), sy * (bk.h - 1));
    const flame = sy < 0.52;
    const v = clamp(v0 * (flame ? 1.35 * flick : 1.55 + 0.06 * S(t, 2)), 0, 1);
    if (v <= 0.02) return amb();
    return [v, flame ? 0 : 1];
  });


  add('campfire', '#120b06', ['#ffb04a', '#c9b8a8'], 9, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const base = u * 0.72;
    // faint warm glow hugging the fire base
    if (Y > base - u * 0.02 && Math.abs(X) < u * 0.16) {
      const gl = glow(sdE(X, Y, 0, base + u * 0.020, u * 0.13, u * 0.026), u * 0.022) * 0.16;
      if (gl > 0.05) res = [gl, 0];
    }
    // ember bed: hot mottled ellipse under the logs
    const dEmb = sdE(X, Y, 0, base + u * 0.006, u * 0.075, u * 0.015);
    if (dEmb < 0) {
      const v = (0.60 + 0.55 * fbm(X * 2.4, Y * 2.4 - t * 1.5, 2)) * (0.7 + 0.3 * S(t, 3.1));
      res = over(res, [clamp(v, 0, 1), 0]);
    }
    // crossed logs: shaded capsules, lit from above by the fire, direct priority over embers
    const logs = [
      [-u * 0.105, base + u * 0.012, u * 0.068, base - u * 0.028],
      [u * 0.105, base + u * 0.012, -u * 0.068, base - u * 0.028],
      [-u * 0.088, base + u * 0.024, u * 0.088, base + u * 0.020]];
    for (let k = 0; k < 3; k++) {
      const [ax, ay, bx2, by2] = logs[k];
      const r = u * 0.023;
      const dL = sdSeg(X, Y, ax, ay, bx2, by2) - r;
      if (dL < 0.6) {
        const m = ss(0.6, -0.5, dL);
        if (m > 0) {
          const L2 = ((bx2 - ax) * X + (by2 - ay) * Y - ((bx2 - ax) * ax + (by2 - ay) * ay));
          const len2 = (bx2 - ax) * (bx2 - ax) + (by2 - ay) * (by2 - ay);
          const s = clamp(L2 / len2, 0, 1);
          const axisY = ay + (by2 - ay) * s;
          const top = ss(r * 1.1, -r * 0.9, Y - axisY);
          const bark = 0.86 + 0.14 * Math.sin(s * 21 + k * 2.4);
          const v = (0.16 + 0.82 * top) * bark * m * (k === 2 ? 0.9 : 1);
          res = [clamp(v, 0, 1), 1];
        }
      }
    }
    // flame: 3 nested teardrop layers, independent sway, hot core
    const layers = [
      [u * 0.170, u * 0.50, 0.42, 2.1],
      [u * 0.120, u * 0.40, 0.68, 4.7],
      [u * 0.065, u * 0.27, 1.00, 8.3]];
    if (Y < base + 2 && Y > base - u * 0.55 && Math.abs(X) < u * 0.38) {
      for (let i = 0; i < 3; i++) {
        const [w, h, bright, ph] = layers[i];
        const ty = (base - Y) / h;
        if (ty <= 0 || ty >= 1) continue;
        const sway = S(t, 2.6 + i * 0.7, ph) * (0.10 + ty * 0.38) * w + S(t, 6 + i, ph * 1.7) * ty * w * 0.22;
        const wshape = w * Math.sin(Math.PI * Math.pow(ty, 0.72));
        const d = Math.abs(X - sway) / Math.max(wshape, 0.001);
        const v = (1 - d * d) * bright * (0.86 + 0.14 * S(t, 5.2, ph));
        if (v > 0.10) res = over(res, [clamp(v, 0, 1), 0]);
      }
      for (let k = 0; k < 2; k++) {
        const dir = k === 0 ? -1 : 1;
        const ty = (base - Y) / (u * 0.24);
        if (ty <= 0 || ty >= 1) continue;
        const sway = S(t, 3.4, k * 5.1) * ty * u * 0.03;
        const cx = dir * u * 0.125 + sway;
        const wshape = u * 0.032 * Math.sin(Math.PI * ty);
        const d = Math.abs(X - cx) / Math.max(wshape, 0.001);
        const v = (1 - d * d) * 0.3 * (0.7 + 0.3 * S(t, 4.4, k * 3.3));
        if (v > 0.12) res = over(res, [clamp(v, 0, 1), 0]);
      }
    }
    // rising sparks
    for (let k = 0; k < 6; k++) {
      const p = (t * 0.9 + hash(k, 1)) % 1;
      const ex = (hash(k, 2) - 0.5) * u * 0.2 + S(t, 2, hash(k, 3)) * u * 0.05;
      const ey = u * 0.50 - p * u * 0.38;
      const d = sdC(X, Y, ex, ey, u * 0.004);
      if (d < 1.2) { const v = glow(d, 0.8) * (1 - p) * 0.9; if (v > 0.06) res = over(res, [v, 0]); }
    }
    return res;
  });

  add('moonsea', '#0b1233', ['#e8ecff', '#5f74c9'], 16, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const horizon = u * 0.62;
    const st = drift(X, Y, t, { scale: 0.5, thresh: 0.92, gain: 0.4, speed: 0.5, twinkle: 3 });
    if (st > 0 && Y < horizon) res = [st, 0];
    // crisp full moon: maria blotches, slight limb lift, tight halo
    const cx = 0, cy = u * 0.30, R = u * 0.205;
    const dM = sdC(X, Y, cx, cy, R);
    if (dM < 1.2) {
      let v;
      if (dM <= 0) {
        const maria = ss(0.52, 0.74, fbm(X * 0.09 + 7.3, Y * 0.09 + 2.1, 3)) * 0.40;
        v = clamp(0.86 - maria + 0.10 * ss(0, 0.4, -dM / R), 0, 1);
      } else {
        v = glow(dM, u * 0.006) * 0.5;
      }
      if (v > 0.05) res = over(res, [clamp(v, 0, 1), 0]);
    }
    // horizon line
    const dh = Math.abs(Y - horizon);
    if (dh < 1.0) res = over(res, [0.35 * (1 - dh), 1]);
    // sea: dark field with a shimmering moon reflection column
    if (Y > horizon) {
      const depth = clamp((Y - horizon) / (u - horizon), 0, 1);
      const spread = u * (0.018 + depth * 0.085);
      const colm = Math.exp(-(X * X) / (2 * spread * spread));
      const streak = ss(0.35, 0.75, vnoise(X * 1.6, Y * 0.30 - t * 1.8));
      const v = colm * (0.25 + 0.75 * streak) * (1 - depth * 0.5) * 0.75;
      if (v > 0.05) res = over(res, [clamp(v, 0, 1), 1]);
    }
    return res;
  });

  add('meteors', '#0c0e1a', ['#f5f1e8', '#7c86b8'], 12, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const ridgeY = u * 0.78 + fbm(X * 0.08, 4.4, 3) * u * 0.09;
    if (Y > ridgeY) res = [0.30 + 0.15 * fbm(X * 0.4, Y * 0.4, 2), 1];
    const st = drift(X, Y, t, { scale: 0.55, thresh: 0.87, gain: 0.5, speed: 0.4, twinkle: 3 });
    if (Y < ridgeY && st > 0) res = over(res, [st, 1]);
    for (let k = 0; k < 4; k++) {
      const p = (t + k / 4) % 1;
      if (p > 0.55) continue;
      const hx = -cols * 0.45 / 1.06 + hash(k, 7) * cols * 0.5 + p * u * 0.9;
      const hy = u * (0.08 + hash(k, 5) * 0.25) + p * u * 0.55;
      const dx = 0.86, dy = 0.5;
      const fade = ss(0, 0.06, p) * (1 - ss(0.38, 0.55, p));
      const dHead = sdC(X, Y, hx, hy, u * 0.013);
      const rel = (X - hx) * -dx + (Y - hy) * -dy;
      if (rel > 0 && rel < u * 0.26) {
        const perp = Math.abs((X - hx) * dy - (Y - hy) * dx);
        const taper = 1 - rel / (u * 0.26);
        const v = glow(perp, u * 0.006 * taper + 0.35) * taper * 1.1 * fade;
        if (v > 0.05) res = over(res, [clamp(v, 0, 1), 0]);
      }
      if (dHead < 2.2) { const v = glow(dHead, 1.6) * fade; if (v > 0.05) res = over(res, [clamp(v * 1.25, 0, 1), 0]); }
    }
    return res;
  });

  add('dandelion', '#101a12', ['#eef5e6', '#8fbf8a'], 14, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const sway = S(t, 0.7) * u * 0.012;
    const cx = sway, cy = u * 0.38, R = u * 0.175;
    // stem: two-segment curve from the ground to the puff base
    const sx0 = u * 0.035, sy0 = u * 0.99, sx1 = u * 0.014, sy1 = u * 0.72;
    const dStem = Math.min(sdSeg(X, Y, sx0, sy0, sx1, sy1), sdSeg(X, Y, sx1, sy1, cx, cy + R * 0.95));
    if (dStem < 1.4) { const v = glow(dStem, u * 0.004) * 0.6; if (v > 0.05) res = over(res, [clamp(v, 0, 1), 1]); }
    // small leaf on the lower stem
    {
      const la = -0.65, ca = Math.cos(la), sa = Math.sin(la);
      const LX = X - u * 0.015, LY = Y - u * 0.86;
      const RX = LX * ca + LY * sa, RY = -LX * sa + LY * ca;
      const dLeaf = sdVesica(RX, RY, 0, 0, u * 0.052, u * 0.030);
      if (dLeaf < 1.2) { const v = glow(dLeaf, u * 0.004) * 0.45; if (v > 0.05) res = over(res, [clamp(v, 0, 1), 1]); }
    }
    // seed clock: radiating spokes with pappus stars at the tips, dark gaps between
    if (sdC(X, Y, cx, cy, R * 1.30) < 2.2) {
      const N = 52;
      for (let k = 0; k < N; k++) {
        const a = TAU * k / N + (hash(k, 3) - 0.5) * 0.09;
        const dx = Math.cos(a), dy = Math.sin(a);
        const L = R * (0.86 + 0.18 * hash(k, 5));
        const ix = cx + dx * R * 0.16, iy = cy + dy * R * 0.16;
        const ex = cx + dx * L, ey = cy + dy * L;
        const face = clamp(dx * -0.55 + dy * -0.84, 0, 1);
        const tw = 0.85 + 0.15 * S(t, 1.4, hash(k, 9));
        const d = sdSeg(X, Y, ix, iy, ex, ey);
        if (d < 1.6) {
          const v = glow(d, u * 0.0030) * (0.30 + 0.70 * face) * tw;
          if (v > 0.06) res = over(res, [clamp(v, 0, 1), 0]);
        }
        if (sdC(X, Y, ex, ey, u * 0.012) < 1.5) {
          const hl = u * 0.010, a1 = a + Math.PI / 4, a2 = a - Math.PI / 4;
          const d1 = sdSeg(X, Y, ex - Math.cos(a1) * hl, ey - Math.sin(a1) * hl, ex + Math.cos(a1) * hl, ey + Math.sin(a1) * hl);
          const d2 = sdSeg(X, Y, ex - Math.cos(a2) * hl, ey - Math.sin(a2) * hl, ex + Math.cos(a2) * hl, ey + Math.sin(a2) * hl);
          const v = glow(Math.min(d1, d2), u * 0.0030) * (0.45 + 0.55 * face) * tw;
          if (v > 0.06) res = over(res, [clamp(v, 0, 1), 0]);
        }
      }
    }
    // seeds drifting off the clock
    for (let k = 0; k < 10; k++) {
      const p = (t * 0.08 + hash(k, 11)) % 1;
      const a0 = hash(k, 15) * TAU;
      const sx2 = cx + Math.cos(a0) * R * 0.8 + p * u * (0.28 + hash(k, 16) * 0.25) + S(t, 1.2, hash(k, 13)) * u * 0.04;
      const sy2 = cy + Math.sin(a0) * R * 0.55 - p * u * (0.20 + hash(k, 17) * 0.30);
      const d = sdC(X, Y, sx2, sy2, u * 0.003);
      if (d < 1.5) { const v = glow(d, 1.0) * (1 - p) * 0.9; if (v > 0.05) res = over(res, [clamp(v, 0, 1), 0]); }
    }
    return res;
  });

  add('leaves', '#1a1208', ['#e8b34a', '#a8763a'], 14, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const half = cols / 2.12;
    for (let k = 0; k < 5; k++) {
      const p = (t * 0.8 + k / 5) % 1;
      const lx = (hash(k, 11) - 0.5) * 2 * half * 0.8 + S(t, 1, k * 0.7) * u * 0.06;
      const ly = -u * 0.15 + p * (u * 1.3);
      const rot = S(t, 2, k * 0.31) * 0.9 + k;
      if (Math.abs(X - lx) > u * 0.16 || Math.abs(Y - ly) > u * 0.16) continue;
      const ca = Math.cos(rot), sa = Math.sin(rot);
      const RX = (X - lx) * ca + (Y - ly) * sa, RY = -(X - lx) * sa + (Y - ly) * ca;
      const L = u * 0.095;
      const sdLeaf = (px, py) => Math.min(sdVesica(px, py, 0, 0, L * 1.5, L * 1.05), Math.abs(sdSeg(px, py, 0, -L * 0.8, 0, L * 0.8)) - u * 0.004);
      const sh = shade(sdLeaf, RX, RY, -0.5, -0.8);
      if (sh > 0) res = over(res, [sh, k % 2, 1 - ss(0.85, 1, p)]);
    }
    const g = drift(X, Y, t, { gain: 0.12, thresh: 0.92, speed: 2 });
    if (g > 0) res = over(res, [g, 1]);
    return res;
  });
})(typeof window !== 'undefined' ? window : globalThis);
