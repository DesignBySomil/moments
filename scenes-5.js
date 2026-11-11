/* Batch 5: pendulum, fireflies, aurora, umbrella, swing, sprout */
'use strict';
(function (root) {
  const H = root.__H, add = root.__addScene;
  const { TAU, clamp, lerp, ss, S, B, vnoise, fbm, sdC, sdE, sdBox, sdSeg, sdVesica, shade, glow, over, drift, hash, getBake, sampleBake } = H;

  add('pendulum', '#101018', ['#d8d4e8', '#8a86a0'], 8, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const px0 = 0, py0 = u * 0.16, L = u * 0.52, ang = S(t, 1) * 0.42;
    const bx = px0 + Math.sin(ang) * L, by = py0 + Math.cos(ang) * L;
    let res = 0;
    const amb = drift(X, Y, t, { gain: 0.12, thresh: 0.92, speed: 0.8 });
    if (amb > 0) res = [amb, 1];
    const trailA = Math.atan2(X - px0, Y - py0);
    const trailR = Math.hypot(X - px0, Y - py0);
    if (Math.abs(trailR - L) < u * 0.004 && Math.abs(trailA) < 0.45 && Y > py0) res = over(res, [0.22, 1]);
    if (Math.abs(X) < u * 0.30 && Y > py0 - u * 0.1 && Y < by + u * 0.12) {
      const sdPend = (qx, qy) => Math.min(
        sdSeg(qx, qy, px0, py0, bx, by) - u * 0.006,
        sdC(qx, qy, bx, by, u * 0.052),
        sdBox(qx, qy, px0, py0 - u * 0.012, u * 0.05, u * 0.012));
      const sh = shade(sdPend, X, Y, -0.55, -0.8);
      if (sh > 0) res = over(res, [sh, 0]);
      const glint = glow(sdC(X, Y, bx - u * 0.018, by - u * 0.018, u * 0.008), 1.2);
      if (sdC(X, Y, bx, by, u * 0.052) < 0 && glint > 0.1) res = over(res, [clamp(0.5 + glint * 0.5, 0, 1), 0]);
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
      const fw = u * 0.40, fh = u * 0.50, cy = u * 0.52;
      const dx = X, dy = Y - cy;
      if (Math.abs(dx) <= fw * 1.15 && Math.abs(dy) <= fh) {
        let sx = dx / (fw * 2) + 0.5, sy = dy / (fh * 2) + 0.5;
        // sway: rotate sample around rope anchor near bake top-center
        const a = 0.05 * S(t, 1.1);
        const ax = 0.5, ay = 0.02;
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
    const bk = getBake('sprout');
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    if (bk) {
      const br = 1 + 0.02 * S(t, 0.9);
      const fw = u * 0.34 * br, fh = u * 0.42 * br, cy = u * 0.54;
      const dx = X, dy = Y - cy;
      if (Math.abs(dx) <= fw && Math.abs(dy) <= fh) {
        const sx = dx / (fw * 2) + 0.5, sy = dy / (fh * 2) + 0.5;
        const eg = ss(0, 0.08, sx) * ss(1, 0.92, sx) * ss(0, 0.06, sy) * ss(1, 0.94, sy);
        const v0 = sampleBake(bk, sx * (bk.w - 1), sy * (bk.h - 1)) * eg;
        if (v0 > 0.04) res = over(res, [clamp(v0 * 1.2, 0, 1), v0 > 0.6 ? 1 : 0]);
      }
    }
    return res;
  });
})(typeof window !== 'undefined' ? window : globalThis);
