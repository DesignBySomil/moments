/* Batch 5: pendulum, fireflies, aurora, umbrella, swing, sprout */
'use strict';
(function (root) {
  const H = root.__H, add = root.__addScene;
  const { TAU, clamp, lerp, ss, S, B, vnoise, fbm, sdC, sdE, sdBox, sdSeg, sdVesica, shade, glow, over, drift, hash, getBake, sampleBake } = H;

  add('pendulum', '#101018', ['#d8d4e8', '#8a86a0'], 8, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const px0 = 0, py0 = u * 0.14, L = u * 0.50, ang = S(t, 1) * 0.42;
    const bx = px0 + Math.sin(ang) * L, by = py0 + Math.cos(ang) * L;
    let res = 0;
    const trailA = Math.atan2(X - px0, Y - py0);
    const trailR = Math.hypot(X - px0, Y - py0);
    if (Math.abs(trailR - L) < u * 0.004 && Math.abs(trailA) < 0.45 && Y > py0) res = over(res, [0.22, 1]);
    if (Math.abs(X) < u * 0.30 && Y > py0 - u * 0.1 && Y < by + u * 0.12) {
      const gbx = px0 + Math.sin(ang * 0.55) * L, gby = py0 + Math.cos(ang * 0.55) * L;
      const dg = sdC(X, Y, gbx, gby, u * 0.068);
      if (dg < 0) res = over(res, [0.22, 0]);
      const sdPend = (qx, qy) => Math.min(
        sdSeg(qx, qy, px0, py0, bx, by) - u * 0.013,
        sdC(qx, qy, bx, by, u * 0.068),
        sdBox(qx, qy, px0, py0 - u * 0.014, u * 0.06, u * 0.014));
      const sh = shade(sdPend, X, Y, -0.55, -0.8);
      if (sh > 0) res = over(res, [sh, 0]);
      const glint = glow(sdC(X, Y, bx - u * 0.024, by - u * 0.024, u * 0.010), 1.2);
      if (sdC(X, Y, bx, by, u * 0.068) < 0 && glint > 0.1) res = over(res, [clamp(0.5 + glint * 0.5, 0, 1), 0]);
    }
    return res;
  });

  add('fireflies', '#0a120c', ['#d8ff9a', '#5f8a5a'], 14, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const bushY = u * 0.62 + fbm(X * 0.15, 5.5, 3) * u * 0.10;
    if (Y > bushY) {
      const blades = vnoise(X * 3.2, Y * 0.8) > 0.72 ? 0.35 : 0;
      res = over(res, [0.30 + blades + 0.15 * fbm(X * 0.8, Y * 0.8, 2), 1]);
    }
    const stars = drift(X, Y, t, { gain: 0.10, thresh: 0.93, speed: 0.5 });
    if (stars > 0) res = over(res, [stars, 1]);
    for (let k = 0; k < 14; k++) {
      const ph = hash(k, 3) * 10;
      const fx = (vnoise(k * 7.3, t * 0.6 + ph) - 0.5) * cols * 0.75;
      const fy = u * 0.15 + vnoise(k * 3.1 + 50, t * 0.5 + ph) * u * 0.55;
      const pulse = Math.pow(B(t, 1.5, hash(k, 8)), 3);
      if (pulse < 0.02) continue;
      const d = sdC(X, Y, fx, fy, u * 0.004);
      if (d < 3) {
        const v = glow(d, 1.1) * pulse;
        if (v > 0.05) res = over(res, [clamp(v * 1.3, 0, 1), 0]);
      }
    }
    return res;
  });

  add('aurora', '#060b1a', ['#7affc9', '#b47aff'], 16, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const st = drift(X, Y, t, { scale: 0.55, thresh: 0.88, gain: 0.4, speed: 0.3, twinkle: 2 });
    if (st > 0) res = [st, 0];
    if (Y < u * 0.72) {
      const warp = fbm(X * 0.045 + t * 0.4, 2.2, 3) * u * 0.5;
      for (let L = 0; L < 3; L++) {
        const bandY = u * (0.16 + L * 0.13) + warp * (0.5 + L * 0.3);
        const rays = fbm(X * (0.35 + L * 0.12) + t * (0.8 + L * 0.3), Y * 0.02 + L * 9, 3);
        const fall = ss(u * 0.75, u * 0.10, Math.abs(Y - bandY));
        const v = fall * ss(0.42, 0.75, rays) * (0.65 - L * 0.12);
        if (v > 0.04) res = over(res, [clamp(v * 1.3, 0, 1), L === 1 ? 1 : 0]);
      }
    }
    const ridgeY = u * 0.76 + fbm(X * 0.06, 3.3, 3) * u * 0.10;
    if (Y > ridgeY) res = over(res, [0.28 + 0.12 * fbm(X * 0.5, Y * 0.5, 2), 1]);
    return res;
  });

  add('umbrella', '#1c2430', ['#e8d8b0', '#7a8aa0'], 10, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const ux = 0, uy = u * 0.42, R = u * 0.24;
    let res = 0;
    const st = vnoise(X * 1.9, Y * 0.30 - t * 22);
    if (st > 0.865 && Y < uy - R * 0.2) res = over(res, [ss(0.865, 0.94, st) * 0.6, 1]);
    if (Math.abs(X) < R * 1.35 && Y > uy - R * 1.2 && Y < u * 0.92) {
      const sdUmbr = (px, py) => {
        let d = Math.max(sdE(px, py, ux, uy + R * 0.25, R, R * 0.62), -(py - uy));
        d = Math.min(d, sdSeg(px, py, ux, uy, ux, uy + u * 0.34) - u * 0.006);
        const hook = sdC(px, py, ux + u * 0.022, uy + u * 0.36, u * 0.020);
        d = Math.min(d, py > uy + u * 0.34 ? Math.abs(hook) - u * 0.006 : 1e9);
        d = Math.min(d, sdSeg(px, py, ux, uy - R * 0.60, ux, uy - R * 0.72) - u * 0.005);
        return d;
      };
      const sh = shade(sdUmbr, X, Y, -0.55, -0.75);
      if (sh > 0) {
        let v = sh;
        const canopy = sdE(X, Y, ux, uy + R * 0.25, R, R * 0.62) < 0 && Y < uy;
        if (canopy) {
          const ribA = Math.atan2(-(Y - uy), (X - ux));
          const rib = 0.80 + 0.20 * Math.abs(Math.sin(ribA * 4));
          v *= rib;
          const scallop = S((X - ux) / R * 3.2, 1) * 0.5 + 0.5;
          if (Y > uy - R * 0.10) v *= 0.75 + 0.25 * scallop;
        }
        res = over(res, [clamp(v, 0, 1), 0]);
      }
      for (let k = 0; k < 5; k++) {
        const dpx = ux - R * 0.85 + k * R * 0.42;
        const p = (t * 1.4 + hash(k, 6)) % 1;
        const dpy = uy + p * u * 0.30;
        const d = sdC(X, Y, dpx, dpy, u * 0.003);
        if (d < 1) { const v = glow(d, 0.8) * (1 - p) * 0.5; if (v > 0.07) res = over(res, [v, 1]); }
      }
    }
    if (Y > u * 0.88) {
      const rip = Math.abs(sdC(X, Y, S(t, 0.5) * u * 0.2, u * 0.93, ((t * 2) % 1) * u * 0.10));
      const rv = rip < u * 0.004 ? 0.35 * (1 - ((t * 2) % 1)) : 0;
      res = over(res, [0.16 + 0.12 * fbm(X * 0.5, Y * 0.6, 2) + rv, 1]);
    }
    return res;
  });

  add('swing', '#142030', ['#e8e0cc', '#7a94b0'], 12, (x, y, t, cols, rows) => {
    const bk = getBake('swing');
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const st = drift(X, Y, t, { scale: 0.5, thresh: 0.93, gain: 0.35, speed: 0.4, twinkle: 2 });
    if (st > 0) res = [st, 1];
    if (bk) {
      const fw = u * 0.30, fh = u * 0.32, cy = u * 0.50;
      const dx = X, dy = Y - cy;
      if (Math.abs(dx) <= fw * 1.08 && Math.abs(dy) <= fh) {
        let sx = dx / (fw * 2) + 0.5, sy = dy / (fh * 2) + 0.5;
        // sway: rotate sample around rope anchor (top of frame, where ropes leave)
        const a = 0.04 * S(t, 1.1);
        const ax = 0.77, ay = 0.0;
        const rx = sx - ax, ry = sy - ay;
        sx = ax + rx * Math.cos(a) + ry * Math.sin(a);
        sy = ay - rx * Math.sin(a) + ry * Math.cos(a);
        if (sx >= 0 && sx <= 1 && sy >= 0 && sy <= 1) {
          const eg = ss(0, 0.06, sx) * ss(1, 0.94, sx) * ss(0, 0.04, sy) * ss(1, 0.96, sy);
          const v0 = sampleBake(bk, sx * (bk.w - 1), sy * (bk.h - 1)) * eg;
          if (v0 > 0.04) res = over(res, [clamp(v0 * 1.2, 0, 1), 0]);
        }
      }
    }
    return res;
  });

  add('sprout', '#101a10', ['#a8e88a', '#e8f5d8'], 16, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    // soil mound
    const dMound = sdE(X, Y, 0, u * 1.04, u * 0.34, u * 0.20);
    if (dMound < 1.2) {
      const v = dMound <= 0 ? 0.20 + 0.14 * fbm(X * 1.1, Y * 1.1, 2) : glow(dMound, 0.8) * 0.18;
      if (v > 0.05) res = over(res, [clamp(v, 0, 1), 0]);
    }
    // stem with a gentle sway
    const sway = S(t, 0.9) * u * 0.012;
    const top = u * 0.58;
    const dStem = Math.min(sdSeg(X, Y, 0, u * 0.88, sway * 0.4, u * 0.74), sdSeg(X, Y, sway * 0.4, u * 0.74, sway, top));
    if (dStem < 1.4) { const v = glow(dStem, u * 0.005) * 0.85; if (v > 0.05) res = over(res, [clamp(v, 0, 1), 1]); }
    // two slender cotyledon leaves as bright rims with dark interiors, staggered in a V
    const leafDefs = [[1, 0, 0.75, -0.66], [-1, 0.075, 0.72, -0.69]];
    for (let k = 0; k < 2; k++) {
      const dir = leafDefs[k][0];
      const wig = 0.04 * S(t, 1.3, k * 2.2);
      let ux = dir * (leafDefs[k][2] + wig), uy = leafDefs[k][3];
      const ul = Math.hypot(ux, uy); ux /= ul; uy /= ul;
      const axX = sway * 0.7, axY = top + leafDefs[k][1] * u;
      const rL = u * 0.085, dL = u * 0.070;
      const hl = Math.sqrt(rL * rL - dL * dL) * 1.0;
      const cx2 = axX + ux * hl, cy2 = axY + uy * hl;
      const RY = (X - cx2) * ux + (Y - cy2) * uy, RX = -(X - cx2) * uy + (Y - cy2) * ux;
      const dLf = sdVesica(RX, RY, 0, 0, rL, dL);
      if (dLf < 1.8) {
        const rim = Math.exp(-Math.abs(dLf) / (u * 0.0055));
        const fillv = dLf < 0 ? 0.14 + 0.08 * ss(0.5, -0.9, dLf) : 0;
        const v = rim * 0.95 + fillv;
        if (v > 0.06) res = over(res, [clamp(v, 0, 1), 1]);
      }
    }
    // dew specks
    const g = drift(X, Y, t, { gain: 0.14, thresh: 0.93, speed: 1.5 });
    if (g > 0) res = over(res, [g, 1]);
    return res;
  });
})(typeof window !== 'undefined' ? window : globalThis);
