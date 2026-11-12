/* Batch 1: bloom, sail, bird, wave, cycle, rain */
'use strict';
(function (root) {
  const H = root.__H, add = root.__addScene;
  const { TAU, clamp, lerp, ss, S, B, vnoise, fbm, sdC, sdE, sdBox, sdSeg, shade, glow, over, drift, waveField, getBake, sampleBake, hash } = H;
  const sdTri = (X, Y, ax, ay, bx, by, cx, cy) => {
    const e = (x0, y0, x1, y1, ox, oy) => {
      const v = (X - x0) * (y1 - y0) - (Y - y0) * (x1 - x0);
      const s = Math.sign((ox - x0) * (y1 - y0) - (oy - y0) * (x1 - x0)) || 1;
      return v * s;
    };
    const d = Math.min(
      e(ax, ay, bx, by, cx, cy) / Math.max(Math.hypot(bx - ax, by - ay), 0.001),
      e(bx, by, cx, cy, ax, ay) / Math.max(Math.hypot(cx - bx, cy - by), 0.001),
      e(cx, cy, ax, ay, bx, by) / Math.max(Math.hypot(ax - cx, ay - cy), 0.001));
    return -d * 2.2;
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
    const seaTop = rows * 0.66;
    if (Y > seaTop - rows * 0.05) {
      const edge = seaTop + rows * 0.010 * S(t, 1, X * 0.045) + rows * 0.006 * S(t, 2, X * 0.11);
      if (Y > edge) {
        const depth = ss(0, rows * 0.15, Y - edge);
        const tex = fbm(X * 0.16 + t * 2.4, Y * 0.30 - t * 1.1, 3);
        res = [clamp(0.05 + 0.26 * depth + 0.12 * (tex - 0.5), 0, 1), 1];
      }
    }
    if (Y > rows * 0.30 && Y < rows * 0.70 && Math.abs(X - bx) < rows * 0.34) {
      const u = rows;
      const sdHull = (px, py) => Math.max(sdE(px, py, bx, wl + u * 0.052, u * 0.190, u * 0.062), -(py - (wl + u * 0.015)));
      const sdSails = (px, py) => Math.min(
        sdTri(px, py, bx, wl - u * 0.335, bx, wl - u * 0.005, bx + u * 0.185, wl - u * 0.005),
        sdTri(px, py, bx - u * 0.012, wl - u * 0.30, bx - u * 0.012, wl - u * 0.005, bx - u * 0.150, wl - u * 0.005),
        sdSeg(px, py, bx, wl - u * 0.36, bx, wl) - u * 0.007);
      const dH = sdHull(X, Y), dSa = sdSails(X, Y), d = Math.min(dH, dSa);
      if (d < 1) {
        const sh = shade(dH < dSa ? sdHull : sdSails, X, Y, -0.6, -0.75);
        if (sh > 0) res = over(res, [sh, 0]);
      }
      const rf = sdE(X, Y, bx, seaTop + (wl - seaTop) * 1.0 + u * 0.09, u * 0.15, u * 0.020);
      if (rf < 0) res = over(res, [0.25, 1]);
    }
    const sunD = sdC(X, Y, cols * 0.17, rows * 0.17, rows * 0.045);
    if (sunD < 0) res = over(res, [0.85, 0]);
    else { const g = glow(sunD, rows * 0.025) * 0.28; if (g > 0.08) res = over(res, [g, 0, 0.8]); }
    const cl = clouds(X, Y, t, 0.14, 0.60, 0.30);
    if (Y < rows * 0.45 && cl > 0) res = over(res, [cl, 1]);
    return res;
  });

  add('bird', '#6f7be8', ['#ffffff', '#454fb0'], 12, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const cl = clouds(X, Y, t, 0.15, 0.58, 0.32);
    if (cl > 0) res = [cl, 1];
    // distant gulls: small dim chevrons
    for (let k = 0; k < 3; k++) {
      const span = u * (0.045 + hash(k, 21) * 0.02);
      const gx = (hash(k, 22) - 0.5) * u * 1.1 + S(t, 0.22, hash(k, 23) * 9) * u * 0.14;
      const gy = u * (0.12 + hash(k, 24) * 0.22) + S(t, 0.8, hash(k, 25) * 9) * u * 0.012;
      if (Math.abs(X - gx) > span * 1.4 || Math.abs(Y - gy) > span * 0.9) continue;
      const flap0 = S(t, 2.6, hash(k, 26) * 9);
      const tipY = gy - flap0 * span * 0.55;
      const d = Math.min(sdSeg(X, Y, gx - span, tipY, gx, gy + span * 0.05), sdSeg(X, Y, gx, gy + span * 0.05, gx + span, tipY)) - u * 0.006;
      if (d < 0.8) { const v = glow(d, u * 0.004) * 0.55; if (v > 0.06) res = over(res, [clamp(v, 0, 1), 0]); }
    }
    // hero bird: plump body, head, beak, layered flapping wings
    const bx = -u * 0.02 + S(t, 0.3) * u * 0.02, by = u * 0.42 + S(t, 1.1) * u * 0.015;
    const flap = S(t, 2.2) * 0.5;
    if (Math.abs(X - bx) < u * 0.45 && Math.abs(Y - by) < u * 0.42) {
      for (const dir of [-1, 1]) {
        const shx = bx + dir * u * 0.018, shy = by - u * 0.012;
        for (let j = 0; j < 3; j++) {
          const L = u * (0.165 - j * 0.026), w = u * (0.015 - j * 0.002);
          const th = dir > 0 ? (-0.50 - j * 0.38 + flap * (0.9 - j * 0.15)) : (Math.PI + 0.50 + j * 0.38 - flap * (0.9 - j * 0.15));
          const ex = shx + Math.cos(th) * L, ey = shy + Math.sin(th) * L;
          const d = sdSeg(X, Y, shx, shy, ex, ey) - w;
          if (d < 0.7) {
            const m = ss(0.7, -0.4, d);
            const s = clamp(((X - shx) * Math.cos(th) + (Y - shy) * Math.sin(th)) / L, 0, 1);
            const v = (0.88 - j * 0.20 - s * 0.34) * m;
            if (v > 0.05) res = over(res, [clamp(v, 0, 1), 0]);
          }
        }
      }
      const dTail = sdSeg(X, Y, bx - u * 0.045, by + u * 0.002, bx - u * 0.088, by + u * 0.008) - u * 0.012;
      if (dTail < 0.5) { const v = ss(0.5, -0.4, dTail) * 0.7; if (v > 0.05) res = over(res, [v, 0]); }
      const dBody = sdE(X, Y, bx, by, u * 0.052, u * 0.019);
      if (dBody < 0.8) {
        const m = ss(0.8, -0.5, dBody);
        const v = (0.92 + 0.30 * ss(u * 0.02, -u * 0.02, Y - by)) * m;
        res = over(res, [clamp(v, 0, 1), 0]);
      }
      const hx = bx + u * 0.048, hy = by - u * 0.014;
      const dHead = sdC(X, Y, hx, hy, u * 0.017);
      if (dHead < 0.6) { const v = ss(0.6, -0.4, dHead) * (0.8 + 0.3 * ss(u * 0.012, -u * 0.012, Y - hy)); if (v > 0.05) res = over(res, [clamp(v, 0, 1), 0]); }
      const dBeak = sdSeg(X, Y, hx + u * 0.012, hy, hx + u * 0.030, hy + u * 0.004) - u * 0.004;
      if (dBeak < 0.5) { const v = ss(0.5, -0.3, dBeak) * 0.9; if (v > 0.05) res = over(res, [v, 1]); }
      if (sdC(X, Y, hx + u * 0.004, hy - u * 0.004, u * 0.003) < 0) res = [0.1, 1];
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
        d = Math.min(d, sdSeg(px, py, fx, -u * 0.33, fx + u * 0.009 * (f - 1.5), -u * 0.33 - fl) - u * 0.024);
      }
      d = Math.min(d, sdSeg(px, py, -u * 0.095, -u * 0.17, -u * 0.170, -u * 0.26) - u * 0.025);
      d = Math.min(d, sdSeg(px, py, 0, -u * 0.095, 0, u * 0.07) - u * 0.062);
      d = Math.min(d, sdBox(px, py, 0, u * 0.115, u * 0.075, u * 0.045));
      return d;
    };
    const sh = shade(sdHand, LX, LY, -0.55, -0.75);
    if (sh > 0) return [sh, 0];
    const ph = (t * 2) % 1, ringR = u * (0.26 + 0.13 * ph);
    const rd = Math.abs(sdC(LX, LY, -u * 0.02, -u * 0.24, ringR));
    if (rd < u * 0.008) return [0.20 * (1 - ph), 1];
    return drift(X, Y, t, { gain: 0.16, thresh: 0.92 });
  });

  add('cycle', '#101014', ['#f2e6c4', '#8b8f98'], 12, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const gy = u * 0.72;
    let res = 0;
    if (Y > gy + u * 0.004) {
      const dash = Y < gy + u * 0.035 ? (((X * 0.5 + t * 90) % 9 + 9) % 9 < 2.2 ? 0.22 : 0) : 0;
      res = [0.15 + dash + 0.10 * (fbm(X * 0.9, Y * 0.9, 2) - 0.5), 1];
    }
    const bounce = S(t, 4) * u * 0.005;
    const r = u * 0.075, wy = gy - r + bounce;
    const ax = -u * 0.13, bx2 = u * 0.13;
    // wheels: tire ring + hub + 6 rotating spokes
    for (let w = 0; w < 2; w++) {
      const wx = w === 0 ? ax : bx2;
      const sdRing = (px, py) => Math.abs(sdC(px, py, wx, wy, r)) - u * 0.007;
      const dR = sdRing(X, Y);
      if (dR < 0.8) {
        const sh = shade(sdRing, X, Y, -0.45, -0.8);
        if (sh > 0) res = over(res, [clamp(sh * 1.1, 0, 1), 1]);
      }
      if (sdC(X, Y, wx, wy, u * 0.011) < 0.5) res = over(res, [0.75, 1]);
      for (let s = 0; s < 6; s++) {
        const a = t * 6 + s * Math.PI / 3;
        const dS = sdSeg(X, Y, wx, wy, wx + Math.cos(a) * r * 0.92, wy + Math.sin(a) * r * 0.92) - u * 0.0018;
        if (dS < 0.4) res = over(res, [0.38, 1]);
      }
    }
    // frame: shaded fat tubes
    const bb = [-u * 0.005, wy + r * 0.15], st = [-u * 0.070, wy - r * 1.35], ht = [u * 0.070, wy - r * 1.25], hb = [u * 0.092, wy - r * 0.58];
    const tubes = [[ax, wy, bb[0], bb[1]], [bb[0], bb[1], st[0], st[1]], [ax, wy, st[0], st[1]], [bb[0], bb[1], hb[0], hb[1]], [st[0], st[1], ht[0], ht[1]], [hb[0], hb[1], bx2, wy], [ht[0], ht[1], hb[0], hb[1]]];
    for (const [x0, y0, x1, y1] of tubes) {
      const sdT = (px, py) => sdSeg(px, py, x0, y0, x1, y1) - u * 0.0085;
      const dT = sdT(X, Y);
      if (dT < 0.8) {
        const sh = shade(sdT, X, Y, -0.45, -0.8);
        if (sh > 0) res = over(res, [clamp(sh * 1.35, 0, 1), 0]);
      }
    }
    // saddle + handlebar
    if (sdSeg(X, Y, st[0] - u * 0.016, st[1] - u * 0.008, st[0] + u * 0.020, st[1] - u * 0.012) - u * 0.005 < 0.4) res = over(res, [0.85, 0]);
    if (sdSeg(X, Y, ht[0] - u * 0.006, ht[1], ht[0] + u * 0.022, ht[1] - u * 0.016) - u * 0.0045 < 0.4) res = over(res, [0.85, 0]);
    // crank + pedals rotating
    const ca = t * 6;
    if (sdSeg(X, Y, bb[0] - Math.cos(ca) * u * 0.022, bb[1] - Math.sin(ca) * u * 0.022, bb[0] + Math.cos(ca) * u * 0.022, bb[1] + Math.sin(ca) * u * 0.022) - u * 0.0035 < 0.4) res = over(res, [0.8, 0]);
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
    const slant = Y * 0.12;
    const st = vnoise((X + slant) * 1.9, Y * 0.30 - t * 26);
    const st2 = vnoise((X + slant) * 1.9 + 40, Y * 0.24 - t * 19);
    if (st > 0.82 && Y > rows * 0.06) res = over(res, [ss(0.82, 0.92, st), 0, 0.95]);
    else if (st2 > 0.85 && Y > rows * 0.06) res = over(res, [ss(0.85, 0.95, st2) * 0.42, 0, 0.8]);
    if (Y > rows * 0.90) {
      const rf = fbm(X * 0.3 + t * 6, Y * 0.8, 2);
      res = over(res, [0.20 + 0.24 * rf, 1]);
    }
    // splash rings where drops hit the wet ground
    for (let k = 0; k < 6; k++) {
      const p = (t * 2.2 + hash(k, 11)) % 1;
      const sx = (hash(k, 13) - 0.5) * cols * 0.8;
      const sy = rows * (0.905 + hash(k, 17) * 0.06);
      const rr = 0.5 + p * rows * 0.022;
      const d = Math.abs(Math.hypot((X - sx) * 1.4, (Y - sy) * 3.2) - rr);
      if (d < 0.9) {
        const v = (1 - p) * 0.75 * (1 - d / 0.9);
        if (v > 0.06) res = over(res, [v, 0, 0.9]);
      }
    }
    return res;
  });
})(typeof window !== 'undefined' ? window : globalThis);
