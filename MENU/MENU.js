/* MENU/MENU.js — Fixed Fluid Fibonacci Arc for reitansai
   Cleaned up and validated. Keeps cross-repo links to asobiseminar.
*/
const RADIAL_MENU_DATA = [
  { label: 'ホーム', icon: '🏠', url: '/reitansai/index.html' },
  { label: '遊び（Asobi）へ', icon: '🎲', url: '/asobiseminar/index.html' },
  { label: '統括責任者', icon: '👔', url: '/reitansai/pages/takimura_t.html' },
  {
    label: 'ゼミ一覧',
    icon: '📚',
    items: [
      { label: 'データサイエンス探究 AIゼミ', icon: '📊', url: '/reitansai/pages/zemi/data-science-ai.html' },
      { label: '教育ゼミ', icon: '📖', url: '/reitansai/pages/zemi/kyoiku.html' },
      { label: '国際地域研究ゼミ', icon: '🌍', url: '/reitansai/pages/zemi/kokusai-chiiki.html' },
      { label: '文芸小説創作ゼミ', icon: '🖋️', url: '/reitansai/pages/zemi/bungei-shosetsu-sosaku.html' },
      { label: '化学ゼミ', icon: '🧪', url: '/reitansai/pages/zemi/kagaku.html' },
      { label: '文学ゼミ', icon: '📜', url: '/reitansai/pages/zemi/bungaku.html' },
      { label: 'メディアゼミ', icon: '📺', url: '/reitansai/pages/zemi/media.html' },
      { label: '社会ゼミ', icon: '👥', url: '/reitansai/pages/zemi/shakai.html' },
      { label: '農業ゼミ', icon: '🌾', url: '/reitansai/pages/zemi/nogyo.html' },
      { label: '観光ゼミ', icon: '🗼', url: '/reitansai/pages/zemi/kanko.html' },
      { label: '語学ゼミ', icon: '🗣️', url: '/reitansai/pages/zemi/gengo.html' },
      { label: '遊びの探究ゼミ', icon: '🎮', url: '/reitansai/pages/zemi/asobi-tankyu.html' }
    ]
  },
  { label: '麗探祭', icon: '🎉', url: '/reitansai/pages/event.html' },
  { label: 'このサイトについて', icon: '⭐', url: '/reitansai/pages/aboutsite.html' },
  { label: 'Asobi Seminar（外部）', icon: '🔗', url: '/asobiseminar/index.html' },
  { label: '設定', icon: '⚙️', url: '/reitansai/pages/settings.html' }
];

