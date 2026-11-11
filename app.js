/* moments - carousel shell: swipe / keys / hash routing, auto-hiding chrome */
'use strict';
(function () {
  const SCENES = [...(window.ScenesA || []), ...(window.ScenesB || []), ...(window.ScenesB2 || []), ...(window.ScenesC || []), ...(window.ScenesD || [])];
  const nameEl = document.getElementById('name');
  const countEl = document.getElementById('count');
  const hintEl = document.getElementById('hint');
  const params = new URLSearchParams(location.search);
  const CLEAN = params.has('clean');
  const STILL = params.has('t'); // test hook: freeze phase

  let idx = 0;
  const fromHash = () => {
    const h = location.hash.replace(/^#\/?/, '');
    const i = SCENES.findIndex(s => s.id === h);
    if (i >= 0) idx = i;
  };
  fromHash();

  let chromeTimer = 0;
  function showChrome() {
    if (CLEAN) return;
    nameEl.textContent = SCENES[idx].name;
    countEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' + SCENES.length;
    nameEl.classList.add('show'); countEl.classList.add('show');
    if (!sessionStorage.getItem('hinted')) hintEl.classList.add('show');
    clearTimeout(chromeTimer);
    chromeTimer = setTimeout(() => {
      nameEl.classList.remove('show'); countEl.classList.remove('show'); hintEl.classList.remove('show');
    }, 1400);
  }

  let alpha = 1, targetAlpha = 1, pendingIdx = -1;
  function goTo(i) {
    const n = (i + SCENES.length) % SCENES.length;
    if (n === idx) return;
    pendingIdx = n;
    targetAlpha = 0;
  }

  Engine.setScene(SCENES[idx]);
  showChrome();
  setTimeout(() => { sessionStorage.setItem('hinted', '1'); hintEl.classList.remove('show'); }, 3200);

  // swipe
  let sx = 0, sy = 0, st = 0, tracking = false;
  window.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; st = performance.now(); tracking = true; showChrome(); });
  window.addEventListener('pointerup', e => {
    if (!tracking) return; tracking = false;
    const dx = e.clientX - sx, dy = e.clientY - sy, dt = performance.now() - st;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 800) {
      goTo(idx + (dx < 0 ? 1 : -1));
    }
  });
  window.addEventListener('keydown', e => {
    showChrome();
    if (e.key === 'ArrowRight') goTo(idx + 1);
    if (e.key === 'ArrowLeft') goTo(idx - 1);
  });
  window.addEventListener('hashchange', () => { const p = idx; fromHash(); if (idx !== p) { pendingIdx = idx; targetAlpha = 0; } });

  let start = performance.now();
  function frame(now) {
    const time = STILL ? parseFloat(params.get('t')) * Engine.scene.loop : (now - start) / 1000;
    // transition fade
    alpha += (targetAlpha - alpha) * 0.12;
    if (targetAlpha === 0 && alpha < 0.02 && pendingIdx >= 0) {
      idx = pendingIdx; pendingIdx = -1;
      Engine.setScene(SCENES[idx]);
      history.replaceState(null, '', '#/' + SCENES[idx].id);
      targetAlpha = 1;
      showChrome();
    }
    Engine.render(time, alpha);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
