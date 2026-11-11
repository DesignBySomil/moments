/* scenes 25-30: pendulum, fireflies, aurora, umbrella, swing, sprout */
'use strict';
(function () {
  const H = Engine.H;
  const { lerp, clamp } = H;
  const E = H.ease;
  const TAU = Math.PI * 2;

  // 25 - PENDULUM: metronome
  function pendulum(c, w, h, t, time) {
    const g = c.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, Math.min(w, h) * 0.75);
    g.addColorStop(0, '#181226'); g.addColorStop(1, '#070509');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const S = Math.min(w, h);
    const px = w * 0.5, py = h * 0.26;
    const ang = Math.sin(t * TAU * 2) * 0.48;
    // floor shadow
    c.fillStyle = '#0a0610'; c.fillRect(0, h * 0.9, w, h * 0.1);
    // base
    const bg = c.createLinearGradient(px - S * 0.2, 0, px + S * 0.2, 0);
    bg.addColorStop(0, '#4a3018'); bg.addColorStop(0.5, '#9a7040'); bg.addColorStop(1, '#3a2410');
    c.fillStyle = bg;
    c.beginPath();
    c.moveTo(px - S * 0.26, h * 0.9); c.lineTo(px - S * 0.08, py);
    c.lineTo(px + S * 0.08, py); c.lineTo(px + S * 0.26, h * 0.9);
    c.closePath(); c.fill();
    c.strokeStyle = '#1a0e04'; c.lineWidth = S * 0.01; c.stroke();
    c.fillStyle = '#241608'; c.fillRect(px - S * 0.28, h * 0.9, S * 0.56, S * 0.035);
    c.strokeStyle = '#3a2812'; c.lineWidth = S * 0.006; c.strokeRect(px - S * 0.28, h * 0.9, S * 0.56, S * 0.035);
    // swing arc guide
    c.strokeStyle = 'rgba(233,207,150,0.18)'; c.lineWidth = S * 0.004;
    c.beginPath(); c.arc(px, py, S * 0.52, Math.PI / 2 - 0.5, Math.PI / 2 + 0.5); c.stroke();
    // arm
    c.save(); c.translate(px, py); c.rotate(ang);
    const armL = S * 0.52;
    const ag = c.createLinearGradient(0, 0, 0, armL);
    ag.addColorStop(0, '#c9a86a'); ag.addColorStop(1, '#e8cf96');
    c.strokeStyle = ag; c.lineWidth = S * 0.018; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, armL); c.stroke();
    // slider weight
    const wy = armL * 0.5;
    H.glowCircle(c, 0, wy, S * 0.07, 'rgba(255,220,140,0.7)', 'rgba(255,200,100,0)');
    c.fillStyle = '#f2dcaa';
    c.fillRect(-S * 0.05, wy - S * 0.028, S * 0.1, S * 0.056);
    c.restore();
    // pivot
    H.glowCircle(c, px, py, S * 0.03, '#ffe9b0', 'rgba(255,210,120,0)');
    // tick flashes at extremes
    const tick = Math.abs(Math.cos(t * TAU * 2));
    if (tick > 0.96) {
      const side = Math.sin(t * TAU * 2) > 0 ? 1 : -1;
      c.globalAlpha = (tick - 0.96) / 0.04 * 0.8;
      H.glowCircle(c, px + side * S * 0.24, h * 0.7, S * 0.04, 'rgba(255,230,160,0.9)', 'rgba(255,210,120,0)');
      c.globalAlpha = 1;
    }
  }

  // 26 - FIREFLIES
  function fireflies(c, w, h, t, time) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#050b12'); g.addColorStop(0.7, '#0a1a14'); g.addColorStop(1, '#030805');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    H.starfield(c, w, h * 0.4, 40, 137, 1, true, time);
    const S = Math.min(w, h);
    // grass
    c.strokeStyle = '#0e2418'; c.lineCap = 'round';
    const rnd = H.mulberry32(139);
    for (let i = 0; i < 46; i++) {
      const gx = rnd() * w;
      const gh = h * (0.08 + rnd() * 0.14);
      const sway = Math.sin(time * 1.2 + i) * S * 0.01;
      c.lineWidth = Math.max(1, S * 0.004 * (0.5 + rnd()));
      c.beginPath(); c.moveTo(gx, h);
      c.quadraticCurveTo(gx + sway * 0.5, h - gh * 0.6, gx + sway, h - gh);
      c.stroke();
    }
    // fireflies
    const rnd2 = H.mulberry32(141);
    for (let i = 0; i < 12; i++) {
      const bx = w * rnd2(), by = h * (0.45 + rnd2() * 0.4);
      const x = bx + Math.sin(time * (0.4 + rnd2() * 0.4) + i * 2.6) * w * 0.06;
      const y = by + Math.cos(time * (0.3 + rnd2() * 0.5) + i * 1.7) * h * 0.05;
      const pulse = Math.max(0, Math.sin(time * (1.2 + rnd2()) + i * 2.2));
      const a = pulse * pulse;
      H.glowCircle(c, x, y, S * 0.045 * a + S * 0.005, 'rgba(220,255,140,' + (0.55 * a) + ')', 'rgba(200,255,120,0)');
      H.star(c, x, y, S * 0.006, '#f4ffc8', 0.3 + a * 0.7);
    }
  }

  // 27 - AURORA
  function aurora(c, w, h, t, time) {
    c.fillStyle = '#040810'; c.fillRect(0, 0, w, h);
    H.starfield(c, w, h * 0.7, 100, 149, 1, true, time);
    // aurora curtains
    for (let band = 0; band < 3; band++) {
      const hue = ['rgba(80,255,170,', 'rgba(120,220,255,', 'rgba(190,140,255,'][band];
      const yBase = h * (0.18 + band * 0.09);
      for (let s = 0; s < 26; s++) {
        const x = (s / 26) * w;
        const sway = Math.sin(time * 0.5 + s * 0.32 + band * 2) * w * 0.02;
        const len = h * (0.14 + 0.1 * H.noise1(s * 0.3 + time * 0.15 + band * 8));
        const a = 0.05 + 0.09 * H.noise1(s * 0.5 + time * 0.2 + band * 5);
        const g2 = c.createLinearGradient(0, yBase + sway, 0, yBase + sway + len);
        g2.addColorStop(0, hue + (a * 2.2) + ')');
        g2.addColorStop(1, hue + '0)');
        c.fillStyle = g2;
        c.fillRect(x + sway - w * 0.012, yBase + sway, w * 0.026, len);
      }
    }
    // mountains + snow glow
    c.fillStyle = '#060a12';
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) c.lineTo(x, h * 0.82 + H.noise1(x * 0.006 + 21) * h * 0.1 - h * 0.05);
    c.lineTo(w, h); c.fill();
    // reflection hint
    c.fillStyle = 'rgba(90,230,180,0.05)';
    c.fillRect(0, h * 0.86, w, h * 0.14);
  }

  // 28 - UMBRELLA: walking in rain
  function umbrella(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0a101e'); sky.addColorStop(0.7, '#16233a'); sky.addColorStop(1, '#0a0e18');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    // distant city glow
    H.glowCircle(c, w * 0.5, h * 0.75, w * 0.5, 'rgba(120,160,220,0.14)', 'rgba(120,160,220,0)');
    const S = Math.min(w, h);
    // rain
    const rnd = H.mulberry32(151);
    c.strokeStyle = 'rgba(170,200,240,0.3)'; c.lineWidth = Math.max(1, h * 0.0016);
    for (let i = 0; i < 70; i++) {
      const sx = rnd() * w, len = h * (0.03 + rnd() * 0.05), sp = h * (0.7 + rnd() * 0.5);
      const yy = ((time * sp + i * 61) % (h + len)) - len;
      c.beginPath(); c.moveTo(sx, yy); c.lineTo(sx - len * 0.18, yy + len); c.stroke();
    }
    const ground = h * 0.84;
    c.fillStyle = '#070a12'; c.fillRect(0, ground, w, h - ground);
    // walker crosses and wraps
    const wxp = w * (1.15 - t * 1.3);
    const bob = Math.abs(Math.sin(time * 5)) * h * 0.008;
    const wy = ground + bob;
    const s = S * 0.19;
    c.save(); c.translate(wxp, wy);
    // legs mid-stride
    const stride = Math.sin(time * 5) * 0.5;
    c.strokeStyle = '#0d1322'; c.lineWidth = s * 0.07; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -s * 0.5); c.lineTo(Math.sin(stride) * s * 0.28, 0); c.stroke();
    c.beginPath(); c.moveTo(0, -s * 0.5); c.lineTo(-Math.sin(stride) * s * 0.28, 0); c.stroke();
    // body + head
    c.beginPath(); c.moveTo(0, -s * 0.5); c.lineTo(0, -s * 1.05); c.stroke();
    c.fillStyle = '#0d1322';
    c.beginPath(); c.arc(0, -s * 1.18, s * 0.14, 0, TAU); c.fill();
    // umbrella
    c.strokeStyle = '#131a2c'; c.lineWidth = s * 0.035;
    c.beginPath(); c.moveTo(0, -s * 0.9); c.lineTo(s * 0.08, -s * 1.62); c.stroke();
    const ug = c.createLinearGradient(-s, -s * 1.9, s, -s * 1.3);
    ug.addColorStop(0, '#c9405e'); ug.addColorStop(1, '#8e2f4a');
    c.fillStyle = ug;
    c.beginPath();
    c.moveTo(s * 0.08 - s * 0.85, -s * 1.42);
    c.quadraticCurveTo(s * 0.08, -s * 2.15, s * 0.08 + s * 0.85, -s * 1.42);
    c.quadraticCurveTo(s * 0.08 + s * 0.55, -s * 1.32, s * 0.08 + s * 0.28, -s * 1.42);
    c.quadraticCurveTo(s * 0.08, -s * 1.32, s * 0.08 - s * 0.28, -s * 1.42);
    c.quadraticCurveTo(s * 0.08 - s * 0.55, -s * 1.32, s * 0.08 - s * 0.85, -s * 1.42);
    c.fill();
    c.restore();
    // puddle ripples
    c.strokeStyle = 'rgba(160,190,230,0.25)'; c.lineWidth = Math.max(1, h * 0.0015);
    for (let i = 0; i < 4; i++) {
      const p = (t * 2.5 + i * 0.25) % 1;
      const rx = w * (0.15 + i * 0.22);
      c.globalAlpha = (1 - p) * 0.5;
      c.beginPath(); c.ellipse(rx, ground + h * 0.05 + (i % 2) * h * 0.03, p * S * 0.05, p * S * 0.014, 0, 0, TAU); c.stroke();
    }
    c.globalAlpha = 1;
    // walker reflection hint
    c.fillStyle = 'rgba(140,170,220,0.07)';
    c.beginPath(); c.ellipse(wxp, ground + h * 0.035, s * 0.5, h * 0.012, 0, 0, TAU); c.fill();
  }

  // 29 - SWING: kid on a swing under a tree
  function swing(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0d0a1e'); sky.addColorStop(0.6, '#2a1e44'); sky.addColorStop(1, '#0c0818');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    H.starfield(c, w, h * 0.5, 50, 157, 1, true, time);
    H.glowCircle(c, w * 0.82, h * 0.18, Math.min(w, h) * 0.2, 'rgba(220,225,255,0.35)', 'rgba(220,225,255,0)');
    c.fillStyle = '#e8eeff';
    c.beginPath(); c.arc(w * 0.82, h * 0.18, Math.min(w, h) * 0.045, 0, TAU); c.fill();
    const S = Math.min(w, h);
    // ground
    c.fillStyle = '#080610'; c.fillRect(0, h * 0.86, w, h * 0.14);
    // tree
    c.strokeStyle = '#0e0a18'; c.lineCap = 'round';
    c.lineWidth = S * 0.05;
    c.beginPath(); c.moveTo(w * 0.16, h * 0.86); c.quadraticCurveTo(w * 0.15, h * 0.5, w * 0.2, h * 0.3); c.stroke();
    c.lineWidth = S * 0.03;
    c.beginPath(); c.moveTo(w * 0.185, h * 0.42); c.quadraticCurveTo(w * 0.4, h * 0.32, w * 0.58, h * 0.3); c.stroke();
    // foliage
    const rnd = H.mulberry32(161);
    for (let i = 0; i < 26; i++) {
      const fx = w * 0.3 + (rnd() - 0.5) * w * 0.5;
      const fy = h * 0.22 + (rnd() - 0.5) * h * 0.14;
      c.fillStyle = 'rgba(20,30,44,' + (0.5 + rnd() * 0.4) + ')';
      c.beginPath(); c.arc(fx, fy, S * (0.03 + rnd() * 0.04), 0, TAU); c.fill();
    }
    // swing from branch
    const ax = w * 0.5, ay = h * 0.315;
    const ang = Math.sin(t * TAU * 2) * 0.3;
    const L = h * 0.42;
    const sx = ax + Math.sin(ang) * L, sy = ay + Math.cos(ang) * L;
    c.strokeStyle = '#3a3450'; c.lineWidth = Math.max(1.2, S * 0.005);
    c.beginPath(); c.moveTo(ax - S * 0.05, ay + S * 0.01); c.lineTo(sx - S * 0.05 * Math.cos(ang), sy); c.stroke();
    c.beginPath(); c.moveTo(ax + S * 0.05, ay + S * 0.01); c.lineTo(sx + S * 0.05 * Math.cos(ang), sy); c.stroke();
    // seat + kid
    c.save(); c.translate(sx, sy); c.rotate(ang * 0.7);
    c.fillStyle = '#241c38'; c.fillRect(-S * 0.075, 0, S * 0.15, S * 0.018);
    // kid body leaning with swing
    c.strokeStyle = '#151026'; c.lineWidth = S * 0.032; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -S * 0.005); c.lineTo(0, -S * 0.12); c.stroke(); // torso
    c.fillStyle = '#151026';
    c.beginPath(); c.arc(0, -S * 0.155, S * 0.032, 0, TAU); c.fill(); // head
    c.lineWidth = S * 0.022;
    c.beginPath(); c.moveTo(0, -S * 0.02); c.lineTo(S * 0.05 * Math.sign(Math.cos(t * TAU * 2) || 1), S * 0.05); c.stroke(); // legs
    c.restore();
    // lantern glow nearby
    H.glowCircle(c, w * 0.24, h * 0.8, S * 0.08, 'rgba(255,190,100,' + (0.4 + 0.15 * Math.sin(time * 3)) + ')', 'rgba(255,170,80,0)');
  }

  // 30 - SPROUT: seedling growing
  function sprout(c, w, h, t, time) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0a1210'); g.addColorStop(0.7, '#12241a'); g.addColorStop(1, '#060a08');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const S = Math.min(w, h);
    const cx = w * 0.5, gy = h * 0.82;
    // soil mound
    c.fillStyle = '#1c1410';
    c.beginPath(); c.ellipse(cx, gy + S * 0.05, S * 0.4, S * 0.09, 0, 0, TAU); c.fill();
    c.fillStyle = '#120c08';
    c.beginPath(); c.ellipse(cx, gy + S * 0.08, S * 0.48, S * 0.07, 0, 0, TAU); c.fill();
    // sun glow rising with growth
    const grow = E.out(clamp(t / 0.55, 0, 1));
    H.glowCircle(c, cx, gy - S * 0.34, S * 0.62 * grow, 'rgba(255,220,130,' + (0.2 * grow) + ')', 'rgba(255,210,120,0)');
    // stem grows with S-curve sway
    const sway = Math.sin(time * 1.3) * S * 0.02 * grow;
    const stemH = S * 0.46 * grow;
    c.strokeStyle = '#58b06a'; c.lineWidth = S * 0.02; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx, gy);
    c.quadraticCurveTo(cx + sway * 0.4, gy - stemH * 0.5, cx + sway, gy - stemH);
    c.stroke();
    const topX = cx + sway, topY = gy - stemH;
    // two leaves unfurl after stem
    const leafT = E.outBack(clamp((t - 0.3) / 0.3, 0, 1));
    if (leafT > 0) {
      for (const side of [-1, 1]) {
        c.save();
        c.translate(topX, topY + S * 0.02);
        c.rotate(side * (0.9 - leafT * 0.5));
        const lg = c.createLinearGradient(0, 0, side * S * 0.2 * leafT, 0);
        lg.addColorStop(0, '#3f9a52'); lg.addColorStop(1, '#7ad68a');
        c.fillStyle = lg;
        c.beginPath();
        c.ellipse(side * S * 0.115 * leafT, -S * 0.025, S * 0.125 * leafT, S * 0.05 * leafT, side * -0.5, 0, TAU);
        c.fill();
        c.restore();
      }
      // bud tip
      H.glowCircle(c, topX, topY - S * 0.01, S * 0.02 * leafT, '#c8f0a0', 'rgba(150,220,120,0)');
    }
    // dew drops
    const rnd = H.mulberry32(167);
    for (let i = 0; i < 5; i++) {
      const dx = cx + (rnd() - 0.5) * S * 0.5, dy = gy + S * (0.02 + rnd() * 0.05);
      H.star(c, dx, dy, S * 0.004, '#bfe8d0', 0.5 + 0.3 * Math.sin(time * 2 + i));
    }
  }

  window.ScenesD = [
    { id: 'pendulum', name: 'pendulum', style: 'pixel', loop: 6, draw: pendulum },
    { id: 'fireflies', name: 'fireflies', style: 'grain', loop: 10, draw: fireflies },
    { id: 'aurora', name: 'aurora', style: 'grain', loop: 16, draw: aurora },
    { id: 'umbrella', name: 'umbrella', style: 'grain', loop: 12, draw: umbrella },
    { id: 'swing', name: 'swing', style: 'grain', loop: 8, draw: swing },
    { id: 'sprout', name: 'sprout', style: 'dots', loop: 10, draw: sprout },
  ];
})();