(function () {
  const LONG_PRESS_MS = 360;
  const TRIPLE_TAP_DELAY_MS = 300;
  const MOVE_THRESHOLD = 10;
  const INNER_RADIUS = 36;
  const SPIRAL_CURVE = 2.2;

  let menuWrapper = null;
  let scrim = null;
  let canvas = null;
  let ctx = null;
  let orbitsContainer = null;
  let itemsContainer = null;
  let coreBtn = null;

  let isOpen = false;
  let menuStack = [];
  let currentItems = [];

  let openX = 0;
  let openY = 0;
  let rotationOffset = 0;
  let pointerTracking = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function triggerParticleBurst() {
    if (!ctx) return;
    const W = 600, H = 600;
    canvas.width = W;
    canvas.height = H;
    const cX = W / 2;
    const cY = H / 2;

    const particles = Array.from({ length: 30 }, () => {
      const a = Math.random() * Math.PI * 2;
      const spd = Math.random() * 6 + 2;
      return {
        x: cX,
        y: cY,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: Math.random() * 2.6 + 1,
        color: `hsla(${40 + Math.random() * 40},85%,${50 + Math.random() * 15}%,1)`,
        alpha: 1,
        drag: 0.92 + Math.random() * 0.06
      };
    });

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        if (p.alpha <= 0) return;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.alpha -= 0.03;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (particles.some(p => p.alpha > 0)) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, W, H);
    }

    draw();
  }

  function computeSafeArc(cx, cy, itemCount) {
    const left = cx;
    const right = window.innerWidth - cx;
    const top = cy;
    const bottom = window.innerHeight - cy;
    const nearEdgeThreshold = 140;
    const nearCornerThreshold = 120;

    let span = Math.PI * 2;
    let angleAwayX = 0;
    let angleAwayY = 0;

    if (left < nearEdgeThreshold) angleAwayX = 1;
    else if (right < nearEdgeThreshold) angleAwayX = -1;
    if (top < nearEdgeThreshold) angleAwayY = 1;
    else if (bottom < nearEdgeThreshold) angleAwayY = -1;

    if ((left < nearCornerThreshold && top < nearCornerThreshold) ||
        (left < nearCornerThreshold && bottom < nearCornerThreshold) ||
        (right < nearCornerThreshold && top < nearCornerThreshold) ||
        (right < nearCornerThreshold && bottom < nearCornerThreshold)) {
      span = Math.PI / 2;
    } else if (angleAwayX !== 0 || angleAwayY !== 0) {
      span = Math.PI;
    } else {
      span = Math.PI * 2;
      if (itemCount > 12) span = Math.PI * 1.6;
    }

    const centerAngle = (angleAwayX || angleAwayY) ? Math.atan2(-angleAwayY, angleAwayX) : -Math.PI / 2;
    const startAngle = centerAngle - span / 2;
    const endAngle = centerAngle + span / 2;
    return { startAngle, endAngle, span };
  }

  function computeSpiralPositions(n, startAngle, endAngle, inner, outer) {
    const positions = [];
    const c = SPIRAL_CURVE;
    const span = endAngle - startAngle;
    for (let i = 0; i < n; i++) {
      const t = (n === 1) ? 0.98 : i / (n - 1);
      const theta = startAngle + t * span + rotationOffset;
      const r = inner + (outer - inner) * ((Math.exp(c * t) - 1) / (Math.exp(c) - 1));
      const sizeScale = 0.6 + 0.6 * ((r - inner) / (outer - inner));
      const opacity = 0.55 + 0.45 * ((r - inner) / (outer - inner));
      const x = Math.round(Math.cos(theta) * r);
      const y = Math.round(Math.sin(theta) * r);
      positions.push({ x, y, r, theta, sizeScale, opacity });
    }
    return positions;
  }

  function createMenuDOM() {
    if (menuWrapper) return;

    scrim = document.createElement('div');
    scrim.className = 'fib-scrim rm-scrim';
    scrim.addEventListener('click', closeMenu);
    document.body.appendChild(scrim);

    menuWrapper = document.createElement('div');
    menuWrapper.className = 'radial-menu-wrapper fib-menu';
    menuWrapper.setAttribute('role', 'navigation');

    canvas = document.createElement('canvas');
    canvas.className = 'fib-canvas rm-canvas-layer';
    ctx = canvas.getContext && canvas.getContext('2d');
    menuWrapper.appendChild(canvas);

    orbitsContainer = document.createElement('div');
    menuWrapper.appendChild(orbitsContainer);

    itemsContainer = document.createElement('div');
    menuWrapper.appendChild(itemsContainer);

    coreBtn = document.createElement('button');
    coreBtn.className = 'rm-core-btn fib-core';
    coreBtn.type = 'button';
    coreBtn.setAttribute('aria-label', '戻る');
    coreBtn.innerHTML = '✕';
    coreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (menuStack.length > 0) {
        renderMenuLevel(menuStack.pop());
        triggerParticleBurst();
      } else closeMenu();
    });

    menuWrapper.appendChild(coreBtn);
    document.body.appendChild(menuWrapper);
  }

  function renderMenuLevel(items) {
    currentItems = items;
    itemsContainer.querySelectorAll('.rm-item').forEach(el => {
      el.classList.remove('rendered');
      setTimeout(() => el.remove(), 220);
    });
    orbitsContainer.innerHTML = '';

    const safe = computeSafeArc(openX, openY, items.length);
    const startAngle = safe.startAngle;
    const endAngle = safe.endAngle;
    const outer = clamp(Math.min(window.innerWidth, window.innerHeight) * 0.36, 90, 520);

    const positions = computeSpiralPositions(items.length, startAngle, endAngle, INNER_RADIUS, outer);

    const orbit = document.createElement('div');
    orbit.className = 'rm-shell-orbit';
    const d = Math.round(outer * 2);
    orbit.style.width = d + 'px';
    orbit.style.height = d + 'px';
    orbit.style.marginTop = (-outer) + 'px';
    orbit.style.marginLeft = (-outer) + 'px';
    orbitsContainer.appendChild(orbit);
    requestAnimationFrame(() => orbit.style.transform = 'scale(1)');

    positions.forEach((p, i) => {
      const it = items[i];
      const btn = document.createElement('button');
      btn.className = 'rm-item fib-item' + (it.items ? ' has-sub' : '');
      btn.type = 'button';
      btn.setAttribute('data-label', it.label || '');
      btn.innerHTML = it.icon || '•';
      btn.style.setProperty('--x', p.x + 'px');
      btn.style.setProperty('--y', p.y + 'px');
      btn.style.opacity = p.opacity;
      btn.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${p.sizeScale})`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (it.items && it.items.length > 0) {
          menuStack.push(items);
          rotationOffset = 0;
          renderMenuLevel(it.items);
          triggerParticleBurst();
        } else if (it.url) {
          closeMenu();
          setTimeout(() => location.href = it.url, 140);
        } else if (it.action && typeof it.action === 'function') {
          it.action();
          closeMenu();
        }
      });
      itemsContainer.appendChild(btn);
      btn.classList.add('rendered');
    });

    if (menuStack.length > 0) coreBtn.classList.add('visible');
    else coreBtn.classList.remove('visible');
  }

  function openMenu(x, y) {
    if (!menuWrapper) createMenuDOM();
    openX = x; openY = y;
    const margin = 24;
    const left = clamp(x, margin, window.innerWidth - margin);
    const top = clamp(y, margin, window.innerHeight - margin);
    menuWrapper.style.left = left + 'px';
    menuWrapper.style.top = top + 'px';
    menuWrapper.classList.add('active');
    menuWrapper.classList.add('open');
    if (scrim) scrim.classList.add('active');
    isOpen = true;
    menuStack = [];
    rotationOffset = 0;
    renderMenuLevel(RADIAL_MENU_DATA);
    triggerParticleBurst();
  }

  function closeMenu() {
    if (!menuWrapper) return;
    menuWrapper.classList.remove('active');
    menuWrapper.classList.remove('open');
    if (scrim) scrim.classList.remove('active');
    itemsContainer.querySelectorAll('.rm-item').forEach(el => el.classList.remove('rendered'));
    coreBtn.classList.remove('visible');
    isOpen = false;
  }

  function angleBetween(cx, cy, px, py) { return Math.atan2(py - cy, px - cx); }

  function onMenuPointerDown(e) {
    if (!isOpen) return;
    const id = e.pointerId;
    const cx = openX, cy = openY;
    pointerTracking = { id, startAngle: angleBetween(cx, cy, e.clientX, e.clientY), startRot: rotationOffset };
    try { e.target.setPointerCapture && e.target.setPointerCapture(id); } catch (err) {}
  }

  function onMenuPointerMove(e) {
    if (!pointerTracking || e.pointerId !== pointerTracking.id) return;
    const cx = openX, cy = openY;
    const a = angleBetween(cx, cy, e.clientX, e.clientY);
    const delta = a - pointerTracking.startAngle;
    rotationOffset = pointerTracking.startRot + delta;

    const items = Array.from(itemsContainer.children);
    const safe = computeSafeArc(openX, openY, items.length);
    const startAngle = safe.startAngle, endAngle = safe.endAngle;
    const outer = clamp(Math.min(window.innerWidth, window.innerHeight) * 0.36, 90, 520);
    const pos = computeSpiralPositions(items.length, startAngle, endAngle, INNER_RADIUS, outer);
    items.forEach((el, i) => {
      const p = pos[i];
      el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${p.sizeScale})`;
      el.style.opacity = p.opacity;
    });
  }

  function findNearestItemToPoint(px, py) {
    const items = Array.from(itemsContainer.children);
    let best = null, bestDist = Infinity, bestIdx = -1;
    items.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const d = Math.hypot(px - cx, py - cy);
      if (d < bestDist) { bestDist = d; best = el; bestIdx = i; }
    });
    return { el: best, idx: bestIdx, dist: bestDist };
  }

  function onMenuPointerUp(e) {
    if (!pointerTracking || e.pointerId !== pointerTracking.id) return;
    try { e.target.releasePointerCapture && e.target.releasePointerCapture(e.pointerId); } catch (err) {}
    const res = findNearestItemToPoint(e.clientX, e.clientY);
    const threshold = 64;
    if (res.el && res.dist < threshold) {
      res.el.click();
    }
    pointerTracking = null;
  }

  function initOpenGestures() {
    let startX = 0, startY = 0, timer = null, tapCount = 0, tapTimer = null;
    document.addEventListener('pointerdown', (e) => {
      if (isOpen && menuWrapper && menuWrapper.contains(e.target)) return;
      startX = e.clientX; startY = e.clientY;
      tapCount++; clearTimeout(tapTimer);
      if (tapCount === 3) {
        clearTimeout(timer); timer = null; tapCount = 0; openMenu(startX, startY); return;
      }
      tapTimer = setTimeout(() => { tapCount = 0; }, TRIPLE_TAP_DELAY_MS);
      clearTimeout(timer);
      timer = setTimeout(() => { tapCount = 0; openMenu(startX, startY); }, LONG_PRESS_MS);
    }, { passive: true });

    document.addEventListener('pointermove', (e) => {
      if (!timer) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) {
        clearTimeout(timer); timer = null;
      }
    }, { passive: true });

    document.addEventListener('pointerup', () => {
      if (timer) { clearTimeout(timer); timer = null; }
    });
  }

  function initMenuPointerHandlers() {
    document.addEventListener('pointerdown', (e) => {
      if (!isOpen) return;
      if (menuWrapper && menuWrapper.contains(e.target)) {
        onMenuPointerDown(e);
      }
    });
    document.addEventListener('pointermove', (e) => onMenuPointerMove(e));
    document.addEventListener('pointerup', (e) => onMenuPointerUp(e));
    document.addEventListener('pointercancel', (e) => onMenuPointerUp(e));
  }

  function boot() {
    createMenuDOM();
    initOpenGestures();
    initMenuPointerHandlers();
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) closeMenu(); });
    document.addEventListener('contextmenu', (e) => { if (isOpen) e.preventDefault(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();
