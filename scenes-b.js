/* scenes 7-12: candle, campfire, moonsea, meteors, dandelion, leaves */
'use strict';
(function () {
  const H = Engine.H;
  const { lerp, clamp } = H;
  const E = H.ease;
  const TAU = Math.PI * 2;

  // 7 - CANDLE
  function candle(c, w, h, t, time) {
    c.fillStyle = '#080607'; c.fillRect(0, 0, w, h);
    const S = Math.min(w, h);
    const cx = w * 0.5, base = h * 0.86;
    const fl = 1 + H.noise1(time * 6) * 0.3 - 0.15;
    const lean = (H.noise1(time * 2.2) - 0.5) * S * 0.02;
    H.glowCircle(c, cx, base - S * 0.32, S * 0.55 * fl, 'rgba(255,160,60,0.28)', 'rgba(255,120,40,0)');
    c.fillStyle = '#17100c'; c.fillRect(0, base, w, h - base);
    c.fillStyle = 'rgba(255,170,80,0.08)'; c.fillRect(0, base, w, h * 0.012);
    const cw = S * 0.11, ch = S * 0.3;
    const wax = c.createLinearGradient(cx - cw / 2, 0, cx + cw / 2, 0);
    wax.addColorStop(0, '#8a6a4a'); wax.addColorStop(0.45, '#e8c9a0'); wax.addColorStop(1, '#6b4c33');
    c.fillStyle = wax;
    c.beginPath();
    c.moveTo(cx - cw / 2, base);
    c.lineTo(cx - cw / 2, base - ch);
    c.quadraticCurveTo(cx, base - ch - S * 0.02, cx + cw / 2, base - ch);
    c.lineTo(cx + cw / 2, base);
    c.fill();
    c.strokeStyle = '#241812'; c.lineWidth = S * 0.008; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx, base - ch); c.lineTo(cx + lean * 0.5, base - ch - S * 0.025); c.stroke();
    const fy = base - ch - S * 0.03;
    c.save();
    c.translate(cx + lean, fy);
    c.scale(1, fl);
    for (const [k, col] of [[1, 'rgba(255,120,30,0.85)'], [0.62, 'rgba(255,190,70,0.95)'], [0.3, '#fff3c8']]) {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, -S * 0.1 * k);
      c.bezierCurveTo(S * 0.045 * k, -S * 0.045 * k, S * 0.035 * k, S * 0.02 * k, 0, S * 0.02 * k);
      c.bezierCurveTo(-S * 0.035 * k, S * 0.02 * k, -S * 0.045 * k, -S * 0.045 * k, 0, -S * 0.1 * k);
      c.fill();
    }
    c.restore();
    const sp = (t * 4) % 1;
    c.globalAlpha = 1 - sp;
    H.star(c, cx + lean + Math.sin(sp * 9) * S * 0.01, fy - S * 0.1 - sp * S * 0.12, S * 0.005, '#ffca7a', 0.9 * (1 - sp));
    c.globalAlpha = 1;
  }

  // 8 - CAMPFIRE
  function campfire(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#05070f'); sky.addColorStop(1, '#120b08');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    H.starfield(c, w, h * 0.5, 50, 81, 1, true, time);
    const S = Math.min(w, h);
    const cx = w * 0.5, cy = h * 0.78;
    H.glowCircle(c, cx, cy - S * 0.1, S * 0.6, 'rgba(255,140,50,0.3)', 'rgba(255,120,40,0)');
    c.fillStyle = '#0c0805';
    c.beginPath(); c.ellipse(cx, cy + S * 0.16, w * 0.5, S * 0.1, 0, 0, TAU); c.fill();
    c.strokeStyle = '#2a1a0e'; c.lineWidth = S * 0.045; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - S * 0.18, cy + S * 0.1); c.lineTo(cx + S * 0.12, cy + S * 0.02); c.stroke();
    c.beginPath(); c.moveTo(cx + S * 0.18, cy + S * 0.1); c.lineTo(cx - S * 0.12, cy + S * 0.02); c.stroke();
    const fl = 1 + (H.noise1(time * 5) - 0.5) * 0.4;
    c.save(); c.translate(cx, cy + S * 0.05); c.scale(1, fl);
    for (const [k, col] of [[1, 'rgba(230,80,20,0.9)'], [0.66, 'rgba(255,150,40,0.95)'], [0.36, '#ffe08a']]) {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, -S * 0.34 * k);
      c.bezierCurveTo(S * 0.2 * k, -S * 0.12 * k, S * 0.14 * k, 0, 0, 0);
      c.bezierCurveTo(-S * 0.14 * k, 0, -S * 0.2 * k, -S * 0.12 * k, 0, -S * 0.34 * k);
      c.fill();
    }
    c.restore();
    for (let i = 0; i < 16; i++) {
      const p = (t * 3 + i * 0.061) % 1;
      const ex = cx + Math.sin(p * 12 + i * 5) * S * 0.12 * p;
      const ey = cy - p * S * 0.75;
      H.star(c, ex, ey, S * 0.006 * (1 - p * 0.5), i % 3 ? '#ffb054' : '#ff7a30', (1 - p) * 0.95);
    }
  }

  // 9 - MOONSEA
  function moonsea(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#04060f'); sky.addColorStop(0.6, '#0b1626'); sky.addColorStop(0.62, '#050a14'); sky.addColorStop(1, '#02040a');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    H.starfield(c, w, h * 0.55, 80, 91, 1, true, time);
    const mx = w * 0.5, my = h * 0.24, mr = Math.min(w, h) * 0.09;
    H.glowCircle(c, mx, my, mr * 4, 'rgba(220,230,255,0.4)', 'rgba(220,230,255,0)');
    c.fillStyle = '#f2f6ff';
    c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill();
    c.fillStyle = 'rgba(170,190,225,0.3)';
    c.beginPath(); c.arc(mx + mr * 0.3, my - mr * 0.2, mr * 0.2, 0, TAU); c.fill();
    const horizon = h * 0.62;
    for (let k = 0; k < 4; k++) {
      const yy = horizon + k * h * 0.09;
      c.strokeStyle = 'rgba(120,160,220,' + (0.22 - k * 0.04) + ')';
      c.lineWidth = Math.max(1, h * 0.0022);
      c.beginPath();
      for (let x = 0; x <= w; x += 5) {
        const y2 = yy + Math.sin(x * 0.02 + time * (1 + k * 0.3) + k * 2) * h * 0.008;
        x === 0 ? c.moveTo(x, y2) : c.lineTo(x, y2);
      }
      c.stroke();
    }
    for (let i = 0; i < 26; i++) {
      const yy = horizon + Math.pow(i / 26, 1.25) * (h - horizon);
      const spread = 4 + i * 2.2;
      const off = Math.sin(time * 1.6 + i) * spread * 0.3;
      const ww = spread * (0.35 + 0.65 * Math.abs(Math.sin(time + i * 1.3)));
      c.fillStyle = 'rgba(215,228,255,' + (0.2 * (1 - i / 30)) + ')';
      c.fillRect(mx - ww / 2 + off, yy, ww, Math.max(1, h * 0.004));
    }
  }

  // 10 - METEORS
  function meteors(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#030510'); sky.addColorStop(0.8, '#0a1024'); sky.addColorStop(1, '#0d0a18');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    H.starfield(c, w, h * 0.8, 120, 101, 1, true, time);
    c.save(); c.translate(w * 0.5, h * 0.3); c.rotate(-0.5);
    H.glowCircle(c, 0, 0, w * 0.45, 'rgba(140,150,220,0.10)', 'rgba(140,150,220,0)');
    c.restore();
    c.fillStyle = '#050308';
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) c.lineTo(x, h * 0.88 + H.noise1(x * 0.004 + 9) * h * 0.05);
    c.lineTo(w, h); c.fill();
    const rnd = H.mulberry32(103);
    for (let i = 0; i < 3; i++) {
      const start = rnd() * 0.8, dur = 0.1 + rnd() * 0.06;
      const p = (t - start) / dur;
      if (p < 0 || p > 1) continue;
      const sx = w * (0.15 + rnd() * 0.7), sy = h * (0.1 + rnd() * 0.3);
      const ang = 0.5 + rnd() * 0.3;
      const len = w * 0.22;
      const head = p * len * 1.6;
      const tail = Math.max(0, head - len * (1 - p * 0.4));
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const g = c.createLinearGradient(sx + dx * tail, sy + dy * tail, sx + dx * head, sy + dy * head);
      g.addColorStop(0, 'rgba(190,210,255,0)');
      g.addColorStop(1, 'rgba(255,255,255,0.95)');
      c.strokeStyle = g; c.lineWidth = Math.max(1.5, h * 0.003); c.lineCap = 'round';
      c.beginPath(); c.moveTo(sx + dx * tail, sy + dy * tail); c.lineTo(sx + dx * head, sy + dy * head); c.stroke();
      H.glowCircle(c, sx + dx * head, sy + dy * head, h * 0.015, 'rgba(255,255,255,0.9)', 'rgba(200,220,255,0)');
    }
  }

  // 11 - DANDELION
  function dandelion(c, w, h, t, time) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0b1220'); g.addColorStop(0.7, '#1a2b3d'); g.addColorStop(1, '#0a0f18');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    H.glowCircle(c, w * 0.24, h * 0.6, Math.min(w, h) * 0.4, 'rgba(180,220,200,0.12)', 'rgba(180,220,200,0)');
    const S = Math.min(w, h);
    const bx = w * 0.24, by = h * 0.6;
    c.strokeStyle = '#4a7a58'; c.lineWidth = S * 0.01; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx - S * 0.02, h); c.quadraticCurveTo(bx + S * 0.04, h * 0.82, bx, by); c.stroke();
    const N = 42;
    const rnd = H.mulberry32(7);
    const spokes = [];
    for (let i = 0; i < N; i++) spokes.push({ a: rnd() * TAU, r: 0.75 + rnd() * 0.25, gone: rnd() });
    for (const s of spokes) {
      const detach = clamp((t * 1.15 - s.gone) * 6, 0, 1);
      const rr = S * 0.11 * s.r;
      const tipX = bx + Math.cos(s.a) * rr, tipY = by + Math.sin(s.a) * rr;
      if (detach <= 0) {
        c.strokeStyle = 'rgba(220,230,220,0.5)'; c.lineWidth = Math.max(1, S * 0.0022);
        c.beginPath(); c.moveTo(bx, by); c.lineTo(tipX, tipY); c.stroke();
        H.star(c, tipX, tipY, S * 0.004, '#f4f8f0', 0.9);
      } else {
        const fx = tipX + detach * w * (0.5 + s.gone * 0.4) + Math.sin(detach * 9 + s.a * 4) * S * 0.05;
        const fy = tipY - detach * h * 0.25 + Math.cos(detach * 7 + s.a * 3) * S * 0.05 - detach * detach * h * 0.1;
        c.globalAlpha = 1 - detach * 0.4;
        c.strokeStyle = 'rgba(230,238,228,0.85)'; c.lineWidth = Math.max(1, S * 0.0022);
        c.save(); c.translate(fx, fy); c.rotate(s.a + detach * 2);
        for (let k = 0; k < 5; k++) {
          const aa = -0.5 + k * 0.25;
          c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(aa) * S * 0.018, -Math.cos(aa) * S * 0.018); c.stroke();
        }
        H.star(c, 0, S * 0.004, S * 0.003, '#fff', 0.9);
        c.restore(); c.globalAlpha = 1;
      }
    }
    H.star(c, bx, by, S * 0.008, '#e8ecda', 0.9);
  }

  // 12 - LEAVES
  function leaves(c, w, h, t, time) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#171019'); g.addColorStop(0.6, '#2e1c22'); g.addColorStop(1, '#0f0a10');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    H.glowCircle(c, w * 0.7, h * 0.3, Math.min(w, h) * 0.45, 'rgba(255,160,80,0.14)', 'rgba(255,160,80,0)');
    const S = Math.min(w, h);
    c.strokeStyle = '#241418'; c.lineWidth = S * 0.02; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-S * 0.05, h * 0.16); c.quadraticCurveTo(w * 0.35, h * 0.1, w * 0.62, h * 0.16); c.stroke();
    c.lineWidth = S * 0.01;
    c.beginPath(); c.moveTo(w * 0.3, h * 0.12); c.quadraticCurveTo(w * 0.42, h * 0.2, w * 0.5, h * 0.26); c.stroke();
    const rnd = H.mulberry32(17);
    for (let i = 0; i < 8; i++) {
      const p = (t + rnd()) % 1;
      const lx = w * (0.15 + rnd() * 0.7) + Math.sin(p * 7 + i * 3) * S * 0.09;
      const ly = h * 0.14 + p * h * 0.78;
      const rot = Math.sin(p * 9 + i) * 1.2;
      const sc = S * (0.028 + rnd() * 0.02);
      const colr = ['#c96a2e', '#d98e3a', '#a84e2a', '#b57a30'][i % 4];
      c.save(); c.translate(lx, ly); c.rotate(rot);
      c.globalAlpha = p > 0.92 ? (1 - p) / 0.08 : 1;
      c.fillStyle = colr;
      c.beginPath();
      c.moveTo(0, -sc);
      c.bezierCurveTo(sc * 0.8, -sc * 0.4, sc * 0.7, sc * 0.5, 0, sc);
      c.bezierCurveTo(-sc * 0.7, sc * 0.5, -sc * 0.8, -sc * 0.4, 0, -sc);
      c.fill();
      c.strokeStyle = 'rgba(60,25,10,0.5)'; c.lineWidth = Math.max(1, sc * 0.08);
      c.beginPath(); c.moveTo(0, -sc * 0.8); c.lineTo(0, sc * 0.9); c.stroke();
      c.restore();
    }
    c.globalAlpha = 1;
    c.fillStyle = '#1c1014';
    c.beginPath(); c.ellipse(w * 0.5, h * 0.98, w * 0.55, h * 0.05, 0, 0, TAU); c.fill();
  }

  window.ScenesB = [
    { id: 'candle', name: 'candle', style: 'grain', loop: 8, draw: candle },
    { id: 'campfire', name: 'campfire', style: 'dots', loop: 7, draw: campfire },
    { id: 'moonsea', name: 'moonsea', style: 'grain', loop: 14, draw: moonsea },
    { id: 'meteors', name: 'meteors', style: 'grain', loop: 12, draw: meteors },
    { id: 'dandelion', name: 'dandelion', style: 'dots', loop: 12, draw: dandelion },
    { id: 'leaves', name: 'leaves', style: 'grain', loop: 10, draw: leaves },
  ];
})();
