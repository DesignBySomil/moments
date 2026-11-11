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
    const v = clamp(v0 * (flame ? flick : 0.95 + 0.05 * S(t, 2)), 0, 1);
    if (v <= 0.02) return amb();
    return [v, flame ? 0 : 1];
  });


  add('campfire', '#120b06', ['#ffb04a', '#c9b8a8'], 9, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const g = glow(sdC(X, Y, 0, u * 0.55, 0), u * 0.38) * 0.5;
    let res = g > 0.04 ? [g, 0] : 0;
    if (Y > u * 0.30 && Y < u * 0.85 && Math.abs(X) < u * 0.34) {
      const sdLogs = (px, py) => Math.min(
        sdSeg(px, py, -u * 0.16, u * 0.72, u * 0.16, u * 0.62) - u * 0.028,
        sdSeg(px, py, -u * 0.15, u * 0.61, u * 0.17, u * 0.71) - u * 0.028);
      const sh = shade(sdLogs, X, Y, -0.4, -0.85);
      if (sh > 0) res = over(res, [sh * 0.9, 1]);
      for (let L = 0; L < 3; L++) {
        const w = u * (0.16 - L * 0.045), hgt = u * (0.30 - L * 0.07);
        const df = flame(X, Y, 0, u * 0.62, w, hgt, t, L * 1.7);
        const v = ss(0.4, -1.4, df) * (0.55 + L * 0.24);
        if (v > 0.03) res = over(res, [clamp(v, 0, 1), 0]);
      }
    }
    for (let k = 0; k < 10; k++) {
      const p = (t * 0.9 + hash(k, 1)) % 1;
      const ex = (hash(k, 2) - 0.5) * u * 0.2 + S(t, 2, hash(k, 3)) * u * 0.05;
      const ey = u * 0.52 - p * u * 0.38;
      const d = sdC(X, Y, ex, ey, u * 0.004);
      if (d < 1.2) { const v = glow(d, 0.8) * (1 - p) * 0.9; if (v > 0.06) res = over(res, [v, 0]); }
    }
    return res;
  });

  add('moonsea', '#0b1233', ['#e8ecff', '#5f74c9'], 16, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const mx = cols * 0.12 / 1.06, my = u * 0.22, mr = u * 0.15;
    let res = 0;
    const st = drift(X, Y, t, { scale: 0.5, thresh: 0.88, gain: 0.45, speed: 0.5, twinkle: 3 });
    if (Y < u * 0.55 && st > 0) res = [st, 0];
    const md = sdC(X, Y, mx, my, mr);
    if (md < 1) {
      const cr = fbm(X * 0.35 + 9, Y * 0.35 + 9, 3);
      const v = shade((a, b) => sdC(a, b, mx, my, mr), X, Y, -0.65, -0.55);
      if (v > 0) res = over(res, [clamp(v * (0.95 + 0.5 * (cr - 0.5)), 0.05, 1), 0]);
    } else {
      const g = glow(md, u * 0.05) * 0.30;
      if (g > 0.05) res = over(res, [g, 0, 0.8]);
    }
    const seaTop = u * 0.58;
    if (Y > seaTop - 2) {
      const edge = seaTop + u * 0.008 * S(t, 1, X * 0.05);
      if (Y > edge) {
        const depth = ss(0, u * 0.18, Y - edge);
        const tex = fbm(X * 0.18 + t * 2.0, Y * 0.30 - t, 3);
        let v = clamp(0.10 + 0.55 * depth + 0.26 * (tex - 0.5), 0, 1);
        const colW = u * 0.035 * (1 + depth * 2.2);
        const shim = vnoise(X * 1.4, Y * 0.35 - t * 4);
        if (Math.abs(X - mx) < colW && shim > 0.35) v = Math.max(v, 0.55 + 0.4 * ss(0.35, 0.8, shim) * (1 - depth * 0.5));
        res = over(res, [v, 1]);
      }
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
    for (let k = 0; k < 3; k++) {
      const p = (t + k / 3) % 1;
      if (p > 0.55) continue;
      const hx = -cols * 0.45 / 1.06 + hash(k, 7) * cols * 0.5 + p * u * 0.9;
      const hy = u * (0.08 + hash(k, 5) * 0.25) + p * u * 0.55;
      const dx = 0.86, dy = 0.5;
      const dHead = sdC(X, Y, hx, hy, u * 0.008);
      const rel = (X - hx) * -dx + (Y - hy) * -dy;
      if (rel > 0 && rel < u * 0.16) {
        const perp = Math.abs((X - hx) * dy - (Y - hy) * dx);
        const v = glow(perp, u * 0.0035) * (1 - rel / (u * 0.16)) * 0.8;
        if (v > 0.05) res = over(res, [v, 0]);
      }
      if (dHead < 1.5) { const v = glow(dHead, 1.2); if (v > 0.05) res = over(res, [v, 0]); }
    }
    return res;
  });

  add('dandelion', '#101a12', ['#eef5e6', '#8fbf8a'], 14, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const cx = 0, cy = u * 0.40, R0 = u * 0.16;
    let res = 0;
    const sdStem = (px, py) => sdSeg(px, py, 0, u * 0.88, cx + u * 0.03 * S(t, 1), cy) - u * 0.006;
    if (Y > cy && Math.abs(X) < u * 0.2) {
      const sh = shade(sdStem, X, Y, -0.5, -0.6);
      if (sh > 0) res = [sh * 0.85, 1];
    }
    const dx = X - cx - u * 0.03 * S(t, 1), dy = Y - cy;
    const r = Math.hypot(dx, dy);
    if (r < R0 * 1.6) {
      const a = Math.atan2(dy, dx);
      const fil = 0.45 + 0.55 * ss(0.30, 0.62, vnoise(a * 5.2 + 20, 3.3));
      const ringV = glow(Math.abs(r - R0), u * 0.009) * fil * 1.15;
      const qa = Math.round(a * 22) / 22;
      const tipd = sdC(dx, dy, Math.cos(qa) * R0, Math.sin(qa) * R0, u * 0.006);
      const tipV = glow(tipd, 0.8) * (0.5 + 0.5 * ss(0.25, 0.6, vnoise(qa * 9, 8.8)));
      const v = Math.max(ringV * 0.8, tipV);
      const hub = glow(sdC(dx, dy, 0, 0, u * 0.012), 1.2);
      const vv = Math.max(v, hub * 0.8);
      if (vv > 0.05) res = over(res, [clamp(vv, 0, 1), 0]);
    }
    for (let k = 0; k < 8; k++) {
      const p = (t + k / 8) % 1;
      const ang = hash(k, 3) * TAU;
      const sx = cx + Math.cos(ang) * (R0 + p * u * 0.30) + S(t, 1, k) * u * 0.02;
      const sy = cy + Math.sin(ang) * (R0 + p * u * 0.22) - p * u * 0.16;
      const d = sdC(X, Y, sx, sy, u * 0.005);
      if (d < 1.2) { const v = glow(d, 0.9) * (1 - p * 0.8); if (v > 0.07) res = over(res, [v, 0]); }
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
