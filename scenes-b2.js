/* scenes 13-18: snow, lighthouse, lantern, balloon, kite, paperplane */
'use strict';
(function () {
  const H = Engine.H;
  const { lerp, clamp } = H;
  const E = H.ease;
  const TAU = Math.PI * 2;

  // 13 - SNOW: snowfall in a streetlamp's light
  function snow(c, w, h, t, time) {
    c.fillStyle = '#070a12'; c.fillRect(0, 0, w, h);
    const S = Math.min(w, h);
    const lx = w * 0.5, ly = h * 0.22;
    // lamp
    c.strokeStyle = '#0e1420'; c.lineWidth = S * 0.02; c.lineCap = 'round';
    c.beginPath(); c.moveTo(lx, h); c.lineTo(lx, ly); c.stroke();
    c.beginPath(); c.moveTo(lx, ly); c.quadraticCurveTo(lx + S * 0.02, ly - S * 0.05, lx + S * 0.08, ly - S * 0.05); c.stroke();
    const bulbX = lx + S * 0.08, bulbY = ly - S * 0.03;
    // light cone
    const cone = c.createLinearGradient(0, bulbY, 0, h);
    cone.addColorStop(0, 'rgba(255,220,150,0.30)');
    cone.addColorStop(1, 'rgba(255,220,150,0.02)');
    c.fillStyle = cone;
    c.beginPath();
    c.moveTo(bulbX - S * 0.02, bulbY);
    c.lineTo(bulbX + S * 0.02, bulbY);
    c.lineTo(bulbX + S * 0.42, h);
    c.lineTo(bulbX - S * 0.42, h);
    c.fill();
    H.glowCircle(c, bulbX, bulbY, S * 0.06, 'rgba(255,230,170,0.95)', 'rgba(255,210,130,0)');
    // ground snow
    c.fillStyle = '#141c2a';
    c.beginPath(); c.ellipse(w * 0.5, h * 1.02, w * 0.7, h * 0.07, 0, 0, TAU); c.fill();
    // snowflakes
    const rnd = H.mulberry32(23);
    for (let i = 0; i < 90; i++) {
      const px0 = rnd() * w, spd = h * (0.05 + rnd() * 0.12);
      const py = (time * spd + rnd() * h * 2) % (h * 1.05);
      const px = px0 + Math.sin(time * (0.6 + rnd()) + i) * S * 0.02;
      const inCone = Math.abs(px - bulbX) < S * 0.4 * (py / h);
      const a = inCone ? 0.95 : 0.3;
      H.star(c, px, py, S * (0.003 + rnd() * 0.004), '#eef4ff', a);
    }
  }

  // 14 - LIGHTHOUSE
  function lighthouse(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#04060e'); sky.addColorStop(0.7, '#0a1322'); sky.addColorStop(1, '#060a12');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    H.starfield(c, w, h * 0.6, 70, 37, 1, true, time);
    const S = Math.min(w, h);
    const bx = w * 0.68, by = h * 0.52;
    // rotating beams
    const ang = t * TAU;
    for (const dir of [0, Math.PI]) {
      const a = ang + dir;
      c.save();
      c.translate(bx, by);
      c.rotate(a);
      const g2 = c.createLinearGradient(0, 0, w * 0.75, 0);
      g2.addColorStop(0, 'rgba(255,240,190,0.5)');
      g2.addColorStop(1, 'rgba(255,240,190,0)');
      c.fillStyle = g2;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(w * 0.75, -S * 0.1);
      c.lineTo(w * 0.75, S * 0.1);
      c.fill();
      c.restore();
    }
    H.glowCircle(c, bx, by, S * 0.05, 'rgba(255,244,200,1)', 'rgba(255,230,160,0)');
    // tower
    c.fillStyle = '#0d1420';
    c.beginPath();
    c.moveTo(bx - S * 0.055, h);
    c.lineTo(bx - S * 0.028, by);
    c.lineTo(bx + S * 0.028, by);
    c.lineTo(bx + S * 0.055, h);
    c.fill();
    c.fillStyle = '#16202f';
    c.fillRect(bx - S * 0.045, by - S * 0.035, S * 0.09, S * 0.04);
    // rocks
    c.fillStyle = '#070b12';
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 10) c.lineTo(x, h * 0.9 + H.noise1(x * 0.02 + 3) * h * 0.06);
    c.lineTo(w, h); c.fill();
    // sea glints
    c.strokeStyle = 'rgba(150,190,240,0.18)';
    c.lineWidth = Math.max(1, h * 0.002);
    for (let i = 0; i < 8; i++) {
      const yy = h * (0.78 + i * 0.025);
      const xx = (H.noise1(i * 9 + time * 0.4) * w);
      c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + w * 0.05, yy); c.stroke();
    }
  }

  // 15 - LANTERN: sky lanterns rising
  function lantern(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0a0714'); sky.addColorStop(0.7, '#1d1030'); sky.addColorStop(1, '#080510');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    H.starfield(c, w, h * 0.6, 50, 47, 1, true, time);
    // rooftops silhouette
    c.fillStyle = '#060409';
    c.fillRect(0, h * 0.9, w, h * 0.1);
    c.beginPath();
    c.moveTo(0, h * 0.9); c.lineTo(w * 0.15, h * 0.84); c.lineTo(w * 0.3, h * 0.9);
    c.lineTo(w * 0.55, h * 0.86); c.lineTo(w * 0.7, h * 0.9); c.fill();
    const rnd = H.mulberry32(53);
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.85 + rnd()) % 1;
      const lx = w * (0.1 + rnd() * 0.8) + Math.sin(time * 0.5 + i * 2) * w * 0.015;
      const ly = h * 0.92 - p * h * 0.85;
      const s = Math.min(w, h) * lerp(0.05, 0.018, p);
      const a = clamp(p / 0.06, 0, 1) * clamp((1 - p) / 0.1, 0, 1);
      c.globalAlpha = a;
      H.glowCircle(c, lx, ly, s * 2.1, 'rgba(255,170,70,0.3)', 'rgba(255,150,50,0)');
      // lantern body
      const lg = c.createLinearGradient(lx, ly - s, lx, ly + s);
      lg.addColorStop(0, '#ffca7a'); lg.addColorStop(0.6, '#ff9a3e'); lg.addColorStop(1, '#c25a20');
      c.fillStyle = lg;
      c.beginPath();
      c.moveTo(lx - s * 0.7, ly - s * 0.3);
      c.quadraticCurveTo(lx - s * 0.75, ly - s * 1.1, lx, ly - s * 1.1);
      c.quadraticCurveTo(lx + s * 0.75, ly - s * 1.1, lx + s * 0.7, ly - s * 0.3);
      c.quadraticCurveTo(lx + s * 0.5, ly + s * 0.3, lx, ly + s * 0.32);
      c.quadraticCurveTo(lx - s * 0.5, ly + s * 0.3, lx - s * 0.7, ly - s * 0.3);
      c.fill();
      c.fillStyle = '#ffe9b0';
      c.beginPath(); c.ellipse(lx, ly + s * 0.12, s * 0.28, s * 0.18, 0, 0, TAU); c.fill();
      c.globalAlpha = 1;
    }
  }

  // 16 - BALLOON: hot air balloon at dawn
  function balloon(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#2b1e4a'); sky.addColorStop(0.5, '#7a4a63'); sky.addColorStop(0.85, '#e08a5a'); sky.addColorStop(1, '#f2b06a');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    H.glowCircle(c, w * 0.5, h * 0.92, Math.min(w, h) * 0.6, 'rgba(255,190,110,0.4)', 'rgba(255,180,100,0)');
    H.starfield(c, w, h * 0.3, 24, 57, 1, true, time);
    // mountains
    c.fillStyle = '#241434';
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 10) c.lineTo(x, h * 0.86 + H.noise1(x * 0.005 + 5) * h * 0.07);
    c.lineTo(w, h); c.fill();
    const S = Math.min(w, h);
    const bx = w * 0.5 + Math.sin(time * 0.4) * w * 0.03;
    const by = h * 0.4 + Math.sin(time * 0.7) * h * 0.02;
    const s = S * 0.3;
    // envelope
    c.save(); c.translate(bx, by);
    const eg = c.createLinearGradient(-s * 0.5, 0, s * 0.5, 0);
    eg.addColorStop(0, '#8e2f4a'); eg.addColorStop(0.5, '#e0607a'); eg.addColorStop(1, '#8e2f4a');
    c.fillStyle = eg;
    c.beginPath();
    c.moveTo(0, -s * 0.85);
    c.bezierCurveTo(s * 0.62, -s * 0.8, s * 0.6, -s * 0.05, s * 0.22, s * 0.28);
    c.lineTo(-s * 0.22, s * 0.28);
    c.bezierCurveTo(-s * 0.6, -s * 0.05, -s * 0.62, -s * 0.8, 0, -s * 0.85);
    c.fill();
    // stripes
    c.fillStyle = 'rgba(255,220,150,0.5)';
    c.beginPath();
    c.moveTo(-s * 0.1, -s * 0.86); c.quadraticCurveTo(-s * 0.16, -s * 0.3, -s * 0.08, s * 0.27);
    c.lineTo(s * 0.08, s * 0.27); c.quadraticCurveTo(s * 0.16, -s * 0.3, s * 0.1, -s * 0.86);
    c.fill();
    // basket
    c.strokeStyle = '#3a2430'; c.lineWidth = Math.max(1, s * 0.02);
    c.beginPath(); c.moveTo(-s * 0.2, s * 0.28); c.lineTo(-s * 0.11, s * 0.52); c.stroke();
    c.beginPath(); c.moveTo(s * 0.2, s * 0.28); c.lineTo(s * 0.11, s * 0.52); c.stroke();
    c.fillStyle = '#4a2c22';
    c.fillRect(-s * 0.13, s * 0.5, s * 0.26, s * 0.18);
    // burner glow
    H.glowCircle(c, 0, s * 0.42, s * 0.08, 'rgba(255,200,90,' + (0.5 + 0.4 * Math.sin(time * 6)) + ')', 'rgba(255,160,60,0)');
    c.restore();
    // birds
    c.strokeStyle = '#2c1a38'; c.lineWidth = Math.max(1.2, S * 0.006); c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const bxp = w * ((time * 0.03 + i * 0.3) % 1.2 - 0.1);
      const byp = h * (0.3 + i * 0.08);
      const f = Math.sin(time * 6 + i * 2) * S * 0.012;
      c.beginPath();
      c.moveTo(bxp - S * 0.02, byp - f); c.quadraticCurveTo(bxp, byp + f * 0.4, bxp + S * 0.02, byp - f);
      c.stroke();
    }
  }

  // 17 - KITE
  function kite(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0d1530'); sky.addColorStop(0.6, '#274a6e'); sky.addColorStop(1, '#0a1220');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    H.glowCircle(c, w * 0.8, h * 0.2, Math.min(w, h) * 0.3, 'rgba(255,240,200,0.25)', 'rgba(255,240,200,0)');
    const S = Math.min(w, h);
    // kite on a figure-eight path
    const a = t * TAU;
    const kx = w * 0.5 + Math.sin(a) * w * 0.22;
    const ky = h * 0.32 + Math.sin(a * 2) * h * 0.09;
    const rot = Math.cos(a) * 0.5;
    // string from bottom-left
    c.strokeStyle = 'rgba(220,230,255,0.4)'; c.lineWidth = Math.max(1, S * 0.003);
    c.beginPath(); c.moveTo(w * 0.12, h);
    c.quadraticCurveTo(w * 0.3 + Math.sin(a) * w * 0.05, h * 0.65, kx, ky + S * 0.05);
    c.stroke();
    c.save(); c.translate(kx, ky); c.rotate(rot);
    const s = S * 0.11;
    // diamond
    const kg = c.createLinearGradient(-s, -s, s, s);
    kg.addColorStop(0, '#ff5f6e'); kg.addColorStop(1, '#ffb14e');
    c.fillStyle = kg;
    c.beginPath();
    c.moveTo(0, -s); c.lineTo(s * 0.72, 0); c.lineTo(0, s * 1.15); c.lineTo(-s * 0.72, 0);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = Math.max(1, s * 0.03);
    c.beginPath(); c.moveTo(0, -s); c.lineTo(0, s * 1.15); c.moveTo(-s * 0.72, 0); c.lineTo(s * 0.72, 0); c.stroke();
    // tail bows
    for (let k = 1; k <= 4; k++) {
      const tp = k / 4;
      const tx = Math.sin(a * 2 + k) * s * 0.3 * tp;
      const ty = s * 1.15 + tp * s * 1.5;
      c.save(); c.translate(tx, ty); c.rotate(Math.sin(a * 3 + k * 2) * 0.6);
      c.fillStyle = k % 2 ? '#ffd54d' : '#ff8fc7';
      c.beginPath();
      c.moveTo(-s * 0.14, 0); c.lineTo(0, -s * 0.07); c.lineTo(s * 0.14, 0); c.lineTo(0, s * 0.07);
      c.closePath(); c.fill();
      c.restore();
    }
    c.restore();
  }

  // 18 - PAPER PLANE
  function paperplane(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#101a2e'); sky.addColorStop(0.7, '#1f3352'); sky.addColorStop(1, '#0c1424');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    H.starfield(c, w, h * 0.5, 36, 67, 1, true, time);
    const S = Math.min(w, h);
    const a = t * TAU;
    const px = w * (0.12 + 0.76 * (0.5 - Math.cos(a) / 2));
    const py = h * 0.42 + Math.sin(a * 2) * h * 0.12;
    const dx = Math.sin(a) * 0.76 * w / 2;
    const dy = Math.cos(a * 2) * 2 * h * 0.12;
    const rot = Math.atan2(dy, dx * 0.02 + w * 0.004);
    // trail
    c.setLineDash([S * 0.012, S * 0.02]);
    c.strokeStyle = 'rgba(200,220,255,0.35)'; c.lineWidth = Math.max(1, S * 0.004);
    c.beginPath();
    for (let k = 1; k < 260; k++) {
      const tt = t - k * 0.0018;
      const aa = tt * TAU;
      const tx = w * (0.12 + 0.76 * (0.5 - Math.cos(aa) / 2));
      const ty = h * 0.42 + Math.sin(aa * 2) * h * 0.12;
      k === 1 ? c.moveTo(tx, ty) : c.lineTo(tx, ty);
    }
    c.stroke(); c.setLineDash([]);
    // plane
    c.save(); c.translate(px, py); c.rotate(clamp(rot, -0.6, 0.6) + 0.15);
    const s = S * 0.09;
    c.fillStyle = '#eef3ff';
    c.beginPath();
    c.moveTo(s * 1.4, 0); c.lineTo(-s, -s * 0.55); c.lineTo(-s * 0.4, 0); c.lineTo(-s, s * 0.55);
    c.closePath(); c.fill();
    c.fillStyle = '#b9c8e8';
    c.beginPath();
    c.moveTo(s * 1.4, 0); c.lineTo(-s * 0.4, 0); c.lineTo(-s * 0.15, s * 0.18);
    c.closePath(); c.fill();
    c.restore();
  }

  window.ScenesB2 = [
    { id: 'snow', name: 'snow', style: 'grain', loop: 11, draw: snow },
    { id: 'lighthouse', name: 'lighthouse', style: 'grain', loop: 10, draw: lighthouse },
    { id: 'lantern', name: 'lanterns', style: 'grain', loop: 14, draw: lantern },
    { id: 'balloon', name: 'balloon', style: 'grain', loop: 12, draw: balloon },
    { id: 'kite', name: 'kite', style: 'dots', loop: 9, draw: kite },
    { id: 'paperplane', name: 'paper plane', style: 'grain', loop: 10, draw: paperplane },
  ];
})();
