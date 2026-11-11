/* Batch 3: snow, lighthouse, lantern, balloon, kite, paperplane */
'use strict';
(function (root) {
  const H = root.__H, add = root.__addScene;
  const { TAU, clamp, lerp, ss, S, B, vnoise, fbm, sdC, sdE, sdBox, sdSeg, sdVesica, shade, glow, over, drift, waveField, hash, getBake, sampleBake } = H;

  add('snow', '#12161f', ['#eef2f7', '#5a6472'], 14, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const gy = u * 0.80 + fbm(X * 0.10, 8.8, 3) * u * 0.06;
    let res = 0;
    if (Y > gy) res = [0.55 + 0.25 * fbm(X * 0.5, Y * 0.5, 2), 0];
    const hx = -u * 0.16, hw = u * 0.14, hb = u * 0.80, ht = u * 0.60;
    if (X > hx - hw - u * 0.1 && X < hx + hw + u * 0.1 && Y > ht - u * 0.2 && Y < gy + 2) {
      const sdHouse = (px, py) => {
        let d = sdBox(px, py, hx, (ht + hb) / 2, hw, (hb - ht) / 2);
        const roofT = Math.max(sdSeg(px, py, hx - hw * 1.15, ht, hx, ht - u * 0.12), sdSeg(px, py, hx, ht - u * 0.12, hx + hw * 1.15, ht));
        d = Math.min(d, Math.max(sdTri0(px, py, hx - hw * 1.18, ht + u * 0.01, hx, ht - u * 0.13, hx + hw * 1.18, ht + u * 0.01), 0));
        d = Math.min(d, sdBox(px, py, hx + hw * 0.55, ht - u * 0.10, u * 0.018, u * 0.05));
        return d;
      };
      const sdTri0 = (px, py, ax, ay, bx, by, cx, cy) => {
        const e = (x0, y0, x1, y1) => (px - x0) * (y1 - y0) - (py - y0) * (x1 - x0);
        return Math.max(e(ax, ay, bx, by), e(bx, by, cx, cy), e(cx, cy, ax, ay)) / (u * 0.3);
      };
      const sh = shade(sdHouse, X, Y, -0.4, -0.85);
      if (sh > 0) res = over(res, [clamp(sh * 1.5, 0, 1), 1]);
      const winD = sdBox(X, Y, hx - hw * 0.4, (ht + hb) / 2, u * 0.022, u * 0.022);
      if (winD < 0) res = over(res, [0.95, 0]);
      const w2 = sdBox(X, Y, hx + hw * 0.4, (ht + hb) / 2, u * 0.022, u * 0.022);
      if (w2 < 0) res = over(res, [0.7, 0]);
      for (let k = 0; k < 4; k++) {
        const p = (t * 0.7 + k / 4) % 1;
        const sx = hx + hw * 0.55 + S(t, 1, k) * u * 0.02, sy = ht - u * 0.15 - p * u * 0.18;
        const d = sdC(X, Y, sx, sy, u * (0.012 + p * 0.02));
        if (d < 1) { const v = glow(d, 1.0) * (1 - p) * 0.4; if (v > 0.06) res = over(res, [v, 1]); }
      }
    }
    for (let L = 0; L < 3; L++) {
      const sc = [1.6, 2.6, 4.2][L], sp = [7, 11, 16][L], th = [0.90, 0.88, 0.86][L], gn = [0.85, 0.5, 0.3][L];
      const n = vnoise(X * sc * 0.5 + L * 40, (Y + t * sp) * sc * 0.22);
      if (n > th) {
        const d2 = hash(Math.floor(X * sc * 0.5 + L * 40), Math.floor((Y + t * sp) * sc * 0.22));
        res = over(res, [ss(th, th + 0.08, n) * gn * (0.6 + 0.4 * d2), 0]);
      }
    }
    return res;
  });

  add('lighthouse', '#0e2438', ['#f2f6ff', '#8fb6d8'], 12, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const lx = u * 0.10, lampY = u * 0.26, baseY = u * 0.68;
    let res = 0;
    const st = drift(X, Y, t, { scale: 0.5, thresh: 0.9, gain: 0.4, speed: 0.4 });
    if (st > 0) res = [st, 1];
    const beamA = TAU * t * 0.25;
    const bdx = Math.cos(beamA), bdy = Math.sin(beamA) * 0.35 - 0.06;
    const rx = X - lx, ry = Y - lampY;
    const rdist = Math.hypot(rx, ry);
    if (rdist > u * 0.04 && Y < u * 0.70) {
      const dot = (rx * bdx + ry * bdy) / rdist;
      for (const sgn of [1, -0.35]) {
        const dd = sgn > 0 ? dot : -dot;
        if (dd > 0.90) {
          const v = ss(0.90, 0.995, dd) * glow(rdist, u * 0.30) * (sgn > 0 ? 1.0 : 0.35);
          if (v > 0.04) res = over(res, [clamp(v * 1.4, 0, 1), 0, 0.92]);
        }
      }
    }
    if (Math.abs(rx) < u * 0.13 && Y > lampY - u * 0.1 && Y < baseY + u * 0.06) {
      const sdTower = (px, py) => {
        const taper = u * 0.068 - (py - lampY) / (baseY - lampY) * u * 0.026;
        let d = sdBox(px, py, lx, (lampY + baseY) / 2 + u * 0.03, taper, (baseY - lampY) / 2);
        d = Math.min(d, sdBox(px, py, lx, lampY + u * 0.012, u * 0.075, u * 0.014));
        d = Math.min(d, sdBox(px, py, lx, lampY - u * 0.02, u * 0.032, u * 0.030));
        d = Math.min(d, sdTri1(px, py, lx - u * 0.045, lampY - u * 0.048, lx, lampY - u * 0.085, lx + u * 0.045, lampY - u * 0.048));
        d = Math.min(d, sdE(px, py, lx, baseY + u * 0.03, u * 0.13, u * 0.035));
        return d;
      };
      const sdTri1 = (px, py, ax, ay, bx, by, cx, cy) => {
        const e = (x0, y0, x1, y1) => (px - x0) * (y1 - y0) - (py - y0) * (x1 - x0);
        return Math.max(e(ax, ay, bx, by), e(bx, by, cx, cy), e(cx, cy, ax, ay)) / (u * 0.2);
      };
      const sh = shade(sdTower, X, Y, -0.6, -0.7);
      if (sh > 0) res = over(res, [sh, 0]);
      if (sdE(X, Y, lx, lampY - u * 0.018, u * 0.020, u * 0.020) < 0) res = over(res, [1, 0]);
    }
    if (Y > baseY - 2) {
      const wv = waveField(X, Y, baseY + u * 0.01, t, { gain: 0.5, amp: u * 0.008, freq: 0.06, deep: u * 0.12 });
      if (wv > 0) res = over(res, [wv, 1]);
    }
    return res;
  });

  add('lantern', '#191008', ['#ffca7a', '#a8763a'], 12, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const sway = S(t, 1) * 0.10, lx = S(t, 1) * u * 0.03, ly = u * 0.42;
    const g = glow(sdC(X, Y, lx, ly, 0), u * 0.155) * 0.36 * (0.6 + 0.8 * fbm(X * 0.3, Y * 0.3, 2));
    let res = g > 0.16 ? [g, 0, 0.9] : 0;
    if (Math.abs(X - lx) < u * 0.3 && Math.abs(Y - ly) < u * 0.35) {
      const rx = u * 0.135, ry = u * 0.16;
      const sdLant = (px, py) => {
        let d = sdE(px, py, lx, ly, rx, ry);
        d = Math.min(d, sdBox(px, py, lx, ly - ry - u * 0.012, u * 0.035, u * 0.012));
        d = Math.min(d, sdBox(px, py, lx, ly + ry + u * 0.012, u * 0.030, u * 0.012));
        d = Math.min(d, sdSeg(px, py, lx, ly - ry - u * 0.02, lx, u * 0.04) - u * 0.003);
        d = Math.min(d, sdSeg(px, py, lx, ly + ry + u * 0.02, lx + S(t, 1) * u * 0.01, ly + ry + u * 0.07) - u * 0.004);
        return d;
      };
      const sh = shade(sdLant, X, Y, -0.5 + sway, -0.8);
      if (sh > 0) {
        const ribA = Math.atan2(Y - ly, (X - lx) * (ry / rx));
        const rib = 0.78 + 0.22 * Math.abs(Math.sin(ribA * 7));
        const body = sdE(X, Y, lx, ly, rx, ry) < 0 ? rib : 1;
        res = over(res, [clamp(sh * body * 1.1, 0, 1), 0]);
      }
    }
    const emb = drift(X, Y, t, { gain: 0.18, thresh: 0.91, speed: 2, windY: -1 });
    if (emb > 0) res = over(res, [emb, 1]);
    return res;
  });

  add('balloon', '#2f6bd6', ['#ffd9c9', '#e85a4a'], 16, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const bx = S(t, 1) * u * 0.05, by = u * 0.34 + S(t, 2, 0.3) * u * 0.012;
    let res = 0;
    const cl = fbm(X * 0.10 + t * 1.2, Y * 0.20, 4);
    if (cl > 0.56 && Y > u * 0.5) res = [ss(0.56, 0.80, cl) * 0.5, 0];
    if (Math.abs(X - bx) < u * 0.34 && Math.abs(Y - by) < u * 0.40) {
      const rx = u * 0.16, ry = u * 0.185;
      const sdBal = (px, py) => {
        let d = sdE(px, py, bx, by, rx, ry);
        d = Math.min(d, sdBox(px, py, bx, by + ry + u * 0.065, u * 0.038, u * 0.026));
        d = Math.min(d, sdSeg(px, py, bx - rx * 0.55, by + ry * 0.75, bx - u * 0.030, by + ry + u * 0.045) - u * 0.004);
        d = Math.min(d, sdSeg(px, py, bx + rx * 0.55, by + ry * 0.75, bx + u * 0.030, by + ry + u * 0.045) - u * 0.004);
        return d;
      };
      const dE = sdE(X, Y, bx, by, rx, ry);
      const sh = shade(sdBal, X, Y, -0.55, -0.75);
      if (sh > 0) {
        let ink = 0, boost = 1;
        if (dE < 0) {
          const bandA = Math.atan2(Y - by, (X - bx) * (ry / rx) * 1.0);
          ink = Math.sin(bandA * 4 + TAU * 0) > 0 ? 1 : 0;
          boost = 0.95;
        }
        res = over(res, [clamp(sh * boost, 0, 1), ink]);
      }
    }
    return res;
  });

  add('kite', '#4a86e8', ['#fff3f0', '#e85a6a'], 12, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const kx = u * 0.06 + S(t, 1) * u * 0.06, ky = u * 0.30 + S(t, 2, 0.2) * u * 0.03;
    let res = 0;
    const cl = fbm(X * 0.12 + t * 1.4, Y * 0.22, 4);
    if (cl > 0.58) res = [ss(0.58, 0.82, cl) * 0.35, 0];
    const kw = u * 0.10, kh = u * 0.14;
    if (Math.abs(X - kx) < u * 0.5 && Y > ky - u * 0.2 && Y < u * 0.95) {
      const sdKite = (px, py) => {
        const dx = Math.abs(px - kx), dy = Math.abs(py - ky);
        return Math.max(dx / kw + dy / kh - 1, 0) * u * 0.1 - u * 0.004;
      };
      const sdK = sdKite(X, Y);
      if (sdK < 0.8) {
        const sh = shade(sdKite, X, Y, -0.5, -0.8);
        if (sh > 0) {
          const facet = (X - kx) * (Y - ky) > 0 ? 0 : 1;
          res = over(res, [sh, facet]);
        }
      }
      let px = kx, py = ky + kh;
      const sdTail = (qx, qy) => {
        let d = 1e9, bx2 = px, by2 = py;
        for (let s = 0; s < 7; s++) {
          const nx = px + S(t, 2, s * 0.4) * u * 0.035, ny = py + u * 0.052;
          d = Math.min(d, sdSeg(qx, qy, bx2, by2, nx, ny) - u * 0.004);
          if (s % 2 === 1) d = Math.min(d, sdC(qx, qy, (bx2 + nx) / 2, (by2 + ny) / 2, u * 0.009));
          bx2 = nx; by2 = ny;
        }
        return d;
      };
      const dT = sdTail(X, Y);
      if (dT < 0.8) {
        const sh = shade(sdTail, X, Y, -0.5, -0.7);
        if (sh > 0) res = over(res, [sh, 1]);
      }
      const sdStr = (qx, qy) => sdSeg(qx, qy, kx, ky + kh * 0.9, -cols * 0.30, u * 0.95) - u * 0.0025;
      if (sdStr(X, Y) < 0) res = over(res, [0.5, 0]);
    }
    return res;
  });

  add('paperplane', '#27436b', ['#f0f4fa', '#8fa6c9'], 12, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const px0 = S(t, 1) * u * 0.06, py0 = u * 0.40 + S(t, 2) * u * 0.04;
    const bank = S(t, 2, 0.25) * 0.12;
    let res = 0;
    for (let k = 0; k < 3; k++) {
      const wl = vnoise(X * (0.5 + k * 0.3) + t * (6 + k * 3) + k * 30, Y * 1.4 + k * 9);
      if (wl > 0.88) res = over(res, [ss(0.88, 0.97, wl) * (0.5 - k * 0.11), 1]);
    }
    const cb = Math.cos(bank), sb = Math.sin(bank);
    const LX = (X - px0) * cb - (Y - py0) * sb, LY = (X - px0) * sb + (Y - py0) * cb;
    if (Math.abs(LX) < u * 0.32 && Math.abs(LY) < u * 0.20) {
      const L = u * 0.23;
      const tri = (qx, qy, ax, ay, bx, by, cx, cy) => {
        const e = (x0, y0, x1, y1) => (qx - x0) * (y1 - y0) - (qy - y0) * (x1 - x0);
        return Math.max(e(ax, ay, bx, by), e(bx, by, cx, cy), e(cx, cy, ax, ay)) / (u * 0.24);
      };
      const sdUpper = (qx, qy) => tri(qx, qy, L, 0, -L, -L * 0.10, -L * 0.25, -L * 0.52);
      const sdLower = (qx, qy) => tri(qx, qy, L, 0, -L, -L * 0.10, -L * 0.18, L * 0.42);
      const dU = sdUpper(LX, LY), dL = sdLower(LX, LY);
      if (dU < 0.8 || dL < 0.8) {
        const shU = shade(sdUpper, LX, LY, -0.45, -0.85) * 1.35;
        const shL = shade(sdLower, LX, LY, -0.45, -0.85) * 0.85;
        if (dU <= dL && shU > 0) res = over(res, [shU, 0]);
        else if (shL > 0) res = over(res, [shL, 1]);
      }
    }
    const tr = vnoise(X * 0.8 + 60, Y * 2.2 - t * 8);
    if (tr > 0.93 && X < px0 - u * 0.1 && Math.abs(Y - py0) < u * 0.10) res = over(res, [ss(0.93, 0.98, tr) * 0.3, 1]);
    return res;
  });
})(typeof window !== 'undefined' ? window : globalThis);
