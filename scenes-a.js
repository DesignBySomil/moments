/* scenes 1-6: bloom, sail, bird, wave, cycle, rain */
'use strict';
(function () {
  const H = Engine.H;
  const { lerp, clamp } = H;
  const E = H.ease;
  const TAU = Math.PI * 2;

  // 1 - BLOOM: halftone flower blooming
  function bloom(c, w, h, t, time) {
    const cx = w * 0.5, cy = h * 0.42;
    const S = Math.min(w, h);
    const sway = Math.sin(time * 0.9) * 0.02;
    // phases: grow stem 0-.18, bloom .1-.55, breathe .55-.8, close .8-1
    const open = t < 0.1 ? 0
      : t < 0.55 ? E.outBack(clamp((t - 0.1) / 0.45, 0, 1))
      : t < 0.8 ? 1
      : 1 - E.inOut((t - 0.8) / 0.2);
    const stemT = clamp(t / 0.18, 0, 1);
    const breathe = 1 + Math.sin(time * 1.6) * 0.02;

    // stem
    const stemH = S * 0.52 * E.out(stemT);
    c.strokeStyle = '#3fae62';
    c.lineWidth = S * 0.016;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx, h * 0.98);
    c.quadraticCurveTo(cx + sway * S * 2, h * 0.98 - stemH * 0.55, cx + sway * S * 3, h * 0.98 - stemH);
    c.stroke();
    // leaf
    if (stemT > 0.5) {
      const lt = clamp((stemT - 0.5) / 0.5, 0, 1);
      c.save();
      c.translate(cx + sway * S, h * 0.98 - stemH * 0.55);
      c.rotate(-0.7 + sway * 2);
      c.fillStyle = '#2f8f4e';
      c.beginPath();
      c.ellipse(S * 0.1 * lt, 0, S * 0.1 * lt, S * 0.03 * lt, 0, 0, TAU);
      c.fill();
      c.restore();
    }
    if (open <= 0.001) return;
    const fx = cx + sway * S * 3, fy = h * 0.98 - stemH;
    // petals: 2 rings
    for (let ring = 1; ring >= 0; ring--) {
      const n = ring ? 6 : 8;
      const ro = (ring ? 0 : Math.PI / 8) + sway;
      const pr = S * (ring ? 0.26 : 0.36) * open * breathe;
      const pw = S * (ring ? 0.115 : 0.15) * Math.min(1, open * 1.4);
      for (let i = 0; i < n; i++) {
        const a = ro + i / n * TAU;
        const stag = clamp(open * 1.25 - i * 0.045, 0, 1);
        if (stag <= 0) continue;
        c.save();
        c.translate(fx, fy);
        c.rotate(a);
        const grd = c.createLinearGradient(0, 0, pr * stag, 0);
        grd.addColorStop(0, ring ? '#ff5fa8' : '#b02878');
        grd.addColorStop(0.45, ring ? '#ff9ec9' : '#ff7ebd');
        grd.addColorStop(0.85, ring ? '#ffe3f0' : '#ffc4de');
        grd.addColorStop(1, '#fff8fc');
        c.fillStyle = grd;
        c.beginPath();
        c.moveTo(0, 0);
        c.bezierCurveTo(pr * stag * 0.3, -pw, pr * stag * 0.95, -pw * 0.62, pr * stag, 0);
        c.bezierCurveTo(pr * stag * 0.95, pw * 0.62, pr * stag * 0.3, pw, 0, 0);
        c.fill();
        c.restore();
      }
    }
    // heart
    H.glowCircle(c, fx, fy, S * 0.11 * open, '#ffd54d', 'rgba(255,120,60,0)');
    H.glowCircle(c, fx, fy, S * 0.05 * open, '#fff7d0', 'rgba(255,200,80,0)');
    // pollen sparkle
    const rnd = H.mulberry32(5);
    for (let i = 0; i < 14; i++) {
      const a = rnd() * TAU, d = rnd();
      const px = fx + Math.cos(a + time * 0.3) * S * 0.08 * d * open;
      const py = fy + Math.sin(a + time * 0.3) * S * 0.08 * d * open;
      H.star(c, px, py, S * 0.006, '#ffe9a8', 0.8 * open * (0.5 + 0.5 * Math.sin(time * 3 + i)));
    }
  }

  // 2 - SAIL: ship crossing a moonlit sea
  function sail(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#060a18'); sky.addColorStop(0.55, '#0d1b33'); sky.addColorStop(0.72, '#1a2d4a');
    sky.addColorStop(0.72, '#081222'); sky.addColorStop(1, '#040910');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    H.starfield(c, w, h * 0.7, 60, 11, 0.7, true, time);
    // moon
    const mx = w * 0.74, my = h * 0.2, mr = Math.min(w, h) * 0.075;
    H.glowCircle(c, mx, my, mr * 3.4, 'rgba(210,225,255,0.5)', 'rgba(210,225,255,0)');
    c.fillStyle = '#e8efff';
    c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill();
    c.fillStyle = 'rgba(160,180,220,0.35)';
    c.beginPath(); c.arc(mx - mr * 0.3, my + mr * 0.2, mr * 0.22, 0, TAU); c.fill();
    c.beginPath(); c.arc(mx + mr * 0.35, my - mr * 0.3, mr * 0.15, 0, TAU); c.fill();
    const horizon = h * 0.64;
    // moon shimmer on water
    for (let i = 0; i < 20; i++) {
      const yy = horizon + Math.pow(i / 20, 1.3) * (h - horizon) * 0.9;
      const spread = 3 + i * 1.2;
      const off = Math.sin(time * 2 + i * 1.7) * spread * 0.28;
      const ww = spread * (0.4 + 0.6 * Math.abs(Math.sin(time * 1.3 + i)));
      c.fillStyle = 'rgba(190,210,250,' + (0.13 * (1 - i / 24)) + ')';
      c.fillRect(mx - ww / 2 + off, yy, ww, Math.max(1, h * 0.004));
    }
    // ship
    const sx = lerp(-w * 0.25, w * 1.2, t);
    const bob = Math.sin(time * 1.4) * h * 0.006;
    const pitch = Math.sin(time * 1.4 + 0.8) * 0.02;
    const sy = horizon + h * 0.045 + bob;
    const s = Math.min(w, h) * 0.30;
    c.save();
    c.translate(sx, sy); c.rotate(pitch);
    c.fillStyle = '#0a0d14';
    // hull
    c.beginPath();
    c.moveTo(-s * 0.62, 0);
    c.lineTo(s * 0.62, 0);
    c.lineTo(s * 0.42, s * 0.2);
    c.lineTo(-s * 0.42, s * 0.2);
    c.closePath(); c.fill();
    // masts + sails
    c.strokeStyle = '#0a0d14'; c.lineWidth = Math.max(1.5, s * 0.02);
    c.beginPath(); c.moveTo(-s * 0.18, 0); c.lineTo(-s * 0.18, -s * 0.72); c.stroke();
    c.beginPath(); c.moveTo(s * 0.2, 0); c.lineTo(s * 0.2, -s * 0.58); c.stroke();
    c.fillStyle = '#cdd8ee';
    const billow = 1 + Math.sin(time * 1.1) * 0.05;
    c.beginPath(); // main sail
    c.moveTo(-s * 0.18, -s * 0.7);
    c.quadraticCurveTo(-s * 0.18 + s * 0.42 * billow, -s * 0.45, -s * 0.18, -s * 0.12);
    c.quadraticCurveTo(-s * 0.18 + s * 0.26 * billow, -s * 0.42, -s * 0.18, -s * 0.7);
    c.fill();
    c.beginPath(); // fore sail
    c.moveTo(s * 0.2, -s * 0.56);
    c.quadraticCurveTo(s * 0.2 + s * 0.34 * billow, -s * 0.36, s * 0.2, -s * 0.1);
    c.quadraticCurveTo(s * 0.2 + s * 0.2 * billow, -s * 0.34, s * 0.2, -s * 0.56);
    c.fill();
    // flag
    c.fillStyle = '#e05555';
    c.beginPath();
    c.moveTo(-s * 0.18, -s * 0.72);
    c.quadraticCurveTo(-s * 0.02, -s * 0.74 + Math.sin(time * 6) * s * 0.02, s * 0.02, -s * 0.68);
    c.lineTo(-s * 0.18, -s * 0.64);
    c.fill();
    // stern lamp
    H.glowCircle(c, -s * 0.5, -s * 0.06, s * 0.09, 'rgba(255,190,90,0.9)', 'rgba(255,150,50,0)');
    c.restore();
    // wake
    c.strokeStyle = 'rgba(200,220,255,0.25)';
    c.lineWidth = Math.max(1, h * 0.002);
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      for (let x = 0; x < w * 0.3; x += 4) {
        const wx = sx - s * 0.6 - x;
        const wy = sy + s * 0.16 + k * h * 0.008 + Math.sin(x * 0.08 + time * 3 + k) * h * 0.003;
        x === 0 ? c.moveTo(wx, wy) : c.lineTo(wx, wy);
      }
      c.globalAlpha = 0.5 - k * 0.15; c.stroke(); c.globalAlpha = 1;
    }
  }

  // 3 - BIRD: a bird flying away into the dusk
  function bird(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#17112b'); sky.addColorStop(0.5, '#3d2350');
    sky.addColorStop(0.78, '#a34d5e'); sky.addColorStop(1, '#d98a5f');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    H.glowCircle(c, w * 0.5, h * 0.86, Math.min(w, h) * 0.5, 'rgba(255,170,90,0.35)', 'rgba(255,150,80,0)');
    H.starfield(c, w, h * 0.4, 40, 21, 1, true, time);
    // distant hills
    c.fillStyle = '#120b1e';
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) {
      c.lineTo(x, h * 0.92 + H.noise1(x * 0.003) * h * 0.04 - h * 0.02);
    }
    c.lineTo(w, h); c.fill();
    // two birds offset in phase: fly away (shrink) then a near one passes
    for (let b = 0; b < 2; b++) {
      const bt = (t + b * 0.5) % 1;
      const away = E.inOut(clamp(bt / 0.85, 0, 1));
      const scale = lerp(1, 0.18, away) * Math.min(w, h) * 0.085;
      const bx = lerp(w * 0.32, w * 0.62, away) + Math.sin(time * 0.7 + b * 3) * w * 0.01;
      const by = lerp(h * 0.62, h * 0.3, away) + Math.sin(time * 1.1 + b * 2) * h * 0.008;
      const alpha = bt > 0.9 ? (1 - bt) / 0.1 : clamp(bt / 0.05, 0, 1);
      const flap = Math.sin(time * (7 - away * 3) + b * 2) * (0.9 - away * 0.3);
      c.save();
      c.translate(bx, by); c.globalAlpha = alpha;
      c.strokeStyle = '#140d1c'; c.lineWidth = Math.max(1, scale * 0.16); c.lineCap = 'round';
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(-scale * 0.7, -scale * flap, -scale * 1.35, -scale * flap * 0.35);
      c.moveTo(0, 0);
      c.quadraticCurveTo(scale * 0.7, -scale * flap, scale * 1.35, -scale * flap * 0.35);
      c.stroke();
      c.fillStyle = '#140d1c';
      c.beginPath(); c.ellipse(0, 0, scale * 0.3, scale * 0.16, 0, 0, TAU); c.fill();
      c.restore();
    }
  }

  // 4 - WAVE: a hand waving
  function wave(c, w, h, t, time) {
    const g = c.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.42, Math.min(w, h) * 0.75);
    g.addColorStop(0, '#241a3d'); g.addColorStop(1, '#07060d');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    H.glowCircle(c, w * 0.5, h * 0.45, Math.min(w, h) * 0.42, 'rgba(140,100,220,0.22)', 'rgba(140,100,220,0)');
    const S = Math.min(w, h);
    const wx = w * 0.5, wy = h * 0.98;
    const waveA = Math.sin(t * TAU * 3) * 0.38; // three waves per loop
    const bob = Math.sin(t * TAU * 3 + 0.6) * S * 0.008;
    c.save();
    c.translate(wx, wy + bob);
    // forearm
    c.strokeStyle = '#3a2f4d'; c.lineCap = 'round';
    c.lineWidth = S * 0.09;
    c.beginPath(); c.moveTo(S * 0.3, S * 0.14); c.lineTo(0, -S * 0.08); c.stroke();
    // hand group rotates at wrist
    c.translate(0, -S * 0.08);
    c.rotate(-0.35 + waveA);
    // palm
    const pg = c.createLinearGradient(0, 0, -S * 0.14, -S * 0.3);
    pg.addColorStop(0, '#f2c99b'); pg.addColorStop(1, '#d99e6b');
    c.fillStyle = pg;
    c.beginPath();
    c.ellipse(-S * 0.06, -S * 0.15, S * 0.085, S * 0.115, -0.2, 0, TAU);
    c.fill();
    // fingers
    c.strokeStyle = '#eec194'; c.lineWidth = S * 0.03;
    for (let f = 0; f < 4; f++) {
      const fa = -0.5 + f * 0.3 + waveA * 0.25;
      const fl = S * (0.13 - Math.abs(f - 1.5) * 0.012);
      c.beginPath();
      c.moveTo(-S * 0.11, -S * 0.22);
      c.lineTo(-S * 0.11 + Math.sin(fa) * fl, -S * 0.22 - Math.cos(fa) * fl);
      c.stroke();
    }
    // thumb
    c.beginPath();
    c.moveTo(S * 0.01, -S * 0.1);
    c.lineTo(S * 0.075, -S * 0.15);
    c.stroke();
    c.restore();
    // motion arcs
    c.strokeStyle = 'rgba(255,220,150,0.5)';
    c.lineWidth = Math.max(1, S * 0.008);
    for (let k = 0; k < 2; k++) {
      const rr = S * (0.44 + k * 0.1);
      const pulse = (Math.sin(t * TAU * 3 - k * 0.8) + 1) / 2;
      c.globalAlpha = pulse * 0.5;
      c.beginPath();
      c.arc(wx, wy - S * 0.22, rr, -1.9, -1.1);
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  // 5 - CYCLE: cyclist pedalling through rolling hills
  function cycle(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#241a3f'); sky.addColorStop(0.55, '#59365a'); sky.addColorStop(0.8, '#c96a54');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    H.glowCircle(c, w * 0.76, h * 0.62, Math.min(w, h) * 0.34, 'rgba(255,190,110,0.55)', 'rgba(255,170,90,0)');
    c.fillStyle = '#ffdf9e';
    c.beginPath(); c.arc(w * 0.76, h * 0.62, Math.min(w, h) * 0.055, 0, TAU); c.fill();
    H.starfield(c, w, h * 0.4, 30, 41, 1, true, time);
    const ground = h * 0.82;
    const scroll = time * 90;
    // parallax hills
    for (let layer = 0; layer < 3; layer++) {
      const sp = [0.15, 0.4, 1][layer];
      const amp = h * [0.05, 0.075, 0.1][layer];
      const yb = ground - h * [0.1, 0.045, 0][layer];
      c.fillStyle = ['#2b1f42', '#1e1533', '#120d20'][layer];
      c.beginPath(); c.moveTo(0, h);
      for (let x = 0; x <= w; x += 6) {
        const wx = x + scroll * sp;
        c.lineTo(x, yb - H.noise1(wx * 0.006 + layer * 40) * amp);
      }
      c.lineTo(w, h); c.fill();
    }
    // cyclist
    const cx0 = w * 0.46, cy0 = ground - h * 0.005;
    const s = Math.min(w, h) * 0.30;
    const crank = time * 5.2;
    const wheelR = s * 0.3;
    const rear = { x: cx0 - s * 0.34, y: cy0 - wheelR };
    const front = { x: cx0 + s * 0.36, y: cy0 - wheelR };
    c.strokeStyle = '#1a1330'; c.fillStyle = '#1a1330';
    // wheels + spokes
    for (const wh of [rear, front]) {
      c.lineWidth = Math.max(1.5, s * 0.025);
      c.beginPath(); c.arc(wh.x, wh.y, wheelR, 0, TAU); c.stroke();
      c.lineWidth = Math.max(1, s * 0.012);
      for (let i = 0; i < 4; i++) {
        const a = time * 6 + i * Math.PI / 4;
        c.beginPath();
        c.moveTo(wh.x, wh.y);
        c.lineTo(wh.x + Math.cos(a) * wheelR, wh.y + Math.sin(a) * wheelR);
        c.stroke();
      }
    }
    // frame
    const bb = { x: cx0, y: cy0 - wheelR * 0.95 };
    const seat = { x: cx0 - s * 0.16, y: cy0 - wheelR * 2.05 };
    const head = { x: cx0 + s * 0.28, y: cy0 - wheelR * 1.9 };
    c.lineWidth = Math.max(1.6, s * 0.03);
    c.beginPath();
    c.moveTo(rear.x, rear.y); c.lineTo(bb.x, bb.y); c.lineTo(seat.x, seat.y); c.closePath();
    c.moveTo(bb.x, bb.y); c.lineTo(head.x, head.y); c.lineTo(front.x, front.y);
    c.moveTo(head.x, head.y); c.lineTo(head.x + s * 0.08, head.y - s * 0.1);
    c.stroke();
    // rider body
    const hip = { x: seat.x, y: seat.y - s * 0.06 };
    const shoulder = { x: seat.x + s * 0.24, y: seat.y - s * 0.34 };
    c.lineWidth = Math.max(2, s * 0.045); c.lineCap = 'round';
    c.beginPath(); c.moveTo(hip.x, hip.y); c.lineTo(shoulder.x, shoulder.y); c.stroke();
    // head
    c.beginPath(); c.arc(shoulder.x + s * 0.05, shoulder.y - s * 0.12, s * 0.075, 0, TAU); c.fill();
    // arms to handlebar
    c.lineWidth = Math.max(1.5, s * 0.028);
    c.beginPath(); c.moveTo(shoulder.x, shoulder.y); c.lineTo(head.x + s * 0.08, head.y - s * 0.1); c.stroke();
    // legs: 2-bone IK to pedals
    function leg(phase) {
      const px = bb.x + Math.cos(crank + phase) * s * 0.17;
      const py = bb.y + Math.sin(crank + phase) * s * 0.17;
      const L1 = s * 0.3, L2 = s * 0.3;
      let dx = px - hip.x, dy = py - hip.y;
      let d = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.01);
      const a1 = Math.atan2(dy, dx);
      const cosA = clamp((d * d + L1 * L1 - L2 * L2) / (2 * d * L1), -1, 1);
      const ka = a1 - Math.acos(cosA);
      const kx = hip.x + Math.cos(ka) * L1, ky = hip.y + Math.sin(ka) * L1;
      c.lineWidth = Math.max(1.8, s * 0.035);
      c.beginPath(); c.moveTo(hip.x, hip.y); c.lineTo(kx, ky); c.lineTo(px, py); c.stroke();
    }
    leg(0); leg(Math.PI);
    // crank
    c.lineWidth = Math.max(1.2, s * 0.02);
    c.beginPath(); c.moveTo(bb.x + Math.cos(crank) * s * 0.17, bb.y + Math.sin(crank) * s * 0.17);
    c.lineTo(bb.x - Math.cos(crank) * s * 0.17, bb.y - Math.sin(crank) * s * 0.17); c.stroke();
    // speed lines in ground
    c.strokeStyle = 'rgba(255,200,150,0.15)';
    c.lineWidth = Math.max(1, h * 0.002);
    for (let i = 0; i < 5; i++) {
      const gx = w - ((scroll * 2 + i * w * 0.24) % (w * 1.2));
      c.beginPath(); c.moveTo(gx, ground + h * 0.02 + i * h * 0.012);
      c.lineTo(gx + w * 0.06, ground + h * 0.02 + i * h * 0.012); c.stroke();
    }
  }

  // 6 - RAIN: rain on a window over city bokeh
  function rain(c, w, h, t, time) {
    const bg = c.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0a1020'); bg.addColorStop(1, '#141a2e');
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    // bokeh lights
    const rnd = H.mulberry32(61);
    for (let i = 0; i < 22; i++) {
      const bx = rnd() * w, by = h * 0.25 + rnd() * h * 0.7;
      const br = (0.02 + rnd() * 0.075) * Math.min(w, h);
      const warm = rnd() > 0.45;
      const flick = 0.75 + 0.25 * Math.sin(time * (0.5 + rnd()) + i * 2.4);
      const col = warm ? 'rgba(255,180,90,' : 'rgba(120,180,255,';
      H.glowCircle(c, bx, by, br * 2.4, col + (0.34 * flick) + ')', col + '0)');
      H.glowCircle(c, bx, by, br, col + (0.5 * flick) + ')', col + '0)');
    }
    // glass streaks
    c.strokeStyle = 'rgba(170,200,240,0.14)';
    c.lineWidth = Math.max(1, h * 0.0016);
    const rnd2 = H.mulberry32(62);
    for (let i = 0; i < 40; i++) {
      const sx = rnd2() * w;
      const len = h * (0.05 + rnd2() * 0.12);
      const sp = h * (0.25 + rnd2() * 0.4);
      const yy = ((time * sp + i * 97) % (h + len)) - len;
      c.beginPath(); c.moveTo(sx, yy); c.lineTo(sx - len * 0.06, yy + len); c.stroke();
    }
    // running droplets
    const rnd3 = H.mulberry32(63);
    for (let i = 0; i < 10; i++) {
      const dx = rnd3() * w;
      const sp = h * (0.06 + rnd3() * 0.1);
      const yy = (time * sp + rnd3() * h * 3) % (h * 1.1);
      const wig = Math.sin(yy * 0.02 + i) * w * 0.004;
      const dr = Math.min(w, h) * (0.006 + rnd3() * 0.006);
      H.glowCircle(c, dx + wig, yy, dr * 3, 'rgba(200,225,255,0.5)', 'rgba(200,225,255,0)');
      c.fillStyle = 'rgba(215,235,255,0.85)';
      c.beginPath(); c.arc(dx + wig, yy, dr, 0, TAU); c.fill();
      // trail
      c.strokeStyle = 'rgba(190,215,250,0.2)';
      c.lineWidth = dr * 0.8;
      c.beginPath(); c.moveTo(dx + wig, yy - dr); c.lineTo(dx + wig * 0.5, yy - dr * 7); c.stroke();
    }
  }

  window.ScenesA = [
    { id: 'bloom', name: 'bloom', style: 'dots', loop: 9, draw: bloom },
    { id: 'sail', name: 'sail', style: 'grain', loop: 22, draw: sail },
    { id: 'bird', name: 'bird', style: 'grain', loop: 12, draw: bird },
    { id: 'wave', name: 'wave', style: 'dots', loop: 6, draw: wave },
    { id: 'cycle', name: 'cycle', style: 'grain', loop: 10, draw: cycle },
    { id: 'rain', name: 'rain', style: 'grain', loop: 8, draw: rain },
  ];
})();
