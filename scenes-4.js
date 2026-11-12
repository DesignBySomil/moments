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
    const skyV = 0.15 * ss(0.55, 1.0, skyT) * (0.45 + rise * 0.75);
    if (skyV > 0.03 && Y < hor) res = [clamp(skyV, 0, 0.15), 1];
    const sd = sdC(X, Y, sx, sy, sr);
    if (Y < hor + 1) {
      if (sd < 0) res = over(res, [0.98 + 0.02 * clamp(-sd / (sr * 0.4), 0, 1), 0]);
      else { const g = glow(sd, u * 0.011) * (0.30 + rise * 0.35); if (g > 0.05) res = over(res, [clamp(g, 0, 0.8), 0, 0.9]); }
    }
    if (Y >= hor) {
      const depth = ss(0, u * 0.2, Y - hor);
      const tex = fbm(X * 0.2 + t * 1.5, Y * 0.35, 3);
      let v = 0.05 + 0.12 * depth + 0.06 * (tex - 0.5);
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

  add('train', '#141412', ['#ffd9a0', '#8f8a80'], 10, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const gy = u * 0.80;
    // ground + twin rails with perspective sheen
    if (Y > gy) {
      const tex = fbm(X * 0.7, Y * 0.7, 2);
      res = [0.09 + 0.07 * (tex - 0.5), 1];
      if (Math.abs(Y - gy - u * 0.016) < 1.2) res = over(res, [0.55, 1]);
      if (Math.abs(Y - gy - u * 0.036) < 1.2) res = over(res, [0.40, 1]);
    }
    const bob = S(t, 2, 0.1) * u * 0.003;
    // hero locomotive, cropped 3/4 front, nose right
    const noseX = u * 0.155, boilY = u * 0.565 + bob, boilR = u * 0.078;
    const cabX = -u * 0.132, cabY = u * 0.475 + bob;
    // boiler: big capsule with sculpted lighting
    const sdBoiler = (px, py) => sdE(px, py, 0, boilY, u * 0.19, boilR);
    const dB = sdBoiler(X, Y);
    if (dB < 1.2) {
      let v = clamp(0.55 + 0.65 * (0.5 - (Y - boilY) / (boilR * 1.4)), 0.10, 1.15); // hot crown, dark belly
      v += 0.30 * ss(u * 0.010, 0, Math.abs(Y - (boilY - boilR * 0.72)) * (dB < 0 ? 1 : 0)); // crown rim stripe
      if (v > 0.04 && dB < 0.9) res = over(res, [clamp(v, 0, 1), 1]);
    }
    // smokebox: front disc, darker with lit rim
    const dN = sdE(X, Y, noseX, boilY, u * 0.026, boilR * 0.94);
    if (dN < 0.9) {
      let v = 0.30 + 0.55 * ss(0, -u * 0.012, dN) * ss(-0.9, 0.6, (Y - boilY) / boilR);
      res = over(res, [clamp(v, 0, 1), 1]);
    }
    // boiler bands
    for (const bxv of [-u * 0.085, 0, u * 0.085]) {
      if (Math.abs(X - bxv) < u * 0.0035 && dB < 0 && (Y - boilY) < boilR * 0.55) res = over(res, [0.72, 0]);
    }
    // steam dome + chimney
    if (sdE(X, Y, u * 0.013, boilY - boilR - u * 0.010, u * 0.017, u * 0.013) < 0.5) res = over(res, [0.85, 1]);
    if (sdBox(X, Y, u * 0.115, boilY - boilR - u * 0.016, u * 0.0095, u * 0.018) - u * 0.004 < 0.5) res = over(res, [0.75, 1]);
    // cab: taller box, warm two-pane window, rivet line
    const sdCab = (px, py) => sdBox(px, py, cabX, cabY, u * 0.064, u * 0.088) - u * 0.008;
    const dC = sdCab(X, Y);
    if (dC < 0.9) {
      let v = clamp(0.62 - 0.55 * ss(cabY - u * 0.08, cabY + u * 0.09, Y), 0.14, 1);
      v += 0.25 * ss(u * 0.008, 0, Math.abs(X - (cabX + u * 0.060)));
      res = over(res, [clamp(v, 0, 1), 1]);
    }
    if (sdBox(X, Y, cabX + u * 0.010, cabY - u * 0.040, u * 0.017, u * 0.024) < 0) res = over(res, [0.98, 0]);
    if (sdBox(X, Y, cabX + u * 0.044, cabY - u * 0.040, u * 0.012, u * 0.024) < 0) res = over(res, [0.85, 0]);
    // cab roof
    if (sdE(X, Y, cabX, cabY - u * 0.092, u * 0.062, u * 0.012) < 0.5) res = over(res, [0.9, 1]);
    // running board: bright step line under boiler
    if (Math.abs(Y - (boilY + boilR + u * 0.006)) < 1.2 && X > -u * 0.205 && X < noseX + u * 0.01) res = over(res, [0.60, 1]);
    // driving wheels with rotating spokes + connecting rod
    const wY = boilY + boilR + u * 0.038;
    const wa = t * 4;
    const wheels = [[-u * 0.098, u * 0.046], [-u * 0.004, u * 0.046], [u * 0.124, u * 0.030]];
    const crankPts = [];
    for (const [wx, wr] of wheels) {
      const dW = sdC(X, Y, wx, wY + (wr === u * 0.030 ? u * 0.018 : 0), wr);
      if (dW < 0.9) {
        const sh = shade((qx, qy) => sdC(qx, qy, wx, wY + (wr === u * 0.030 ? u * 0.018 : 0), wr), X, Y, -0.4, -0.8);
        if (sh > 0) res = over(res, [clamp(sh * 0.75 + 0.06, 0, 1), 1]);
      }
      if (sdC(X, Y, wx, wY + (wr === u * 0.030 ? u * 0.018 : 0), wr * 0.28) < 0.5) res = over(res, [0.7, 0]);
      if (wr === u * 0.046) {
        for (let s = 0; s < 5; s++) {
          const a2 = wa + s * TAU / 5;
          const dS = sdSeg(X, Y, wx, wY, wx + Math.cos(a2) * wr * 0.88, wY + Math.sin(a2) * wr * 0.88) - u * 0.0022;
          if (dS < 0.4) res = over(res, [0.30, 1]);
        }
        crankPts.push([wx + Math.cos(wa) * wr * 0.5, wY + Math.sin(wa) * wr * 0.5]);
      }
    }
    // connecting rod between the two big drivers
    if (crankPts.length === 2) {
      const dR = sdSeg(X, Y, crankPts[0][0], crankPts[0][1], crankPts[1][0], crankPts[1][1]) - u * 0.0045;
      if (dR < 0.5) res = over(res, [0.80, 0]);
    }
    // headlight + beam
    const hx = noseX + u * 0.026, hy = boilY - u * 0.010;
    if (sdBox(X, Y, hx, hy, u * 0.010, u * 0.012) - u * 0.003 < 0.5) res = over(res, [0.95, 0]);
    const dh = sdC(X, Y, hx + u * 0.008, hy, u * 0.007);
    if (dh < 2.5) { const v = glow(dh, 1.4); if (v > 0.05) res = over(res, [clamp(v * 1.4, 0, 1), 0]); }
    const rel = X - hx;
    if (rel > 0 && rel < u * 0.030) {
      const spread = u * 0.006 + rel * 0.42;
      const perp = Math.abs(Y - hy - rel * 0.28);
      if (perp < spread) { const v = (1 - perp / spread) * (1 - rel / (u * 0.030)) * 0.5; if (v > 0.04) res = over(res, [v, 0]); }
    }
    // steam puffs from chimney, rising and drifting left
    for (let k = 0; k < 5; k++) {
      const pp = (t * 0.7 + k / 5) % 1;
      const sx = u * 0.115 - pp * u * 0.14 + fbm(k * 3.3, t, 2) * u * 0.03;
      const sy = boilY - boilR - u * 0.035 - pp * u * 0.20;
      const sr = u * (0.014 + pp * 0.030);
      const ds = sdC(X, Y, sx, sy, sr);
      if (ds < 1.4) { const v = glow(ds, sr * 0.5) * (1 - pp) * 0.55; if (v > 0.05) res = over(res, [clamp(v, 0, 1), 1]); }
    }
    return res;
  });

  add('windmill', '#20365c', ['#f0e8d8', '#a8b8d0'], 14, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const gy = u * 0.82, tx = 0, hubY = u * 0.37, bladeL = u * 0.215;
    let res = 0;
    const cl = fbm(X * 0.10 + t * 1.8, Y * 0.2, 4);
    if (cl > 0.58 && Y < u * 0.5) res = [ss(0.58, 0.8, cl) * 0.3, 1];
    if (Y > gy) {
      const g2 = 0.18 + 0.12 * fbm(X * 0.4, Y * 0.5, 2) + (vnoise(X * 2, Y * 2) > 0.90 ? 0.22 : 0);
      res = over(res, [g2, 1]);
    }
    // tower: fat tapered stone body + cap, shaded, with door and window gaps
    if (Math.abs(X - tx) < u * 0.16 && Y > hubY - u * 0.14 && Y < gy + 2) {
      const halfW = (py) => u * 0.075 - (py - hubY) / (gy - hubY) * u * 0.030;
      const sdTower = (px, py) => {
        let d = sdBox(px, py, tx, (hubY + gy) / 2, halfW(py), (gy - hubY) / 2);
        d = Math.min(d, sdE(px, py, tx, hubY - u * 0.005, u * 0.058, u * 0.034));
        d = Math.min(d, sdBox(px, py, tx, hubY - u * 0.058, u * 0.042, u * 0.024));
        d = Math.min(d, sdSeg(px, py, tx, hubY - u * 0.080, tx, hubY - u * 0.100) - u * 0.004);
        return d;
      };
      const dT = sdTower(X, Y);
      const m = ss(0.9, -0.4, dT);
      if (m > 0) {
        const hw = Math.max(halfW(Y), u * 0.030);
        let v = (1.02 - 0.62 * ss(-hw, hw, X - tx)) * m;
        v += 0.12 * ss(u * 0.012, 0, Math.abs(X - (tx - hw * 0.92))) * m;
        if (sdE(X, Y, tx, gy - u * 0.008, u * 0.016, u * 0.026) < 0) v *= 0.15;
        else if (sdBox(X, Y, tx, hubY + (gy - hubY) * 0.45, u * 0.009, u * 0.012) < 0) v *= 0.25;
        res = over(res, [clamp(v, 0, 1), 0]);
      }
    }
    // sails: 4 lattice panels, cloth on the trailing side of each spar
    const rot = TAU * t * 0.12;
    {
      const rx2 = X - tx, ry2 = Y - hubY;
      if (Math.hypot(rx2, ry2) < bladeL * 1.25) {
        for (let k = 0; k < 4; k++) {
          const a = rot + k * TAU / 4;
          const dx = Math.cos(a), dy = Math.sin(a);
          const s = rx2 * dx + ry2 * dy;
          const p = -rx2 * dy + ry2 * dx;
          if (s < u * 0.008 || s > bladeL) continue;
          const wSail = u * (0.012 + 0.032 * s / bladeL);
          if (p > 0 && p < wSail && s > bladeL * 0.15) {
            const rung = 0.82 + 0.18 * Math.abs(Math.sin(s * 2.2));
            const edge = ss(0, u * 0.005, p) * ss(wSail, wSail - u * 0.005, p);
            const v = (1.0 - 0.35 * s / bladeL) * (0.82 + 0.18 * rung) * (0.75 + 0.25 * edge);
            res = over(res, [clamp(v, 0, 1), 0]);
          }
          if (Math.abs(p) < u * 0.005) res = over(res, [0.95, 0]);
        }
        if (sdC(X, Y, tx, hubY, u * 0.014) < 0) res = over(res, [1, 0]);
      }
    }
    return res;
  });

})(typeof window !== 'undefined' ? window : globalThis);
