/* scenes 19-24: waves, jellyfish, butterfly, sunrise, train, windmill */
'use strict';
(function () {
  const H = Engine.H;
  const { lerp, clamp } = H;
  const E = H.ease;
  const TAU = Math.PI * 2;

  // 19 - WAVES
  function waves(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#04101e'); sky.addColorStop(0.5, '#0a2438'); sky.addColorStop(1, '#04101c');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    H.starfield(c, w, h * 0.35, 40, 71, 1, true, time);
    H.glowCircle(c, w * 0.3, h * 0.18, Math.min(w, h) * 0.22, 'rgba(200,225,255,0.35)', 'rgba(200,225,255,0)');
    c.fillStyle = '#e8f2ff';
    c.beginPath(); c.arc(w * 0.3, h * 0.18, Math.min(w, h) * 0.05, 0, TAU); c.fill();
    // layered wave bands
    for (let k = 0; k < 5; k++) {
      const base = h * (0.42 + k * 0.13);
      const amp = h * (0.018 + k * 0.008);
      const spd = 1.2 - k * 0.15;
      c.fillStyle = 'rgba(' + (10 + k * 6) + ',' + (40 + k * 10) + ',' + (66 + k * 12) + ',0.9)';
      c.beginPath(); c.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        const y = base + Math.sin(x * 0.014 + time * spd + k * 1.7) * amp
          + Math.sin(x * 0.033 - time * spd * 0.7 + k) * amp * 0.4;
        c.lineTo(x, y);
      }
      c.lineTo(w, h); c.fill();
      // foam crest
      c.strokeStyle = 'rgba(190,225,250,' + (0.35 - k * 0.05) + ')';
      c.lineWidth = Math.max(1, h * 0.002);
      c.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = base + Math.sin(x * 0.014 + time * spd + k * 1.7) * amp
          + Math.sin(x * 0.033 - time * spd * 0.7 + k) * amp * 0.4;
        x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    }
  }

  // 20 - JELLYFISH
  function jellyfish(c, w, h, t, time) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#03101e'); g.addColorStop(0.6, '#06283e'); g.addColorStop(1, '#020a14');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // god rays
    c.save(); c.globalAlpha = 0.1;
    for (let i = 0; i < 3; i++) {
      c.fillStyle = '#9fd8e8';
      c.beginPath();
      const rx = w * (0.25 + i * 0.25) + Math.sin(time * 0.3 + i) * w * 0.03;
      c.moveTo(rx, 0); c.lineTo(rx + w * 0.1, 0); c.lineTo(rx + w * 0.22, h * 0.7); c.lineTo(rx - w * 0.06, h * 0.7);
      c.fill();
    }
    c.restore();
    const S = Math.min(w, h);
    const cols = [['#ff8fb8', 'rgba(255,143,184,0.25)'], ['#8fd8ff', 'rgba(143,216,255,0.25)'], ['#c9a8ff', 'rgba(201,168,255,0.25)']];
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.9 + i * 0.33) % 1;
      const jx = w * (0.25 + i * 0.25) + Math.sin(time * 0.5 + i * 2.4) * w * 0.03;
      const jy = h * (1.05 - p * 0.95);
      const s = S * (0.11 - i * 0.02);
      const pulse = Math.sin(time * 2.4 + i * 2.1);
      const bw2 = s * (1 + pulse * 0.12), bh2 = s * (0.85 - pulse * 0.1);
      const col = cols[i][0];
      H.glowCircle(c, jx, jy, s * 2.6, cols[i][1], 'rgba(0,0,0,0)');
      // bell
      c.save(); c.translate(jx, jy);
      const bg2 = c.createLinearGradient(0, -bh2, 0, bh2 * 0.3);
      bg2.addColorStop(0, col); bg2.addColorStop(1, 'rgba(255,255,255,0.25)');
      c.globalAlpha = 0.85; c.fillStyle = bg2;
      c.beginPath();
      c.moveTo(-bw2, 0);
      c.bezierCurveTo(-bw2, -bh2 * 1.5, bw2, -bh2 * 1.5, bw2, 0);
      c.quadraticCurveTo(bw2 * 0.5, bh2 * 0.35, 0, bh2 * 0.25);
      c.quadraticCurveTo(-bw2 * 0.5, bh2 * 0.35, -bw2, 0);
      c.fill();
      // tentacles
      c.strokeStyle = col; c.globalAlpha = 0.55; c.lineWidth = Math.max(1, s * 0.03); c.lineCap = 'round';
      for (let k = -2; k <= 2; k++) {
        c.beginPath();
        c.moveTo(k * bw2 * 0.32, bh2 * 0.15);
        const sway = Math.sin(time * 1.8 + i + k) * s * 0.25;
        c.bezierCurveTo(k * bw2 * 0.32 + sway * 0.4, bh2 + s * 0.5, k * bw2 * 0.32 + sway, bh2 + s * 1.1, k * bw2 * 0.32 + sway * 1.3, bh2 + s * 1.7);
        c.stroke();
      }
      c.restore(); c.globalAlpha = 1;
    }
    // marine snow
    const rnd = H.mulberry32(83);
    for (let i = 0; i < 30; i++) {
      const px = rnd() * w, py = (rnd() * h + time * h * 0.02) % h;
      H.star(c, px, py, S * 0.0025, '#bfe8f0', 0.4);
    }
  }

  // 21 - BUTTERFLY
  function butterfly(c, w, h, t, time) {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0c1420'); g.addColorStop(0.75, '#1c2e28'); g.addColorStop(1, '#0a100e');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const S = Math.min(w, h);
    // two flowers
    for (const [fx, fs, col] of [[w * 0.25, 1, '#ff8fb8'], [w * 0.72, 0.8, '#ffb14e']]) {
      const fy = h * 0.78;
      c.strokeStyle = '#3f7a52'; c.lineWidth = S * 0.008 * fs; c.lineCap = 'round';
      c.beginPath(); c.moveTo(fx, h); c.quadraticCurveTo(fx + S * 0.02, h * 0.9, fx, fy); c.stroke();
      for (let p = 0; p < 6; p++) {
        const a = p / 6 * TAU + time * 0.1;
        c.fillStyle = col;
        c.save(); c.translate(fx, fy); c.rotate(a);
        c.beginPath(); c.ellipse(S * 0.035 * fs, 0, S * 0.035 * fs, S * 0.016 * fs, 0, 0, TAU); c.fill();
        c.restore();
      }
      H.glowCircle(c, fx, fy, S * 0.03 * fs, '#ffe9a8', 'rgba(255,200,80,0)');
    }
    // butterfly on Lissajous path
    const a = t * TAU;
    const bx = w * 0.5 + Math.sin(a) * w * 0.3;
    const by = h * 0.45 + Math.sin(a * 2 + 1) * h * 0.18;
    const flap = 0.35 + Math.abs(Math.sin(time * 9)) * 0.65;
    const heading = Math.cos(a) > 0 ? 1 : -1;
    c.save(); c.translate(bx, by); c.scale(heading, 1); c.rotate(Math.sin(a) * 0.2);
    const s = S * 0.085;
    for (const side of [-1, 1]) {
      c.save(); c.scale(side * flap, 1);
      const wg = c.createLinearGradient(0, 0, side * s * 2, -s);
      wg.addColorStop(0, '#ff7a59'); wg.addColorStop(1, '#ffd54d');
      c.fillStyle = wg;
      c.beginPath(); c.ellipse(side * s * 1.1, -s * 0.5, s * 1.1, s * 0.75, side * 0.5, 0, TAU); c.fill();
      c.fillStyle = '#e05575';
      c.beginPath(); c.ellipse(side * s * 0.9, s * 0.45, s * 0.7, s * 0.5, -side * 0.4, 0, TAU); c.fill();
      c.restore();
    }
    c.fillStyle = '#33241e';
    c.beginPath(); c.ellipse(0, 0, s * 0.22, s * 0.8, 0, 0, TAU); c.fill();
    c.restore();
  }

  // 22 - SUNRISE: full day cycle
  function sunrise(c, w, h, t, time) {
    // day cycle: sun travels up then down, sky palette shifts
    const dayT = Math.sin(t * Math.PI); // 0..1..0
    const top = ['#0a0e1e', '#3a6ea8'];
    const mid = ['#1a2340', '#8fc3e8'];
    const low = ['#3a2030', '#ffd9a0'];
    function mix3(arr, k) {
      const pa = parseInt(arr[0].slice(1), 16), pb = parseInt(arr[1].slice(1), 16);
      const r = ((pa >> 16) + (((pb >> 16) - (pa >> 16)) * k)) | 0;
      const g2 = (((pa >> 8) & 255) + ((((pb >> 8) & 255) - ((pa >> 8) & 255)) * k)) | 0;
      const b = ((pa & 255) + (((pb & 255) - (pa & 255)) * k)) | 0;
      return 'rgb(' + r + ',' + g2 + ',' + b + ')';
    }
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, mix3(top, dayT)); g.addColorStop(0.6, mix3(mid, dayT)); g.addColorStop(1, mix3(low, dayT));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    if (dayT < 0.35) H.starfield(c, w, h * 0.5, 60, 97, 1, true, time);
    // sun path
    const sx = w * 0.5, horizon = h * 0.78;
    const sy = horizon - Math.sin(t * Math.PI) * h * 0.52;
    const sr = Math.min(w, h) * 0.07;
    H.glowCircle(c, sx, sy, sr * 4, 'rgba(255,200,110,' + (0.25 + dayT * 0.4) + ')', 'rgba(255,180,90,0)');
    c.fillStyle = dayT > 0.5 ? '#fff3d0' : '#ffca7a';
    c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.fill();
    // sea/land
    c.fillStyle = '#0a0e18';
    c.fillRect(0, horizon, w, h - horizon);
    // sun glint
    for (let i = 0; i < 16; i++) {
      const yy = horizon + Math.pow(i / 16, 1.3) * (h - horizon) * 0.9;
      const ww = (3 + i * 1.6) * (0.4 + 0.6 * Math.abs(Math.sin(time * 1.4 + i)));
      c.fillStyle = 'rgba(255,210,140,' + (0.2 * dayT * (1 - i / 20) + 0.05) + ')';
      c.fillRect(sx - ww / 2 + Math.sin(time * 2 + i) * i * 0.3, yy, ww, Math.max(1, h * 0.004));
    }
    // birds at morning peak
    if (dayT > 0.4 && dayT < 0.95) {
      c.strokeStyle = '#1a2030'; c.lineWidth = Math.max(1.2, h * 0.004); c.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const bx = w * ((time * 0.05 + i * 0.22) % 1.15 - 0.07);
        const by = h * (0.24 + i * 0.05);
        const f = Math.sin(time * 7 + i * 1.7) * h * 0.012;
        c.beginPath();
        c.moveTo(bx - h * 0.014, by - f); c.quadraticCurveTo(bx, by + f * 0.4, bx + h * 0.014, by - f);
        c.stroke();
      }
    }
  }

  // 23 - TRAIN (pixel): night train with lit windows
  function train(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#120a1e'); sky.addColorStop(0.7, '#2c1636'); sky.addColorStop(1, '#120a16');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.fillStyle = '#e8d9b0';
    c.beginPath(); c.arc(w * 0.78, h * 0.22, Math.min(w, h) * 0.07, 0, TAU); c.fill();
    c.fillStyle = '#120a1e';
    c.beginPath(); c.arc(w * 0.76, h * 0.2, Math.min(w, h) * 0.06, 0, TAU); c.fill(); // crescent
    const rnd = H.mulberry32(113);
    for (let i = 0; i < 40; i++) H.star(c, rnd() * w, rnd() * h * 0.55, 1, '#e8dcff', 0.3 + rnd() * 0.5);
    const ground = h * 0.72;
    // back hills
    c.fillStyle = '#0c0714';
    c.beginPath(); c.moveTo(0, ground);
    for (let x = 0; x <= w; x += 8) c.lineTo(x, ground - H.noise1(x * 0.01 + 3) * h * 0.1);
    c.lineTo(w, ground); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    c.fillStyle = '#070410'; c.fillRect(0, ground, w, h - ground);
    // train: cars scrolling right to left
    const speed = w * 0.55;
    const carW = w * 0.34, gap = w * 0.02;
    const trainW = carW * 5 + gap * 4;
    const off = (time * speed) % (carW + gap);
    for (let car = -1; car < 6; car++) {
      const x = w - ((car * (carW + gap) + off) % (trainW + w * 0.4)) + carW - w * 0.1;
      const y = ground - h * 0.09;
      c.fillStyle = '#1e2838';
      c.fillRect(x, y, carW, h * 0.075);
      c.fillStyle = '#141c28';
      c.fillRect(x, y + h * 0.06, carW, h * 0.015);
      // windows
      for (let k = 0; k < 5; k++) {
        const lit = H.noise1(car * 7 + k * 3) > 0.25;
        c.fillStyle = lit ? '#ffca6a' : '#0c1220';
        c.fillRect(x + carW * (0.08 + k * 0.18), y + h * 0.016, carW * 0.12, h * 0.03);
      }
      // wheels
      c.fillStyle = '#0a0e18';
      c.beginPath(); c.arc(x + carW * 0.2, ground - h * 0.008, h * 0.012, 0, TAU); c.fill();
      c.beginPath(); c.arc(x + carW * 0.8, ground - h * 0.008, h * 0.012, 0, TAU); c.fill();
    }
    // foreground poles
    const poleGap = w * 0.4;
    const pOff = (time * speed * 1.5) % poleGap;
    c.fillStyle = '#050308';
    for (let i = -1; i < 4; i++) {
      const x = w - (i * poleGap + pOff);
      c.fillRect(x, h * 0.3, w * 0.012, h * 0.42);
      c.fillRect(x - w * 0.04, h * 0.32, w * 0.09, w * 0.008);
    }
  }

  // 24 - WINDMILL (pixel)
  function windmill(c, w, h, t, time) {
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#1a1030'); sky.addColorStop(0.55, '#5c2e56'); sky.addColorStop(0.85, '#c96a54'); sky.addColorStop(1, '#241428');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    const rnd = H.mulberry32(127);
    for (let i = 0; i < 30; i++) H.star(c, rnd() * w, rnd() * h * 0.4, 1, '#ffe8f0', 0.3 + rnd() * 0.4);
    c.fillStyle = '#ffd9a0';
    c.beginPath(); c.arc(w * 0.2, h * 0.62, Math.min(w, h) * 0.06, 0, TAU); c.fill();
    const ground = h * 0.8;
    c.fillStyle = '#160a20';
    c.beginPath(); c.moveTo(0, ground + h * 0.02);
    for (let x = 0; x <= w; x += 8) c.lineTo(x, ground - H.noise1(x * 0.008) * h * 0.06);
    c.lineTo(w, ground); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    // windmill
    const mx = w * 0.5, my = ground - h * 0.02;
    const s = Math.min(w, h) * 0.3;
    c.fillStyle = '#0c0616';
    c.beginPath();
    c.moveTo(mx - s * 0.16, my); c.lineTo(mx - s * 0.07, my - s * 0.55);
    c.lineTo(mx + s * 0.07, my - s * 0.55); c.lineTo(mx + s * 0.16, my); c.fill();
    c.fillRect(mx - s * 0.09, my - s * 0.62, s * 0.18, s * 0.09);
    // door + window
    c.fillStyle = '#ffca6a';
    c.fillRect(mx - s * 0.03, my - s * 0.14, s * 0.06, s * 0.14);
    c.fillRect(mx - s * 0.02, my - s * 0.4, s * 0.04, s * 0.05);
    // blades
    c.save(); c.translate(mx, my - s * 0.575); c.rotate(t * TAU);
    c.fillStyle = '#0c0616';
    for (let b = 0; b < 4; b++) {
      c.rotate(Math.PI / 2);
      c.fillRect(-s * 0.02, -s * 0.5, s * 0.04, s * 0.5);
      c.fillRect(-s * 0.02, -s * 0.5, s * 0.14, s * 0.3);
    }
    c.restore();
    c.fillStyle = '#1c0e28';
    c.beginPath(); c.arc(mx, my - s * 0.575, s * 0.045, 0, TAU); c.fill();
  }

  window.ScenesC = [
    { id: 'waves', name: 'waves', style: 'grain', loop: 12, draw: waves },
    { id: 'jellyfish', name: 'jellyfish', style: 'dots', loop: 16, draw: jellyfish },
    { id: 'butterfly', name: 'butterfly', style: 'dots', loop: 12, draw: butterfly },
    { id: 'sunrise', name: 'sunrise', style: 'grain', loop: 20, draw: sunrise },
    { id: 'train', name: 'night train', style: 'pixel', loop: 8, draw: train },
    { id: 'windmill', name: 'windmill', style: 'pixel', loop: 8, draw: windmill },
  ];
})();
