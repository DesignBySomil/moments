/* Batch 4: waves, jellyfish, butterfly, sunrise, train, windmill */
'use strict';
(function (root) {
  const H = root.__H, add = root.__addScene;
  const { TAU, clamp, lerp, ss, S, B, vnoise, fbm, sdC, sdE, sdBox, sdSeg, shade, glow, over, drift, hash, getBake, sampleBake } = H;
  const tri = (qx, qy, ax, ay, bx, by, cx, cy, nrm) => {
    const e = (x0, y0, x1, y1) => (qx - x0) * (y1 - y0) - (qy - y0) * (x1 - x0);
    return Math.max(e(ax, ay, bx, by), e(bx, by, cx, cy), e(cx, cy, ax, ay)) / nrm;
  };

  add('waves', '#050f1e', ['#cfe8ff', '#3d6ca8'], 12, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    if (Y < u * 0.16) {
      const s = drift(X, Y, t, { gain: 0.16, thresh: 0.92, speed: 0.8 });
      if (s > 0) res = [s, 1];
    }
    // ocean swell in perspective: longer, taller, brighter bands toward the viewer
    for (let L = 0; L < 4; L++) {
      const baseY = u * (0.30 + L * 0.115 + L * L * 0.028);
      if (baseY > u * 0.98) continue;
      const k = 0.052 - L * 0.011;
      const amp = u * (0.012 + L * 0.009);
      const sp = 0.55 + L * 0.18, ph = L * 1.7;
      const p = ph + X * k;
      const w1 = S(t, sp, p);
      const w2 = S(t, sp * 2.3, p * 1.9 + 0.6);
      const asym = Math.sign(w1) * Math.pow(Math.abs(w1), 1.6);  // peaked crests, broad troughs
      const yl = baseY + amp * (asym * 0.8 + 0.2 * w2 * (0.4 + L * 0.2));
      const d = Y - yl;
      const depth = u * (0.06 + L * 0.045);
      if (d < -u * 0.012 || d > depth) continue;
      const bright = 0.55 + L * 0.22;
      const lineCore = glow(Math.abs(d + u * 0.0015), u * 0.0028);
      const lineHalo = glow(Math.abs(d + u * 0.0015), u * 0.011) * 0.5;
      const face = ss(depth, u * 0.004, d) * (0.10 + L * 0.09);
      const peak = ss(0.35, 0.9, w1);
      const foamTex = vnoise(X * 1.3, Y * 1.6 + t * 4 + L * 7);
      const foam = (L >= 2 && d < u * 0.008 && d > -u * 0.012) ? peak * ss(0.40, 0.68, foamTex) * 0.75 : 0;
      const line = (lineCore + lineHalo) * bright;
      const v = Math.max(line, face) + foam;
      const ink = (lineCore * bright > 0.5 || foam > 0.3) ? 0 : 1;
      if (v > 0.03 && (!res || v > res[0])) res = [clamp(v, 0, 1), ink];
    }
    return res;
  });

  add('jellyfish', '#06182e', ['#a8e0ff', '#e8f6ff', '#ff9ad5'], 12, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const parts = drift(X, Y, t, { scale: 0.5, thresh: 0.90, gain: 0.30, speed: 1.2, windY: -1.5 });
    if (parts > 0) res = [parts, 0];
    const cx = S(t, 1) * u * 0.03, cy = u * 0.34 + S(t, 2, 0.2) * u * 0.02;
    const pulse = 1 + 0.05 * S(t, 2);
    const rx = u * 0.125 * pulse, ry = u * 0.115 * (2 - pulse);
    const dx = X - cx, dy = Y - cy;
    // bell: dome above a scalloped lower rim
    const bellD = sdE(dx, dy, 0, 0, rx, ry);
    const rimY = ry * (0.18 + 0.14 * Math.sin(dx / rx * 8 + TAU * t * 2));
    const inBell = bellD < 0 && dy < rimY;
    const inSkirt = dy >= rimY && dy < ry * 0.34 && Math.abs(dx) < rx * 0.92 * (1 - dy / (ry * 0.5));
    if (inBell || inSkirt) {
      let v = 0.55 + 0.22 * ss(0, -ry, dy);              // brighter toward crown
      v += 0.45 * glow(Math.abs(bellD), u * 0.006);       // luminous rim
      v += 0.15 * glow(sdC(dx, dy, -rx * 0.3, -ry * 0.35, rx * 0.4), rx * 0.35); // off-center sheen
      if (inSkirt) v *= 0.55;
      // inner organs: four soft horseshoe dots in the lower dome
      for (let k = 0; k < 4; k++) {
        const ox = (k - 1.5) * rx * 0.38, oy = ry * 0.02;
        if (sdC(dx, dy, ox, oy, u * 0.010) < 0) { v *= 0.55; }
      }
      res = over(res, [clamp(v, 0, 1), 1]);
    }
    // oral arms: two bright central ribbons
    for (const k of [-0.5, 0.5]) {
      const bx = cx + k * rx * 0.35, len = u * 0.20;
      const rel = Y - (cy + ry * 0.2);
      if (rel > 0 && rel < len) {
        const wob = Math.sin(rel * 1.6 / (u * 0.05) * 0.35 + TAU * t * 1.5 + k * 4) * u * 0.008 * (0.4 + rel / len);
        const d = Math.abs(X - bx - wob) - u * 0.005;
        const v = glow(d, u * 0.0035) * (1 - rel / len) * 0.9;
        if (v > 0.06) res = over(res, [clamp(v, 0, 1), 1]);
      }
    }
    // tentacles: five long fading strands
    for (let k = -2; k <= 2; k++) {
      if (k === 0) continue;
      const bx = cx + k * rx * 0.34, len = u * (0.30 + 0.04 * hash(k, 3));
      const rel = Y - (cy + ry * 0.25);
      if (rel > 0 && rel < len) {
        const wob = Math.sin(rel / (u * 0.09) + TAU * t * 1.2 + k * 1.7) * u * 0.022 * (0.3 + rel / len);
        const d = Math.abs(X - bx - wob) - u * 0.0020;
        const v = glow(d, u * 0.0022) * (1 - rel / len) * 0.65;
        if (v > 0.06) res = over(res, [clamp(v, 0, 1), 0]);
      }
    }
    return res;
  }, { bloom: true });

  add('butterfly', '#150a20', ['#ffb3d9', '#c77ae8', '#f5f0ff'], 10, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const motes = drift(X, Y, t, { gain: 0.22, thresh: 0.90, speed: 0.8, twinkle: 2 });
    if (motes > 0) res = [motes, 1];
    const cx = S(t, 0.5, 5) * u * 0.05, cy = u * 0.44 + S(t, 2.2) * u * 0.02;
    const flap = Math.abs(Math.sin(TAU * t * 4));
    const open = 0.35 + 0.65 * flap;
    const rotEll = (px, py, wx, wy, ang, wrx, wry) => {
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const qx = (px - wx) * ca + (py - wy) * sa;
      const qy = -(px - wx) * sa + (py - wy) * ca;
      return sdE(qx, qy, 0, 0, wrx, wry);
    };
    for (let s = -1; s <= 1; s += 2) {
      const specs = [
        [s * (u * 0.016 + u * 0.058 * open), -u * 0.038, u * (0.020 + 0.048 * open), u * 0.046, s * 0.55],
        [s * (u * 0.012 + u * 0.042 * open),  u * 0.038, u * (0.014 + 0.032 * open), u * 0.034, -s * 0.42]
      ];
      for (let i = 0; i < 2; i++) {
        const [ox, oy, wrx, wry, ang] = specs[i];
        const dW = rotEll(X, Y, cx + ox, cy + oy, ang, wrx, wry);
        if (dW < 0.8) {
          const rim = ss(-u * 0.006, u * 0.001, dW);
          const core = ss(0, -u * 0.030, dW);
          let v = glow(dW, u * 0.006) * (1 - 0.28 * rim) * (0.85 + 0.55 * core);
          let ink = rim > 0.5 ? 1 : 0;
          if (dW < 0) v += 0.30 * glow(sdC(X, Y, cx + ox * 0.35, cy + oy * 0.35, 0), u * 0.030);
          if (i === 0 && dW < 0) {
            const spotD = Math.min(
              sdC(X, Y, cx + ox + s * wrx * 0.45, cy + oy - wry * 0.35, u * 0.006),
              sdC(X, Y, cx + ox + s * wrx * 0.62, cy + oy + wry * 0.05, u * 0.005));
            if (spotD < 0) { v = 1.45; ink = 2; }
          }
          if (v > 0.06) res = over(res, [clamp(v, 0, 1.7), ink]);
        }
      }
    }
    const dBo = sdSeg(X, Y, cx, cy - u * 0.048, cx, cy + u * 0.052) - u * 0.009;
    if (dBo < 0.6) { const v = glow(dBo, u * 0.003) * 1.3; if (v > 0.06) res = over(res, [clamp(v, 0, 1.5), 2]); }
    for (let s = -1; s <= 1; s += 2) {
      const dA = sdSeg(X, Y, cx, cy - u * 0.045, cx + s * u * 0.020, cy - u * 0.075);
      if (dA < 0.5) { const v = glow(dA, 0.5) * 0.7; if (v > 0.06) res = over(res, [clamp(v, 0, 1), 1]); }
      if (sdC(X, Y, cx + s * u * 0.020, cy - u * 0.075, u * 0.004) < 0) res = over(res, [1.3, 2]);
    }
    return res;
  }, { bloom: true });

  add('sunrise', '#140a1e', ['#ffd9a0', '#ff9a5c'], 18, (x, y, t, cols, rows) => {
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
      if (sd < 0) res = over(res, [1.35 + 0.05 * clamp(-sd / (sr * 0.4), 0, 1), 0]);
      else { const g = glow(sd, u * 0.017) * (0.45 + rise * 0.45); if (g > 0.05) res = over(res, [clamp(g, 0, 0.9), 0, 0.9]); }
    }
    if (Y >= hor) {
      const depth = ss(0, u * 0.2, Y - hor);
      const tex = fbm(X * 0.2 + t * 1.5, Y * 0.35, 3);
      let v = 0.04 + 0.09 * depth + 0.06 * (tex - 0.5);
      const colW = u * 0.05 * (1 + depth * 1.4);
      const dxn = Math.abs(X - sx);
      if (dxn < colW) {
        const flick = 0.7 + 0.3 * vnoise(X * 1.2, Y * 2.2 - t * 5);
        v = Math.max(v, (1 - dxn / colW) * flick * (0.55 - depth * 0.28));
      }
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
  }, { bloom: true });

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
      let v = clamp(0.70 + 0.72 * (0.5 - (Y - boilY) / (boilR * 1.4)), 0.16, 1.2); // hot crown, dark belly
      v += 0.30 * ss(u * 0.010, 0, Math.abs(Y - (boilY - boilR * 0.72)) * (dB < 0 ? 1 : 0)); // crown rim stripe
      if (v > 0.04 && dB < 0.9) res = over(res, [clamp(v, 0, 1), 1]);
    }
    // smokebox: front disc, darker with lit rim
    const dN = sdE(X, Y, noseX, boilY, u * 0.026, boilR * 0.94);
    if (dN < 0.9) {
      let v = 0.30 + 0.55 * ss(0, -u * 0.012, dN) * ss(-0.9, 0.6, (Y - boilY) / boilR);
      res = over(res, [clamp(v, 0, 1), 1]);
    }
    // headlamp: warm lamp at the nose with glow
    const dHL = sdC(X, Y, noseX + u * 0.004, boilY - boilR * 0.55, u * 0.012);
    if (dHL < 0) res = over(res, [1.1, 0]);
    res = over(res, [clamp(glow(dHL, u * 0.020) * 0.5, 0, 1), 0]);
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
      let v = clamp(0.72 - 0.55 * ss(cabY - u * 0.08, cabY + u * 0.09, Y), 0.18, 1);
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
        if (sh > 0) res = over(res, [clamp(sh * 0.95 + 0.08, 0, 1), 1]);
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

  add('windmill', '#0e1a2c', ['#f0e8d8', '#a8b8d0'], 14, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const gy = u * 0.82, tx = 0, hubY = u * 0.37, bladeL = u * 0.19;
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
        let v = (0.72 - 0.42 * ss(-hw, hw, X - tx)) * m;
        v += 0.12 * ss(u * 0.012, 0, Math.abs(X - (tx - hw * 0.92))) * m;
        if (sdE(X, Y, tx, gy - u * 0.008, u * 0.016, u * 0.026) < 0) v *= 0.15;
        else if (sdBox(X, Y, tx, hubY + (gy - hubY) * 0.45, u * 0.009, u * 0.012) < 0) v *= 0.25;
        res = over(res, [clamp(v, 0, 1), 1]);
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
