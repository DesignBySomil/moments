/* Batch 5: pendulum, fireflies, aurora, umbrella, swing, sprout */
'use strict';
(function (root) {
  const H = root.__H, add = root.__addScene;
  const { TAU, clamp, lerp, ss, S, B, vnoise, fbm, sdC, sdE, sdBox, sdSeg, sdVesica, shade, glow, over, drift, hash, getBake, sampleBake } = H;

  add('pendulum', '#101018', ['#d8d4e8', '#8a86a0'], 8, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const px0 = 0, py0 = u * 0.12, L = u * 0.52, ang = S(t, 1) * 0.26;
    const bx = px0 + Math.sin(ang) * L, by = py0 + Math.cos(ang) * L;
    let res = 0;
    const trailA = Math.atan2(X - px0, Y - py0);
    const trailR = Math.hypot(X - px0, Y - py0);
    if (Math.abs(trailR - L) < u * 0.0035 && Math.abs(trailA) < 0.30 && Y > py0) res = over(res, [0.20, 1]);
    const gbx = px0 + Math.sin(ang * 0.55) * L, gby = py0 + Math.cos(ang * 0.55) * L;
    if (sdC(X, Y, gbx, gby, u * 0.075) < 0) res = over(res, [0.18, 0]);
    const dBr = sdBox(X, Y, px0, py0 - u * 0.016, u * 0.055, u * 0.016);
    if (dBr < 0.8) {
      const m = ss(0.8, -0.5, dBr);
      const v = (0.95 - 0.5 * ss(-u * 0.055, u * 0.055, X - px0)) * m;
      if (v > 0.05) res = over(res, [clamp(v, 0, 1), 0]);
    }
    const rodXatY = px0 + Math.sin(ang) * (Y - py0);
    const along = (Y - py0) / L;
    const dRod = sdSeg(X, Y, px0, py0, bx, by) - u * 0.015;
    if (dRod < 0.7 && along > 0 && along < 1) {
      const m = ss(0.7, -0.4, dRod);
      const v = (0.42 + 0.58 * ss(u * 0.017, -u * 0.013, X - rodXatY)) * m;
      if (v > 0.05) res = over(res, [clamp(v, 0, 1), 0]);
    }
    const rB = u * 0.078;
    const dBob = sdC(X, Y, bx, by, rB);
    if (dBob < 0.9) {
      const m = ss(0.9, -0.6, dBob);
      const q = ((X - bx) * 0.62 + (Y - by) * 0.72) / rB;
      let v = (1.05 - 0.85 * ss(-0.9, 1.0, q)) * m;
      v += 0.65 * glow(sdC(X, Y, bx - rB * 0.34, by - rB * 0.36, rB * 0.18), u * 0.012) * m;
      if (v > 0.05) res = over(res, [clamp(v, 0, 1), 0]);
    }
    return res;
  });

  add('fireflies', '#0a120c', ['#d8ff9a', '#5f8a5a'], 14, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    // distant tree line silhouette
    const treeY = u * 0.34 + fbm(X * 0.10, 9.1, 3) * u * 0.12;
    if (Y > treeY && Y < u * 0.66) {
      const tr = fbm(X * 0.5, Y * 0.5, 2);
      res = over(res, [0.10 + 0.10 * tr, 1]);
    }
    const bushY = u * 0.62 + fbm(X * 0.15, 5.5, 3) * u * 0.10;
    if (Y > bushY) {
      const blades = vnoise(X * 3.2, Y * 0.8) > 0.72 ? 0.35 : 0;
      res = over(res, [0.30 + blades + 0.15 * fbm(X * 0.8, Y * 0.8, 2), 1]);
    }
    // individual foreground grass blades with lit tips
    for (let k = 0; k < 9; k++) {
      const bx0 = (hash(k, 31) - 0.5) * cols * 0.9;
      const bh = u * (0.10 + hash(k, 33) * 0.10);
      const lean = (hash(k, 35) - 0.5) * u * 0.06 + S(t, 0.9, hash(k, 37) * 9) * u * 0.008;
      const dBl = sdSeg(X, Y, bx0, u * 1.0, bx0 + lean, u * 1.0 - bh) - u * 0.0028;
      if (dBl < 0.5) res = over(res, [0.34, 1]);
      if (sdC(X, Y, bx0 + lean, u * 1.0 - bh, u * 0.004) < 0.5) res = over(res, [0.55, 0]);
    }
    const stars = drift(X, Y, t, { gain: 0.10, thresh: 0.93, speed: 0.5 });
    if (stars > 0) res = over(res, [stars, 1]);
    // fireflies in 3 depth layers; k=0 is the hero
    for (let k = 0; k < 16; k++) {
      const ph = hash(k, 3) * 10;
      const layer = k === 0 ? 2 : (k < 6 ? 1 : 0);
      const fx = (vnoise(k * 7.3, t * (0.4 + layer * 0.15) + ph) - 0.5) * cols * (layer === 2 ? 0.5 : 0.75);
      const fy = u * (0.15 + vnoise(k * 3.1 + 50, t * 0.5 + ph) * (layer === 0 ? 0.40 : 0.60));
      const pulse = Math.pow(B(t, 1.5, hash(k, 8)), 2);
      if (pulse < 0.02) continue;
      const rr = layer === 2 ? u * 0.022 : (layer === 1 ? u * 0.010 : u * 0.005);
      const d = sdC(X, Y, fx, fy, rr);
      if (d < 5.5) {
        const v = glow(d, layer === 2 ? 3.0 : (layer === 1 ? 2.0 : 1.3)) * pulse;
        if (v > 0.05) res = over(res, [clamp(v * 1.5, 0, 1), 0]);
      }
      if (layer === 2 && pulse > 0.3) {
        // hero: tiny body with wing hint inside the glow
        if (sdE(X, Y, fx, fy - rr * 0.9, u * 0.005, u * 0.009) < 0) res = over(res, [0.12, 0]);
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
        const v = fall * ss(0.42, 0.75, rays) * (0.80 - L * 0.13);
        if (v > 0.04) res = over(res, [clamp(v * 1.45, 0, 1), L === 1 ? 1 : 0]);
      }
    }
    const ridgeY = u * 0.76 + fbm(X * 0.06, 3.3, 3) * u * 0.10;
    if (Y > ridgeY) res = over(res, [0.28 + 0.12 * fbm(X * 0.5, Y * 0.5, 2), 1]);
    return res;
  });

  add('umbrella', '#131a26', ['#e8d8b0', '#7a8aa0'], 10, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    const ux = 0, uy = u * 0.42, R = u * 0.19;
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
        let v = clamp(sh * 1.2, 0, 1);
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
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const st = drift(X, Y, t, { scale: 0.5, thresh: 0.93, gain: 0.35, speed: 0.4, twinkle: 2 });
    if (st > 0) res = [st, 1];
    // moon with halo, upper right
    const mx = u * 0.115, my = u * 0.15;
    const dM = sdC(X, Y, mx, my, u * 0.045);
    if (dM < 7) { const v = glow(dM, 3.2); if (v > 0.04) res = over(res, [clamp(v, 0, 1) * 0.8, 0]); }
    if (dM < 0) {
      let v = 0.95 - 0.25 * ss(-u * 0.045, 0, (X - mx) + (Y - my));
      if (sdC(X, Y, mx + u * 0.012, my - u * 0.008, u * 0.009) < 0) v -= 0.18;
      if (sdC(X, Y, mx - u * 0.014, my + u * 0.014, u * 0.006) < 0) v -= 0.14;
      res = over(res, [clamp(v, 0, 1), 0]);
    }
    const gy = u * 0.82, by = u * 0.22, W = u * 0.16;
    // ground: grass field with blade tufts and moonlit crest
    if (Y > gy) {
      let g = 0.14 + 0.10 * fbm(X * 0.6, Y * 0.6, 2);
      g += 0.16 * ss(u * 0.30, 0, Math.abs(X - mx) + (Y - gy) * 2); // moonlight pool
      res = over(res, [clamp(g, 0, 1), 1]);
      if (vnoise(X * 2.6, Y * 1.4) > 0.78 && Y < gy + u * 0.05) res = over(res, [0.38, 1]); // blade tips
    }
    // frame: top bar + angled legs, shaded with moon rim
    const frameParts = [[-W, by, W, by], [-W, by, -W - u * 0.04, gy], [W, by, W + u * 0.04, gy]];
    for (const [x0, y0, x1, y1] of frameParts) {
      const sdF = (px, py) => sdSeg(px, py, x0, y0, x1, y1) - u * 0.016;
      const dF = sdF(X, Y);
      if (dF < 1.0) {
        const sh = shade(sdF, X, Y, 0.5, -0.75);
        if (sh > 0) res = over(res, [clamp(sh * 1.2 + 0.05, 0, 1), 1]);
      }
    }
    // pendulum
    const a = 0.38 * S(t, 1);
    const L = u * 0.34;
    const sx = Math.sin(a) * L, sy = by + Math.cos(a) * L;
    // cast shadow on the ground, swinging with the seat
    if (Y > gy && sdE(X, Y, Math.sin(a) * L * 1.15, gy + u * 0.025, u * 0.06, u * 0.013) < 0) res = over(res, [0.05, 1]);
    // chains with link texture
    for (let s = -1; s <= 1; s += 2) {
      const ex = sx + s * u * 0.045;
      const dR = sdSeg(X, Y, s * u * 0.007, by, ex, sy) - u * 0.0035;
      if (dR < 0.6) {
        const along = ((X - s * u * 0.007) * (ex - s * u * 0.007) + (Y - by) * (sy - by)) / (L * L);
        const link = 0.55 + 0.45 * Math.sin(along * L * 2.2);
        const v = glow(dR, 0.6) * link;
        if (v > 0.07) res = over(res, [clamp(v, 0, 1), 0]);
      }
    }
    // wooden plank: three boards, hot moonlit top edge, dark underside
    const sdSeat = (px, py) => sdBox(px, py, sx, sy, u * 0.052, u * 0.017) - u * 0.004;
    const dS = sdSeat(X, Y);
    if (dS < 0.8) {
      let v = clamp(0.98 - 1.05 * ss(-u * 0.016, u * 0.020, Y - sy), 0.10, 1);
      if (Y < sy - u * 0.010) v = Math.min(1, v + 0.25);
      if (Math.abs(X - sx - u * 0.021) < u * 0.0016 || Math.abs(X - sx + u * 0.021) < u * 0.0016) v *= 0.45; // board seams
      if (v > 0.04) res = over(res, [clamp(v, 0, 1), 0]);
    }
    // foreground grass tufts, dark silhouettes at the bottom edge
    if (Y > u * 0.93) {
      const b = vnoise(X * 3.4, 7.7);
      if (b > 0.62 && Y > u * 0.93 + (b - 0.62) * u * 0.3) res = over(res, [0.06, 1]);
    }
    return res;
  });

  add('sprout', '#101a10', ['#a8e88a', '#e8f5d8'], 16, (x, y, t, cols, rows) => {
    const X = (x - cols / 2) / 1.06, Y = y, u = rows;
    let res = 0;
    const sway = S(t, 0.9) * u * 0.012;
    const apexX = sway, apexY = u * 0.47;
    // soil mound: small, dark, lit crest
    const dMound = sdE(X, Y, 0, u * 1.07, u * 0.22, u * 0.13);
    if (dMound < 0) {
      const crest = ss(u * 0.10, 0, Y - u * 0.94);
      res = over(res, [0.10 + 0.30 * crest + 0.07 * fbm(X * 1.6, Y * 1.6, 2), 0]);
    }
    // stem: tapered two-segment column, shaded
    const sdStem = (px, py) => Math.min(
      sdSeg(px, py, 0, u * 0.94, sway * 0.4, u * 0.72) - u * 0.019,
      sdSeg(px, py, sway * 0.4, u * 0.72, sway, apexY) - u * 0.013);
    if (Math.abs(X) < u * 0.08 && Y > apexY - 3 && Y < u * 0.97) {
      const sh = shade(sdStem, X, Y, -0.6, -0.7);
      if (sh > 0) res = over(res, [clamp(sh * 1.5, 0, 1), 0]);
    }
    // plump shaded vesica leaves with a midrib crease
    const drawLeaf = (bx2, by2, ang, b, w, boost, ink) => {
      const dd = (b * b - w * w) / (2 * w), rr = w + dd;
      const ux2 = Math.sin(ang), uy2 = -Math.cos(ang);
      const cx2 = bx2 + ux2 * b, cy2 = by2 + uy2 * b;
      const RY = (X - cx2) * ux2 + (Y - cy2) * uy2;
      const RX = -(X - cx2) * uy2 + (Y - cy2) * ux2;
      if (Math.abs(RY) > b * 1.7 || Math.abs(RX) > w * 2.0) return;
      const sdLf = (px, py) => {
        const qy = (px - cx2) * ux2 + (py - cy2) * uy2;
        const qx = -(px - cx2) * uy2 + (py - cy2) * ux2;
        return sdVesica(qx, qy, 0, 0, rr, dd);
      };
      const sh = shade(sdLf, X, Y, -0.62, -0.72);
      if (sh > 0) {
        let v = sh * boost;
        if (Math.abs(RX) < u * 0.0028) v *= 0.52;
        res = over(res, [clamp(v, 0, 1), ink]);
      }
    };
    const wig = 0.025 * S(t, 1.3), wig2 = 0.03 * S(t, 1.3, 2.2);
    // cotyledons: slender ovals spread wide, dark wedge between them
    drawLeaf(apexX + u * 0.008, apexY + u * 0.010, 1.02 + wig, u * 0.072, u * 0.029, 1.38, 1);
    drawLeaf(apexX - u * 0.008, apexY + u * 0.010, -1.02 + wig2, u * 0.067, u * 0.027, 1.38, 1);
    // dew specks
    const g = drift(X, Y, t, { gain: 0.12, thresh: 0.94, speed: 1.2 });
    if (g > 0) res = over(res, [g, 1]);
    return res;
  });
})(typeof window !== 'undefined' ? window : globalThis);
