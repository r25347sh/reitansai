/*
 * MENU/MENU.js - Rebuild: Clean, robust pie-menu implementation
 * - Simpler, well-structured code for pie/polar layout
 * - Full teardown-and-rebuild as requested
 * - Accessibility: aria-hidden, aria-expanded, keyboard support
 * - Long-press / triple-tap to open, click to activate
 */
const RADIAL_MENU_DATA = [
  { label: 'ホーム', icon: '🏠', url: '/reitansai/index.html' },
  { label: '統括責任者', icon: '👔', url: '/reitansai/pages/takimura_t.html' },
  {
    label: 'ゼミ一覧', icon: '📚', items: [
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
  { label: 'テーマ設定', icon: '⚙️', url: '/reitansai/pages/settings.html' }
];

(function () {
  // Configuration
  const LONG_PRESS_MS = 360;
  const TRIPLE_TAP_DELAY_MS = 300;
  const MOVE_THRESHOLD = 8;

  // shell radii (px) and capacities
  const SHELL_RADII = [110, 180, 250];
  const SHELL_CAPACITIES = [6, 10, 14];

  // State
  let wrapper = null;
  let scrim = null;
  let canvas = null;
  let ctx = null;
  let orbits = null;
  let itemsHost = null;
  let coreBtn = null;
  let openPoint = { x: 0, y: 0 };
  let isOpen = false;
  let stack = [];
  let longPressTimer = null;
  let tapCount = 0;
  let tapTimer = null;
  let startX = 0, startY = 0;
  let activeButtons = [];

  function ensureDOM() {
    // If wrapper exists, reuse but clear inner structures
    if (document.querySelector('.radial-menu-wrapper')) {
      wrapper = document.querySelector('.radial-menu-wrapper');
      scrim = document.querySelector('.rm-scrim');
      canvas = wrapper.querySelector('.rm-canvas-layer');
      ctx = canvas ? canvas.getContext('2d') : null;
      orbits = wrapper.querySelector('.rm-orbits');
      itemsHost = wrapper.querySelector('.rm-items');
      coreBtn = wrapper.querySelector('.rm-core-btn');
      return;
    }

    // create elements
    scrim = document.createElement('div');
    scrim.className = 'rm-scrim';
    scrim.addEventListener('click', close);
    document.body.appendChild(scrim);

    wrapper = document.createElement('div');
    wrapper.className = 'radial-menu-wrapper';
    wrapper.setAttribute('role', 'navigation');
    wrapper.setAttribute('aria-hidden', 'true');

    canvas = document.createElement('canvas');
    canvas.className = 'rm-canvas-layer';
    ctx = canvas.getContext('2d');
    wrapper.appendChild(canvas);

    orbits = document.createElement('div');
    orbits.className = 'rm-orbits';
    wrapper.appendChild(orbits);

    itemsHost = document.createElement('div');
    itemsHost.className = 'rm-items';
    wrapper.appendChild(itemsHost);

    coreBtn = document.createElement('button');
    coreBtn.className = 'rm-core-btn';
    coreBtn.type = 'button';
    coreBtn.setAttribute('aria-label', '戻る');
    coreBtn.addEventListener('click', (e) => { e.stopPropagation(); onCoreClick(); });
    coreBtn.innerHTML = '✕';
    wrapper.appendChild(coreBtn);

    document.body.appendChild(wrapper);
  }

  function setCanvasForDPR(size) {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Basic particle = optional visual flourish; kept lightweight
  function drawPulse() {
    if (!ctx || !canvas) return;
    const size = 260;
    setCanvasForDPR(size);
    const cX = size / 2, cY = size / 2;
    let t = 0;
    const max = 28;
    function step() {
      ctx.clearRect(0, 0, size, size);
      for (let i = 0; i < 3; i++) {
        const r = 8 + t * (4 + i * 2);
        const a = Math.max(0, 0.9 - t * 0.05 - i * 0.06);
        if (a <= 0) continue;
        ctx.beginPath();
        ctx.arc(cX, cY, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(240,208,96,${a})`;
        ctx.lineWidth = 2 - i * 0.5;
        ctx.stroke();
      }
      t++;
      if (t < max) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, size, size);
    }
    step();
  }

  // Compute layout for a flat items array: distribute across shells
  function computeLayout(items) {
    const layout = [];
    let remaining = items.length;
    let idx = 0;
    for (let s = 0; s < SHELL_CAPACITIES.length && remaining > 0; s++) {
      const cap = SHELL_CAPACITIES[s];
      const count = Math.min(remaining, cap);
      const radius = SHELL_RADII[s];
      // spread items around the circle starting from -90deg
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const x = Math.round(Math.cos(angle) * radius);
        const y = Math.round(Math.sin(angle) * radius);
        layout.push({ item: items[idx], x, y, shell: s });
        idx++;
      }
      remaining -= count;
    }
    return layout;
  }

  function clearItems() {
    activeButtons = [];
    if (!itemsHost) return;
    itemsHost.querySelectorAll('.rm-item').forEach(el => el.remove());
    orbits.innerHTML = '';
  }

  function renderLevel(items) {
    clearItems();
    const layout = computeLayout(items || []);
    const shells = new Set();

    layout.forEach((d, i) => {
      shells.add(d.shell);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rm-item' + (d.item.items ? ' has-sub' : '');
      btn.setAttribute('data-label', d.item.label);
      btn.setAttribute('aria-label', d.item.label + (d.item.items ? ' サブメニュー' : ''));
      btn.innerHTML = d.item.icon || '•';

      // position via CSS variables to avoid transform conflicts
      btn.style.setProperty('--x', d.x + 'px');
      btn.style.setProperty('--y', d.y + 'px');
      btn.style.transitionDelay = (i * 24) + 'ms';

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (d.item.items && d.item.items.length) {
          stack.push(items);
          renderLevel(d.item.items);
          drawPulse();
        } else if (d.item.url) {
          close();
          setTimeout(() => { location.href = d.item.url; }, 160);
        }
      });

      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
      });

      itemsHost.appendChild(btn);
      // allow pointer events when shown
      requestAnimationFrame(() => btn.classList.add('rendered'));
      activeButtons.push(btn);
    });

    // draw orbits for occupied shells
    shells.forEach(s => {
      const orbit = document.createElement('div');
      orbit.className = 'rm-shell-orbit';
      const d = SHELL_RADII[s] * 2;
      orbit.style.width = d + 'px';
      orbit.style.height = d + 'px';
      orbit.style.marginLeft = (-SHELL_RADII[s]) + 'px';
      orbit.style.marginTop = (-SHELL_RADII[s]) + 'px';
      orbit.style.left = '50%';
      orbit.style.top = '50%';
      orbits.appendChild(orbit);
    });

    // core button visibility
    if (stack.length > 0) coreBtn.classList.add('visible'); else coreBtn.classList.remove('visible');

    // focus first item
    setTimeout(() => { if (activeButtons[0]) activeButtons[0].focus(); else coreBtn.focus(); }, 250);
  }

  function onCoreClick() {
    if (stack.length > 0) {
      const prev = stack.pop();
      renderLevel(prev);
      drawPulse();
    } else {
      close();
    }
  }

  function open(x, y) {
    ensureDOM();
    openPoint.x = Math.max(120, Math.min(x, window.innerWidth - 120));
    openPoint.y = Math.max(120, Math.min(y, window.innerHeight - 120));
    wrapper.style.left = openPoint.x + 'px';
    wrapper.style.top = openPoint.y + 'px';
    wrapper.classList.add('active');
    wrapper.setAttribute('aria-hidden', 'false');
    if (scrim) scrim.classList.add('active');
    isOpen = true;
    stack = [];
    renderLevel(RADIAL_MENU_DATA);
    drawPulse();
  }

  function close() {
    if (!wrapper) return;
    wrapper.classList.remove('active');
    wrapper.setAttribute('aria-hidden', 'true');
    if (scrim) scrim.classList.remove('active');
    clearItems();
    isOpen = false;
  }

  // keyboard navigation helper
  function moveFocus(delta) {
    if (!activeButtons.length) return;
    const active = document.activeElement;
    let idx = activeButtons.indexOf(active);
    if (idx === -1) idx = 0;
    idx = (idx + delta + activeButtons.length) % activeButtons.length;
    activeButtons[idx].focus();
  }

  function bindGlobalEvents() {
    document.addEventListener('pointerdown', (e) => {
      // If menu visible and user clicked inside wrapper, let event pass
      if (isOpen && wrapper && wrapper.contains(e.target)) return;
      // If open and click outside wrapper and scrim -> close
      if (isOpen && wrapper && !wrapper.contains(e.target) && !(scrim && scrim.contains(e.target))) {
        close();
        return;
      }
      if (isOpen) return;

      startX = e.clientX; startY = e.clientY;
      tapCount++;
      clearTimeout(tapTimer);

      if (tapCount === 3) {
        clearTimeout(longPressTimer); longPressTimer = null; tapCount = 0; open(startX, startY); return;
      }

      tapTimer = setTimeout(() => { tapCount = 0; }, TRIPLE_TAP_DELAY_MS);

      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(() => { tapCount = 0; open(startX, startY); }, LONG_PRESS_MS);
    });

    document.addEventListener('pointermove', (e) => {
      if (!longPressTimer || isOpen) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) {
        clearTimeout(longPressTimer); longPressTimer = null;
      }
    });

    document.addEventListener('pointerup', () => {
      if (longPressTimer && !isOpen) { clearTimeout(longPressTimer); longPressTimer = null; }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) { close(); return; }
      if (!isOpen) return;
      if (['ArrowRight','ArrowDown'].includes(e.key)) { e.preventDefault(); moveFocus(1); }
      else if (['ArrowLeft','ArrowUp'].includes(e.key)) { e.preventDefault(); moveFocus(-1); }
      else if (e.key === 'Enter' || e.key === ' ') { const el = document.activeElement; if (el && el.classList.contains('rm-item')) el.click(); }
    });

    window.addEventListener('resize', () => { /* keep wrapper in viewport */ if (isOpen) open(openPoint.x, openPoint.y); });
  }

  function boot() { ensureDOM(); bindGlobalEvents(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
