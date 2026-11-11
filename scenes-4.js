/* Batch 4: waves, jellyfish, butterfly, sunrise, train, windmill */
'use strict';
(function (root) {
  const H = root.__H, add = root.__addScene;
  const { TAU, clamp, lerp, ss, S, B, vnoise, fbm, sdC, sdE, sdBox, sdSeg, shade, glow, over, drift, hash, getBake, sampleBake } = H;
  const tri = (qx, qy, ax, ay, bx, by, cx, cy, nrm) => {
    const e = (x0, y0, x1, y1) => (qx - x0) * (y1 - y0) - (qy - y0) * (x1 - x0);
    return Math.max(e(ax, ay, bx, by), e(bx, by, cx, cy), e(cx, cy, ax, ay)) / nrm;
  };

  add('waves', '#0a2e4f', ['#bfe0ff', '#5f9cd8'], 12, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    if (Y < u * 0.20) return drift(X, Y, t, { gain: 0.15, thresh: 0.92, speed: 1 });
    let v = 0;
    for (let L = 0; L < 6; L++) {
      const baseY = u * (0.26 + L * 0.115);
      const wamp = u * (0.020 + L * 0.007);
      const yl = baseY + wamp * S(t, 1 + L * 0.22, X * (0.035 + L * 0.012)) + u * 0.006 * S(t, 2.6, X * 0.15 + L);
      const d = Y - yl;
      if (d > 0) {
        const crest = glow(Math.abs(d), u * (0.010 + L * 0.004));
        const body = ss(0, u * 0.06, d) * (0.36 - L * 0.035);
        const foam = vnoise(X * 0.9, Y * 0.9 + t * 3 + L * 7) > 0.72 ? 0.25 * crest : 0;
        v = Math.max(v, clamp(body + crest * (0.75 - L * 0.07) + foam, 0, 1));
      }
    }
    return v > 0.03 ? [v, 0] : 0;
  });

  add('jellyfish', '#06182e', ['#a8e0ff', '#e8f6ff'], 12, (x, y, t, cols, rows) => {
    const bk = getBake('jellyfish');
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const parts = drift(X, Y, t, { scale: 0.5, thresh: 0.88, gain: 0.35, speed: 1.5, windY: -2 });
    if (parts > 0) res = [parts, 0];
    if (bk) {
      const bob = S(t, 2, 0.2) * u * 0.015;
      const pulse = 1 + 0.022 * B(t, 2);
      const fw = u * 0.26 * pulse, fh = u * 0.40 * pulse;
      const cxc = S(t, 1) * u * 0.03, cyc = u * 0.52 + bob;
      const dx = X - cxc, dy = Y - cyc;
      if (Math.abs(dx) <= fw && Math.abs(dy) <= fh) {
        const sx = dx / (fw * 2) + 0.5, sy = dy / (fh * 2) + 0.5;
        const edge = ss(0, 0.14, sx) * ss(1, 0.86, sx) * ss(0, 0.10, sy) * ss(1, 0.90, sy);
        const v0 = sampleBake(bk, sx * (bk.w - 1), sy * (bk.h - 1)) * edge;
        if (v0 > 0.14) res = over(res, [clamp((v0 - 0.12) * 1.8, 0, 1), sy < 0.34 ? 1 : 0]);
      }
    }
    return res;
  });

  add('butterfly', '#2a1840', ['#ffb3d9', '#c77ae8'], 10, (x, y, t, cols, rows) => {
    const bk = getBake('butterfly');
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const motes = drift(X, Y, t, { gain: 0.25, thresh: 0.9, speed: 0.8, twinkle: 2 });
    if (motes > 0) res = [motes, 1];
    if (bk) {
      const bob = S(t, 2.2) * u * 0.02, hover = S(t, 0.5, 5) * u * 0.09;
      const flut = 1 + 0.045 * S(t, 9);
      const fw = u * 0.34 * flut, fh = u * 0.30, cy = u * 0.46 + bob;
      const dx = X - hover, dy = Y - cy;
      if (Math.abs(dx) <= fw && Math.abs(dy) <= fh) {
        const sx = dx / (fw * 2) + 0.5, sy = dy / (fh * 2) + 0.5;
        const v0 = sampleBake(bk, sx * (bk.w - 1), sy * (bk.h - 1));
        if (v0 > 0.04) res = over(res, [clamp(v0 * 1.2, 0, 1), 0]);
      }
    }
    return res;
  });

  add('sunrise', '#2b1638', ['#ffd9a0', '#ff9a5c'], 18, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const hor = u * 0.66;
    const rise = ss(0.05, 0.55, t);
    const sy = hor - u * 0.02 - rise * u * 0.22, sx = 0, sr = u * 0.13;
    let res = 0;
    const skyT = clamp(Y / hor, 0, 1);
    const band = fbm(X * 0.05, Y * 0.11 + 8, 3);
    const skyV = (0.28 - skyT * 0.22) * (0.7 + 0.5 * band) * (0.5 + rise * 0.8);
    if (skyV > 0.285 && Y < hor) res = [clamp(skyV, 0, 0.5), 1];
    const sd = sdC(X, Y, sx, sy, sr);
    if (Y < hor + 1) {
      if (sd < 0) res = over(res, [0.85 + 0.15 * clamp(-sd / (sr * 0.5), 0, 1), 0]);
      else { const g = glow(sd, u * 0.10) * (0.26 + rise * 0.26) * (0.55 + 0.9 * fbm(X * 0.35, Y * 0.35 + 4, 2)); if (g > 0.18) res = over(res, [clamp(g, 0, 0.85), 0, 0.9]); }
    }
    if (Y >= hor) {
      const depth = ss(0, u * 0.2, Y - hor);
      const tex = fbm(X * 0.2 + t * 1.5, Y * 0.35, 3);
      let v = 0.10 + 0.30 * depth + 0.16 * (tex - 0.5);
      const colW = u * 0.05 * (1 + depth * 2.5);
      const shim = vnoise(X * 1.6, Y * 0.4 - t * 5);
      if (Math.abs(X - sx) < colW && shim > 0.30) v = Math.max(v, (0.45 + 0.45 * ss(0.3, 0.75, shim)) * (1 - depth * 0.4));
      res = over(res, [clamp(v, 0, 1), 1]);
    }
    for (let k = 0; k < 3; k++) {
      const bxp = (hash(k, 9) - 0.5) * cols * 0.6 + S(t, 0.5, k) * u * 0.1;
      const byp = u * (0.18 + hash(k, 4) * 0.2) + S(t, 3, k) * u * 0.008;
      const d1 = sdSeg(X, Y, bxp - u * 0.012, byp, bxp, byp - u * 0.007) ;
      const d2 = sdSeg(X, Y, bxp, byp - u * 0.007, bxp + u * 0.012, byp);
      if (Math.min(d1, d2) < u * 0.002) res = over(res, [0.8, 0]);
    }
    return res;
  });

  add('train', '#141412', ['#e8e4da', '#8f8a80'], 10, (x, y, t, cols, rows) => {
    const bk = getBake('train');
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const gy = u * 0.72;
    if (Y > gy) {
      const tex = fbm(X * 0.7, Y * 0.7, 2);
      res = [0.10 + 0.08 * (tex - 0.5), 1];
    }
    if (bk) {
      const pan = ((t * 0.06) % 0.5 - 0.25) * 2;
      const fw = u * 0.50, fh = u * 0.19, cy = u * 0.52;
      const dx = X - pan * u * 0.30, dy = Y - cy;
      if (Math.abs(dx) <= fw && Math.abs(dy) <= fh) {
        const sx = dx / (fw * 2) + 0.5, sy = dy / (fh * 2) + 0.5;
        const eg = ss(0, 0.10, sx) * ss(1, 0.90, sx);
        const v0 = sampleBake(bk, sx * (bk.w - 1), sy * (bk.h - 1)) * eg;
        if (v0 > 0.04) res = over(res, [clamp(v0 * 1.2, 0, 1), 0]);
      }
    }
    return res;
  });

  add('windmill', '#20365c', ['#f0e8d8', '#a8b8d0'], 14, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const gy = u * 0.78, tx = 0, hubY = u * 0.34, bladeL = u * 0.21;
    let res = 0;
    const cl = fbm(X * 0.10 + t * 1.8, Y * 0.2, 4);
    if (cl > 0.58 && Y < u * 0.5) res = [ss(0.58, 0.8, cl) * 0.3, 1];
    if (Y > gy - 2) {
      const g2 = 0.35 + 0.2 * fbm(X * 0.4, Y * 0.5, 2) + (vnoise(X * 2, Y * 2) > 0.88 ? 0.3 : 0);
      if (Y > gy) res = over(res, [g2, 1]);
    }
    if (Math.abs(X - tx) < u * 0.3 && Y > hubY - bladeL - 3 && Y < gy + 2) {
      const sdMill = (px, py) => {
        const taper = u * 0.045 - (py - hubY) / (gy - hubY) * u * 0.020;
        let d = sdBox(px, py, tx, (hubY + gy) / 2, taper, (gy - hubY) / 2);
        d = Math.min(d, sdE(px, py, tx, hubY - u * 0.01, u * 0.045, u * 0.028));
        d = Math.min(d, sdBox(px, py, tx, hubY - u * 0.045, u * 0.05, u * 0.02));
        return d;
      };
      const sh = shade(sdMill, X, Y, -0.55, -0.8);
      if (sh > 0) res = over(res, [sh, 0]);
      const rot = TAU * t;
      const sdBlades = (px, py) => {
        let d = 1e9;
        for (let k = 0; k < 4; k++) {
          const a = rot + k * TAU / 4;
          const dx = Math.cos(a), dy = Math.sin(a);
          const ex = tx + dx * bladeL, ey = hubY + dy * bladeL;
          d = Math.min(d, sdSeg(px, py, tx, hubY, ex, ey) - (u * 0.006 + u * 0.016 * Math.abs(dy)));
        }
        return d;
      };
      const dB = sdBlades(X, Y);
      if (dB < 0.8) {
        const sh2 = shade(sdBlades, X, Y, -0.5, -0.8);
        if (sh2 > 0) res = over(res, [sh2, 0]);
      }
      if (sdC(X, Y, tx, hubY, u * 0.012) < 0) res = over(res, [0.9, 0]);
    }
    return res;
  });

})(typeof window !== 'undefined' ? window : globalThis);
