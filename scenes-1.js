/* Batch 1: bloom, sail, bird, wave, cycle, rain */
'use strict';
(function (root) {
  const H = root.__H, add = root.__addScene;
  const { TAU, clamp, lerp, ss, S, B, vnoise, fbm, sdC, sdE, sdBox, sdSeg, shade, glow, over, drift, waveField, getBake, sampleBake } = H;
  const sdTri = (X, Y, ax, ay, bx, by, cx, cy) => {
    const e = (x0, y0, x1, y1) => (X - x0) * (y1 - y0) - (Y - y0) * (x1 - x0);
    return Math.max(e(ax, ay, bx, by), e(bx, by, cx, cy), e(cx, cy, ax, ay)) / Math.max(Math.hypot(bx - ax, by - ay), Math.hypot(cx - bx, cy - by), Math.hypot(ax - cx, ay - cy)) * 2.2;
  };
  const clouds = (X, Y, t, fq, th, gain) => {
    const c = fbm(X * fq + t * 1.6, Y * fq * 1.9, 4);
    return c > th ? ss(th, th + 0.22, c) * gain : 0;
  };

  add('bloom', '#0b0b0e', ['#ff5347'], 14, (x, y, t, cols, rows) => {
    const bk = getBake('bloom');
    if (!bk) return 0;
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const cyc = u * 0.46;
    const o = ss(0, 1, Math.min(1, t / 0.62));
    const e = o * o * (3 - 2 * o);
    const amb = () => { const a = drift(X, Y, t, { gain: 0.14, thresh: 0.94, speed: 2 }); return a ? [a * e, 0, 0.5] : 0; };
    const grow = (0.40 + 0.60 * e) * (1 + 0.010 * Math.sin(t * TAU * 2));
    const fw = u * 0.30 * grow, fh = u * 0.33 * grow;
    const dx = X, dy = Y - cyc, r = Math.hypot(dx, dy);
    if (Math.abs(dx) > fw * 1.15 || Math.abs(dy) > fh * 1.15) return amb();
    const swirl = (1 - e) * 0.5;
    const ca = Math.cos(swirl), sa = Math.sin(swirl);
    const sx = (dx * ca - dy * sa) / (fw * 2) + 0.5, sy = (dx * sa + dy * ca) / (fh * 2) + 0.5;
    if (sx < 0 || sx > 1 || sy < 0 || sy > 1) return amb();
    const v0 = sampleBake(bk, sx * (bk.w - 1), sy * (bk.h - 1));
    const R = (0.20 + 1.35 * e) * u * 0.26;
    const vis = ss(R, R * 0.80, r);
    const v = v0 * vis;
    if (v <= 0.02) return amb();
    return [clamp(v * 1.1, 0, 1), 0];
  });

  add('sail', '#1f47e0', ['#f5f7ff', '#a9bcff'], 16, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y;
    const bobY = S(t, 2) * rows * 0.006, bx = -cols * 0.05, wl = rows * 0.56 + bobY;
    let res = 0;
    const seaTop = rows * 0.62;
    if (Y > seaTop - rows * 0.05) {
      const edge = seaTop + rows * 0.010 * S(t, 1, X * 0.045) + rows * 0.006 * S(t, 2, X * 0.11);
      if (Y > edge) {
        const depth = ss(0, rows * 0.15, Y - edge);
        const tex = fbm(X * 0.16 + t * 2.4, Y * 0.30 - t * 1.1, 3);
        res = [clamp(0.10 + 0.62 * depth + 0.28 * (tex - 0.5), 0, 1), 1];
      }
    }
    if (Y > rows * 0.30 && Y < rows * 0.70 && Math.abs(X - bx) < rows * 0.34) {
      const u = rows;
      const sdHull = (px, py) => Math.max(sdE(px, py, bx, wl + u * 0.045, u * 0.160, u * 0.052), -(py - (wl + u * 0.015)));
      const sdSails = (px, py) => Math.min(
        sdTri(px, py, bx, wl - u * 0.27, bx, wl - u * 0.005, bx + u * 0.150, wl - u * 0.005),
        sdTri(px, py, bx - u * 0.010, wl - u * 0.25, bx - u * 0.010, wl - u * 0.005, bx - u * 0.125, wl - u * 0.005),
        sdSeg(px, py, bx, wl - u * 0.29, bx, wl) - u * 0.006);
      const dH = sdHull(X, Y), dSa = sdSails(X, Y), d = Math.min(dH, dSa);
      if (d < 1) {
        const sh = shade(dH < dSa ? sdHull : sdSails, X, Y, -0.6, -0.75);
        if (sh > 0) res = over(res, [sh, 0]);
      }
      const rf = sdE(X, Y, bx, seaTop + (wl - seaTop) * 1.0 + u * 0.09, u * 0.15, u * 0.020);
      if (rf < 0) res = over(res, [0.25, 1]);
    }
    const sunD = sdC(X, Y, cols * 0.17, rows * 0.17, rows * 0.055);
    if (sunD < 0) res = over(res, [0.85, 0]);
    else { const g = glow(sunD, rows * 0.035) * 0.35; if (g > 0.05) res = over(res, [g, 0, 0.8]); }
    const cl = clouds(X, Y, t, 0.14, 0.60, 0.30);
    if (Y < rows * 0.45 && cl > 0) res = over(res, [cl, 1]);
    return res;
  });

  add('bird', '#6f7be8', ['#ffffff', '#454fb0'], 12, (x, y, t, cols, rows) => {
    const bk = getBake('bird');
    const X = (x - cols / 2) / 1.06, Y = y;
    let res = 0;
    const cl = clouds(X, Y, t, 0.15, 0.58, 0.32);
    if (cl > 0) res = [cl, 1];
    if (bk) {
      const u = rows;
      const pan = S(t, 0.35, 2) * u * 0.10, bob = S(t, 1.6) * u * 0.018;
      const fw = u * 0.34, fh = u * 0.20, cy = u * 0.34 + bob;
      const dx = X - pan, dy = Y - cy;
      if (Math.abs(dx) <= fw && Math.abs(dy) <= fh) {
        const sx = dx / (fw * 2) + 0.5, sy = dy / (fh * 2) + 0.5;
        const v0 = sampleBake(bk, sx * (bk.w - 1), sy * (bk.h - 1));
        if (v0 > 0.04) res = over(res, [clamp(v0 * 1.15, 0, 1), 0]);
      }
    }
    return res;
  });

  add('wave', '#12303f', ['#ffe1b3', '#7fa8b8'], 10, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y;
    const a = S(t, 2) * 0.20, wy = rows * 0.74;
    const ca = Math.cos(a), sa = Math.sin(a);
    const LX = X * ca - (Y - wy) * sa, LY = X * sa + (Y - wy) * ca;
    const u = rows;
    if (Math.abs(LX) > u * 0.34 || LY > u * 0.10 || LY < -u * 0.66) return drift(X, Y, t, { gain: 0.16, thresh: 0.92 });
    const sdHand = (px, py) => {
      let d = sdBox(px, py, 0, -u * 0.22, u * 0.095, u * 0.125);
      for (let f = 0; f < 4; f++) {
        const fx = -u * 0.073 + f * u * 0.049, fl = u * (f === 1 || f === 2 ? 0.125 : 0.106);
        d = Math.min(d, sdSeg(px, py, fx, -u * 0.33, fx + u * 0.009 * (f - 1.5), -u * 0.33 - fl) - u * 0.021);
      }
      d = Math.min(d, sdSeg(px, py, -u * 0.095, -u * 0.17, -u * 0.170, -u * 0.26) - u * 0.022);
      d = Math.min(d, sdSeg(px, py, 0, -u * 0.095, 0, u * 0.07) - u * 0.062);
      d = Math.min(d, sdBox(px, py, 0, u * 0.115, u * 0.075, u * 0.045));
      return d;
    };
    const sh = shade(sdHand, LX, LY, -0.55, -0.75);
    if (sh > 0) return [sh, 0];
    const ph = (t * 2) % 1, ringR = u * (0.26 + 0.13 * ph);
    const rd = Math.abs(sdC(LX, LY, -u * 0.02, -u * 0.24, ringR));
    if (rd < u * 0.008) return [0.45 * (1 - ph), 1];
    return drift(X, Y, t, { gain: 0.16, thresh: 0.92 });
  });

  add('cycle', '#101014', ['#f2e6c4', '#8b8f98'], 12, (x, y, t, cols, rows) => {
    const bk = getBake('cycle');
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const gy = u * 0.68;
    let res = 0;
    if (Y > gy + u * 0.004) {
      const dash = Y < gy + u * 0.035 ? (((X * 0.5 + t * 90) % 9 + 9) % 9 < 2.2 ? 0.32 : 0) : 0;
      res = [0.26 + dash + 0.18 * (fbm(X * 0.9, Y * 0.9, 2) - 0.5), 1];
    }
    if (bk) {
      const bounce = S(t, 4) * u * 0.006;
      const fw = u * 0.42, fh = u * 0.24, cyc = u * 0.52 + bounce;
      const dx = X, dy = Y - cyc;
      if (Math.abs(dx) <= fw && Math.abs(dy) <= fh) {
        const sx = dx / (fw * 2) + 0.5, sy = dy / (fh * 2) + 0.5;
        const v0 = sampleBake(bk, sx * (bk.w - 1), sy * (bk.h - 1));
        if (v0 > 0.04) res = over(res, [clamp(v0 * 1.2, 0, 1), 0]);
      }
    }
    return res;
  });

  add('rain', '#1d2230', ['#bcd6ff', '#5f6b85'], 10, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y;
    let res = 0;
    if (Y < rows * 0.34) {
      const ragged = fbm(X * 0.35, 7.7, 3) * rows * 0.10;
      const cm = fbm(X * 0.22 + t * 0.9, Y * 0.38 + 3.7, 5);
      const flash = Math.pow(Math.max(0, S(t, 1, 0.62)), 40) * 0.55;
      const v = ss(0.36, 0.78, cm) * (0.55 + flash) * ss(rows * 0.015, rows * 0.20 + ragged, Y);
      if (v > 0.03) res = [v, 1];
    }
    const st = vnoise(X * 1.9, Y * 0.30 - t * 26);
    const st2 = vnoise(X * 1.9 + 40, Y * 0.24 - t * 19);
    if (st > 0.83 && Y > rows * 0.06) res = over(res, [ss(0.83, 0.94, st) * 0.9, 0, 0.9]);
    else if (st2 > 0.85 && Y > rows * 0.06) res = over(res, [ss(0.85, 0.95, st2) * 0.42, 0, 0.8]);
    if (Y > rows * 0.90) {
      const rf = fbm(X * 0.3 + t * 6, Y * 0.8, 2);
      res = over(res, [0.20 + 0.24 * rf, 1]);
    }
    return res;
  });
})(typeof window !== 'undefined' ? window : globalThis);
