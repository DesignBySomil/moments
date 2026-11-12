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

  add('bloom', '#060608', ['#5f130f', '#a1241c', '#ff5347', '#ff8a76', '#ffc9bb'], 14, (x, y, t, cols, rows) => {
    const bk = getBake('bloom');
    if (!bk) return 0;
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const cyc = u * 0.46;
    const o = ss(0, 1, Math.min(1, t / 0.62));
    const e = o * o * (3 - 2 * o);
    const amb = () => { const a = drift(X, Y, t, { gain: 0.14, thresh: 0.94, speed: 2 }); return a ? [a * e, 0, 0.5] : 0; };
    const grow = (0.40 + 0.60 * e) * (1 + 0.010 * Math.sin(t * TAU * 2));
    const fw = u * 0.235 * grow, fh = u * 0.33 * grow;
    const dx = X, dy = Y - cyc, r = Math.hypot(dx, dy);
    if (Math.abs(dx) > fw * 1.15 || Math.abs(dy) > fh * 1.15) return amb();
    const swirl = (1 - e) * 0.5;
    const ca = Math.cos(swirl), sa = Math.sin(swirl);
    const sx = (dx * ca - dy * sa) / (fw * 2) + 0.5, sy = (dx * sa + dy * ca) / (fh * 2) + 0.5;
    if (sx < 0 || sx > 1 || sy < 0 || sy > 1) return amb();
    const v0 = sampleBake(bk, sx * (bk.w - 1), sy * (bk.h - 1));
    const R = (0.20 + 1.35 * e) * u * 0.26;
    const vis = ss(R, R * 0.80, r);
    // tonal curve: crush low mids, push highlights hot; rose heart extra gain
    const vc = Math.pow(v0, 1.12) * 1.04;
    const hd = Math.hypot(sx - 0.47, (sy - 0.30) * 1.15);
    const heart = 0.55 * ss(0.20, 0.02, hd) * e;
    const hi = 0.55 * ss(0.74, 0.96, v0);
    const v = (vc + heart + hi) * vis;
    if (v <= 0.02) return amb();
    const ink = v0 > 0.78 ? 4 : v0 > 0.58 ? 3 : v0 > 0.40 ? 2 : v0 > 0.22 ? 1 : 0;
    return [clamp(v, 0, 1.65), ink];
  }, { bloom: true });

  add('sail', '#0a1428', ['#f5f7ff', '#93a8d8'], 16, (x, y, t, cols, rows) => {
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

  add('bird', '#0b0e17', ['#ffffff', '#5b668f'], 12, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    // clouds: slow drift, dim
    const cl = fbm(X * 0.06 - t * 2.2, Y * 0.12 + 3, 4);
    if (cl > 0.64 && Y < u * 0.62) return [ss(0.64, 0.86, cl) * 0.16, 1];
    const st = drift(X, Y, t, { gain: 0.22, thresh: 0.92, speed: 0.5, wind: 6, twinkle: 3 });
    if (st > 0) return [st, 1];
    // distant gulls: small V silhouettes
    for (let k = 0; k < 3; k++) {
      const bx = -u * 0.30 + k * u * 0.11 + S(t, 0.5, k) * u * 0.02;
      const by = u * (0.14 + hash(k, 4) * 0.10) + S(t, 2, k) * u * 0.008;
      if (sdSeg(X, Y, bx - u * 0.013, by + u * 0.004, bx, by - u * 0.003) < 0.7 ||
          sdSeg(X, Y, bx, by - u * 0.003, bx + u * 0.013, by + u * 0.004) < 0.7)
        return [0.5, 1];
    }
    // hero gull: soaring in a shallow-V glide, wide kinked wings, luminous
    const flap = 0.10 * S(t, 3);                       // gentle, the V never collapses
    const bank = 0.10 * S(t, 1.5, 0.3);
    const bcx = u * 0.02 + S(t, 1) * u * 0.04, bcy = u * 0.40 + S(t, 2, 0.7) * u * 0.018;
    const cb = Math.cos(bank), sb = Math.sin(bank);
    const RX = X - bcx, RY = Y - bcy;
    const PX = RX * cb + RY * sb, PY = -RX * sb + RY * cb;
    let res = 0;
    if (Math.abs(PX) < u * 0.24 && Math.abs(PY) < u * 0.18) {
      const L1 = u * 0.105, L2 = u * 0.095;
      for (let s = -1; s <= 1; s += 2) {
        const shx = s * u * 0.010, shy = 0;
        const a1 = 0.47 + flap, a2 = -0.16 + flap * 0.6;   // shallow V, tips droop slightly
        const ex = shx + s * Math.cos(a1) * L1, ey = shy - Math.sin(a1) * L1;
        const tx = ex + s * Math.cos(a2) * L2, ty = ey - Math.sin(a2) * L2;
        const dW = Math.min(sdSeg(PX, PY, shx, shy, ex, ey) - u * 0.0085,
                            sdSeg(PX, PY, ex, ey, tx, ty) - u * 0.0022);
        if (dW < u * 0.025) {
          const span = clamp(Math.hypot(PX - shx, PY - shy) / (L1 + L2), 0, 1);
          const rim = 0.5 * glow(Math.abs(dW), u * 0.002);
          const v = glow(dW, u * 0.003) * (1.18 - 0.28 * span) + rim * 0.45;
          if (v > 0.05) res = over(res, [clamp(v, 0, 1), 0]);
        }
      }
      // body: compact teardrop, head bump, small tail fan
      const dBody = sdE(PX, PY, 0, u * 0.010, u * 0.0115, u * 0.024);
      const dHead = sdC(PX, PY, 0, -u * 0.017, u * 0.0085);
      const dTail = sdTri(PX, PY, -u * 0.009, u * 0.028, u * 0.009, u * 0.028, 0, u * 0.044);
      const dCore = Math.min(dBody, dHead, dTail);
      if (dCore < u * 0.02) {
        const lit = 1.05 + 0.35 * ss(u * 0.010, -u * 0.010, PY);
        const v = glow(dCore, u * 0.0035) * lit;
        if (v > 0.05) res = over(res, [clamp(v, 0, 1.6), 0]);
      }
      const dAll = Math.min(dCore, Math.min(
        sdSeg(PX, PY, -u * 0.010, 0, -u * 0.075, -u * 0.030) - u * 0.008,
        sdSeg(PX, PY, u * 0.010, 0, u * 0.075, -u * 0.030) - u * 0.008));
      const halo = glow(Math.max(dAll, 0), u * 0.026) * 0.26;
      if (dAll > 0 && halo > 0.03) res = over(res, [halo, 0]);
    }
    return res;
  }, { bloom: true });

  add('wave', '#0a1a26', ['#ffe1b3', '#7fa8b8'], 10, (x, y, t, cols, rows) => {
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
    if (sh > 0) return [clamp(sh * 1.3, 0, 1), 0];
    const dH = sdHand(LX, LY);
    if (dH < u * 0.012) return [glow(dH, u * 0.006) * 0.4, 0];
    const ph = (t * 2) % 1, ringR = u * (0.26 + 0.13 * ph);
    const rd = Math.abs(sdC(LX, LY, -u * 0.02, -u * 0.24, ringR));
    if (rd < u * 0.008) return [0.20 * (1 - ph), 1];
    return drift(X, Y, t, { gain: 0.16, thresh: 0.92 });
  });

  add('cycle', '#101014', ['#f2e6c4', '#8b8f98'], 12, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const gy = u * 0.78;
    let res = 0;
    if (Y > gy + u * 0.004) {
      const dash = Y < gy + u * 0.035 ? (((X * 0.5 + t * 90) % 9 + 9) % 9 < 2.2 ? 0.22 : 0) : 0;
      res = [0.22 + dash + 0.10 * (fbm(X * 0.9, Y * 0.9, 2) - 0.5), 1];
    }
    // night streetlamp: pole, hot head, halo, light pool on the road
    const lpX = -u * 0.155, lpTop = u * 0.30;
    const sdPole = (px, py) => sdSeg(px, py, lpX, gy, lpX, lpTop) - u * 0.006;
    const dP = sdPole(X, Y);
    if (dP < 0.8) {
      const sh = shade(sdPole, X, Y, -0.5, -0.6);
      if (sh > 0) res = over(res, [clamp(sh * 0.9, 0, 1), 1]);
    }
    if (sdSeg(X, Y, lpX, lpTop, lpX + u * 0.045, lpTop - u * 0.012) - u * 0.005 < 0.5) res = over(res, [0.7, 1]);
    const lampX = lpX + u * 0.050, lampY = lpTop - u * 0.016;
    const dLamp = sdC(X, Y, lampX, lampY, u * 0.011);
    if (dLamp < 6) { const v = glow(dLamp, 2.6); if (v > 0.04) res = over(res, [clamp(v * 1.7, 0, 1), 0]); }
    if (sdE(X, Y, lampX + u * 0.05, gy + u * 0.012, u * 0.13, u * 0.014) < 0) res = over(res, [0.38, 0]);
    const bounce = S(t, 4) * u * 0.005;
    const r = u * 0.082, wy = gy - r + bounce;
    const ax = -u * 0.125, bx2 = u * 0.125;
    // wheels: tire ring + hub + 6 rotating spokes
    for (let w = 0; w < 2; w++) {
      const wx = w === 0 ? ax : bx2;
      // ground contact shadow
      if (sdE(X, Y, wx, gy + u * 0.008, r * 0.85, u * 0.008) < 0) res = over(res, [0.05, 1]);
      const sdRing = (px, py) => Math.abs(sdC(px, py, wx, wy, r)) - u * 0.009;
      const dR = sdRing(X, Y);
      if (dR < 0.8) {
        const sh = shade(sdRing, X, Y, -0.45, -0.8);
        if (sh > 0) res = over(res, [clamp(sh * 1.7, 0, 1), 1]);
      }
      if (sdC(X, Y, wx, wy, u * 0.011) < 0.5) res = over(res, [0.9, 1]);
      for (let s = 0; s < 8; s++) {
        const a = t * 6 + s * Math.PI / 4;
        const dS = sdSeg(X, Y, wx, wy, wx + Math.cos(a) * r * 0.92, wy + Math.sin(a) * r * 0.92) - u * 0.0016;
        if (dS < 0.4) res = over(res, [0.36, 1]);
      }
    }
    // frame: shaded fat tubes
    const bb = [-u * 0.005, wy + r * 0.18], st = [-u * 0.085, wy - r * 1.30], ht = [u * 0.082, wy - r * 1.22], hb = [u * 0.105, wy - r * 0.55];
    const tubes = [[ax, wy, bb[0], bb[1]], [bb[0], bb[1], st[0], st[1]], [ax, wy, st[0], st[1]], [bb[0], bb[1], hb[0], hb[1]], [st[0], st[1], ht[0], ht[1]], [hb[0], hb[1], bx2, wy], [ht[0], ht[1], hb[0], hb[1]]];
    for (const [x0, y0, x1, y1] of tubes) {
      const sdT = (px, py) => sdSeg(px, py, x0, y0, x1, y1) - u * 0.011;
      const dT = sdT(X, Y);
      if (dT < 0.8) {
        const sh = shade(sdT, X, Y, -0.45, -0.8);
        if (sh > 0) res = over(res, [clamp(sh * 1.85, 0, 1), 0]);
      }
    }
    // saddle + handlebar
    if (sdSeg(X, Y, st[0] - u * 0.016, st[1] - u * 0.008, st[0] + u * 0.020, st[1] - u * 0.012) - u * 0.005 < 0.4) res = over(res, [0.85, 0]);
    if (sdSeg(X, Y, ht[0] - u * 0.006, ht[1], ht[0] + u * 0.022, ht[1] - u * 0.016) - u * 0.0045 < 0.4) res = over(res, [0.85, 0]);
    // crank + pedals rotating
    const ca = t * 6;
    // chainring with lightening holes
    const dRing = Math.abs(sdC(X, Y, bb[0], bb[1], u * 0.024)) - u * 0.004;
    if (dRing < 0.5) res = over(res, [0.80, 0]);
    for (let h = 0; h < 4; h++) {
      const ha = h * Math.PI / 2 + 0.4;
      if (sdC(X, Y, bb[0] + Math.cos(ha) * u * 0.013, bb[1] + Math.sin(ha) * u * 0.013, u * 0.004) < 0) res = over(res, [0.10, 0]);
    }
    // chain: two runs to the rear hub
    const dCh = Math.min(sdSeg(X, Y, bb[0], bb[1] - u * 0.020, ax, wy - u * 0.008), sdSeg(X, Y, bb[0], bb[1] + u * 0.022, ax, wy + u * 0.009)) - u * 0.0022;
    if (dCh < 0.4) res = over(res, [0.28, 1]);
    if (sdSeg(X, Y, bb[0] - Math.cos(ca) * u * 0.022, bb[1] - Math.sin(ca) * u * 0.022, bb[0] + Math.cos(ca) * u * 0.022, bb[1] + Math.sin(ca) * u * 0.022) - u * 0.0035 < 0.4) res = over(res, [0.85, 0]);
    return res;
  });

  add('rain', '#1d2230', ['#bcd6ff', '#5f6b85', '#ffd9a0'], 10, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y;
    let res = 0;
    if (Y < rows * 0.34) {
      const ragged = fbm(X * 0.35, 7.7, 3) * rows * 0.10;
      const cm = fbm(X * 0.22 + t * 0.9, Y * 0.38 + 3.7, 5);
      const flash = Math.pow(Math.max(0, S(t, 1, 0.62)), 40) * 0.55;
      const v = ss(0.36, 0.78, cm) * (0.55 + flash) * ss(rows * 0.015, rows * 0.20 + ragged, Y);
      if (v > 0.03) res = [v, 1];
    }
    // distant skyline: discrete flat-roof towers with warm window grids
    {
      const bw = 8;
      const b = Math.floor(X / bw);
      const inGap = X - b * bw > bw - 1.5;
      const roof = rows * (0.58 + 0.20 * hash(b * 3.7, 4.2));
      if (Y > roof && Y < rows * 0.895 && !inGap) {
        // street glow near the base, dimmer toward the roof
        const street = 1 - clamp((Y - roof) / (rows * 0.895 - roof), 0, 1);
        res = over(res, [0.24 + 0.14 * street + 0.05 * hash(b * 9.1, 8.8), 1]);
        const wy = Math.floor((Y - roof) / 3.5), wx = Math.floor((X - b * bw) / 3);
        if (hash(b * 7.3 + wy * 13.7 + wx * 5.1, 2.6) > 0.45 && (X - b * bw) % 3 < 1.6 && (Y - roof) % 3.5 < 1.8)
          res = over(res, [0.85, 2]);
      }
    }
    const slant = Y * 0.12;
    const st = vnoise((X + slant) * 1.9, Y * 0.30 - t * 26);
    const st2 = vnoise((X + slant) * 1.9 + 40, Y * 0.24 - t * 19);
    if (st > 0.82 && Y > rows * 0.06) res = over(res, [ss(0.82, 0.92, st), 0, 0.95]);
    else if (st2 > 0.85 && Y > rows * 0.06) res = over(res, [ss(0.85, 0.95, st2) * 0.42, 0, 0.8]);
    if (Y > rows * 0.895) {
      const rf = fbm(X * 0.3 + t * 6, Y * 0.8, 2);
      res = over(res, [0.18 + 0.22 * rf, 1]);
      // mirrored tower windows smeared in the puddle
      const bw2 = 8, b2 = Math.floor(X / bw2);
      const roof2 = rows * (0.58 + 0.20 * hash(b2 * 3.7, 4.2));
      const wob = fbm(X * 0.5 + t * 3, Y * 0.5, 2) * rows * 0.02;
      const myY = rows * 1.79 - Y + wob;
      const wy = Math.floor((myY - roof2) / 3.5), wx = Math.floor((X - b2 * bw2) / 3);
      if (myY > roof2 && hash(b2 * 7.3 + wy * 13.7 + wx * 5.1, 2.6) > 0.45 && (X - b2 * bw2) % 3 < 1.6)
        res = over(res, [0.50, 2]);
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
