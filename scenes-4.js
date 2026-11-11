/* Batch 4: waves, jellyfish, butterfly, sunrise, train, windmill */
'use strict';
(function (root) {
  const H = root.__H, add = root.__addScene;
  const { TAU, clamp, lerp, ss, S, B, vnoise, fbm, sdC, sdE, sdBox, sdSeg, shade, glow, over, drift, hash } = H;
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
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const pulse = B(t, 2), jx = S(t, 1) * u * 0.04, jy = u * 0.32 + S(t, 2, 0.2) * u * 0.02;
    let res = 0;
    const parts = drift(X, Y, t, { scale: 0.5, thresh: 0.88, gain: 0.35, speed: 1.5, windY: -2 });
    if (parts > 0) res = [parts, 0];
    if (Math.abs(X - jx) < u * 0.34 && Y > jy - u * 0.22 && Y < u * 0.95) {
      const brx = u * (0.16 + pulse * 0.018), bry = u * (0.145 - pulse * 0.012);
      const sdBell = (px, py) => Math.max(sdE(px, py, jx, jy, brx, bry), (py - jy) / 2);
      const dB = sdBell(X, Y);
      if (dB < 1) {
        const sh = shade(sdBell, X, Y, -0.55, -0.7);
        if (sh > 0) {
          const ribA = Math.atan2(Y - jy, (X - jx) * (bry / brx));
          const rib = 0.80 + 0.20 * Math.abs(Math.sin(ribA * 6));
          res = over(res, [clamp(sh * rib * 1.15, 0, 1), 1]);
        }
      }
      const sdArms = (px, py) => {
        let d = 1e9;
        for (let k = 0; k < 4; k++) {
          const ax = jx - brx * 0.55 + k * brx * 0.36;
          let x0 = ax, y0 = jy + bry * 0.15;
          for (let s = 0; s < 4; s++) {
            const x1 = ax + S(t, 2, k * 0.6 + s * 0.35) * u * 0.02 * (s + 1) * 0.5, y1 = y0 + u * 0.030;
            d = Math.min(d, sdSeg(px, py, x0, y0, x1, y1) - u * 0.008);
            x0 = x1; y0 = y1;
          }
        }
        for (let k = 0; k < 5; k++) {
          const ax = jx - brx * 0.85 + k * brx * 0.42;
          let x0 = ax, y0 = jy + bry * 0.1;
          for (let s = 0; s < 6; s++) {
            const x1 = ax + S(t, 1.6, k * 0.9 + s * 0.3) * u * 0.028 * (s + 1) * 0.45, y1 = y0 + u * 0.042;
            d = Math.min(d, sdSeg(px, py, x0, y0, x1, y1) - u * 0.0032);
            x0 = x1; y0 = y1;
          }
        }
        return d;
      };
      const dA = sdArms(X, Y);
      if (dA < 0.8) {
        const sh = shade(sdArms, X, Y, -0.5, -0.7);
        if (sh > 0) res = over(res, [sh * 0.85, 0]);
      }
      const g = glow(dB, u * 0.05) * 0.25;
      if (dB > 0 && g > 0.05) res = over(res, [g, 1, 0.7]);
    }
    return res;
  });

  add('butterfly', '#2a1840', ['#ffb3d9', '#c77ae8'], 10, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const bx = S(t, 1) * u * 0.05, by = u * 0.42 + S(t, 2) * u * 0.03;
    const flap = 0.30 + 0.70 * Math.abs(Math.cos(S(t, 4) * 1.35));
    let res = 0;
    const amb = drift(X, Y, t, { gain: 0.18, thresh: 0.91, speed: 1.5 });
    if (amb > 0) res = [amb, 1];
    if (Math.abs(X - bx) < u * 0.45 && Math.abs(Y - by) < u * 0.35) {
      const sdFly = (px, py) => {
        let d = sdSeg(px, py, bx, by - u * 0.06, bx, by + u * 0.075) - u * 0.010;
        d = Math.min(d, sdC(px, py, bx, by - u * 0.075, u * 0.013));
        d = Math.min(d, sdSeg(px, py, bx, by - u * 0.085, bx - u * 0.03, by - u * 0.13) - u * 0.0025,
          sdSeg(px, py, bx, by - u * 0.085, bx + u * 0.03, by - u * 0.13) - u * 0.0025);
        for (const sgn of [-1, 1]) {
          const wx = bx + sgn * u * 0.17 * flap, wxx = bx + sgn * u * 0.02;
          d = Math.min(d, sdE(px, py, (wx + wxx) / 2 + sgn * u * 0.09 * flap, by - u * 0.105, u * 0.20 * flap, u * 0.135));
          d = Math.min(d, sdE(px, py, (wx + wxx) / 2 + sgn * u * 0.075 * flap, by + u * 0.085, u * 0.15 * flap, u * 0.092));
        }
        return d;
      };
      const sh = shade(sdFly, X, Y, -0.5, -0.8);
      if (sh > 0) {
        const onWing = Math.abs(X - bx) > u * 0.02;
        let v = sh;
        if (onWing) {
          const spot = fbm(X * 0.55 + 3, Y * 0.55, 3);
          v *= 0.62 + 0.55 * ss(0.35, 0.75, spot);
          v *= 0.78 + 0.22 * Math.abs(Math.sin(Math.atan2(Y - by, X - bx) * 6));
        }
        res = over(res, [clamp(v, 0, 1), onWing ? 0 : 1]);
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
    const skyV = (0.34 - skyT * 0.26) * (0.7 + 0.5 * band) * (0.5 + rise * 0.8);
    if (skyV > 0.04 && Y < hor) res = [skyV, 1];
    const sd = sdC(X, Y, sx, sy, sr);
    if (Y < hor + 1) {
      if (sd < 0) res = over(res, [0.85 + 0.15 * clamp(-sd / (sr * 0.5), 0, 1), 0]);
      else { const g = glow(sd, u * 0.10) * (0.35 + rise * 0.35); if (g > 0.05) res = over(res, [clamp(g, 0, 0.9), 0, 0.9]); }
    }
    if (Y >= hor) {
      const depth = ss(0, u * 0.2, Y - hor);
      const tex = fbm(X * 0.2 + t * 1.5, Y * 0.35, 3);
      let v = 0.16 + 0.4 * depth + 0.2 * (tex - 0.5);
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
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const gy = u * 0.72;
    if (Y > gy + u * 0.01) {
      const tie = ((X * 0.8 + t * 120) % 5 + 5) % 5 < 1.1 && Y < gy + u * 0.05 ? 0.35 : 0;
      return [0.22 + tie + 0.10 * fbm(X * 0.7, Y * 0.7, 2), 1];
    }
    const wr = u * 0.052, wy = gy - wr, spd = TAU * t * 3;
    if (Y > u * 0.30 && Math.abs(X) < u * 0.5) {
      const crank = sdC(X, Y, 0, 0, 0) * 0;
      const sdTrain = (px, py) => {
        let d = sdBox(px, py, -u * 0.10, wy - u * 0.085, u * 0.26, u * 0.075);
        d = Math.min(d, sdBox(px, py, u * 0.20, wy - u * 0.15, u * 0.085, u * 0.14));
        d = Math.min(d, sdSeg(px, py, -u * 0.30, wy - u * 0.19, -u * 0.30, wy - u * 0.10) - u * 0.016);
        d = Math.min(d, sdE(px, py, -u * 0.06, wy - u * 0.165, u * 0.020, u * 0.012));
        d = Math.min(d, tri(px, py, -u * 0.42, wy, -u * 0.34, wy, -u * 0.34, wy - u * 0.05, u * 0.2));
        for (const wxp of [-u * 0.22, -u * 0.06, u * 0.10]) {
          d = Math.min(d, Math.abs(sdC(px, py, wxp, wy, wr)) - u * 0.008);
          d = Math.min(d, sdC(px, py, wxp, wy, u * 0.012));
          for (let k = 0; k < 6; k++) {
            const a = spd + k * TAU / 6;
            d = Math.min(d, sdSeg(px, py, wxp, wy, wxp + Math.cos(a) * wr * 0.85, wy + Math.sin(a) * wr * 0.85) - u * 0.003);
          }
        }
        d = Math.min(d, sdC(px, py, u * 0.26, wy, u * 0.038) * 1, sdC(px, py, u * 0.30, wy, u * 0.030));
        const rodY = wy + Math.sin(spd) * wr * 0.4;
        d = Math.min(d, sdSeg(px, py, -u * 0.22, rodY, u * 0.10, rodY) - u * 0.006);
        return d;
      };
      const sh = shade(sdTrain, X, Y, -0.5, -0.8);
      if (sh > 0) {
        let v = sh;
        if (sdE(X, Y, u * 0.20, wy - u * 0.19, u * 0.035, u * 0.03) < 0) v = Math.max(v, 0.95);
        return [v, 0];
      }
      for (let k = 0; k < 5; k++) {
        const p = (t * 1.2 + k / 5) % 1;
        const sx2 = -u * 0.30 + S(t, 2, k) * u * 0.02 - p * u * 0.10, sy2 = wy - u * 0.22 - p * u * 0.16;
        const d = sdC(X, Y, sx2, sy2, u * (0.014 + p * 0.022));
        if (d < 1) { const v = glow(d, 1.0) * (1 - p) * 0.55; if (v > 0.06) return over(0, [v, 1]); }
      }
    }
    const pole = ((X * 0.5 + t * 90) % 40 + 40) % 40;
    if (pole < 1.2 && Y > u * 0.30 && Y < gy) return [0.4, 1];
    return 0;
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
