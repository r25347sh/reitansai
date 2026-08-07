/*
 * MENU/MENU.js - Reitaku Radial Menu — rebuilt and debugged
 * - Precise positioning: uses clientX/clientY and CSS translate(-50%,-50%) for exact center
 * - Long-press and triple-tap to open
 * - Scrim only captures pointer events when active
 * - Open/close animations: .active and .animated classes, close waits for transitionend
 * - Graceful fallbacks for icons (emoji). Lightweight particle pulse on open.
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
  'use strict';

  // Configuration
  const LONG_PRESS_MS = 360;
  const TRIPLE_TAP_DELAY_MS = 300;
  const MOVE_THRESHOLD = 10;
  const SHELL_RADII = [110, 180, 250];
  const SHELL_CAPACITIES = [6, 10, 14];

  // DOM refs
  let wrapper = null;
  let scrim = null;
  let canvas = null;
  let ctx = null;
  let orbits = null;
  let itemsHost = null;
  let coreBtn = null;

  // State
  let isOpen = false;
  let stack = [];
  let longPressTimer = null;
  let tapCount = 0;
  let tapTimer = null;
  let startX = 0, startY = 0;
  let openPoint = { x: 0, y: 0 };

  function ensureDOM() {
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

    scrim = document.createElement('div');
    scrim.className = 'rm-scrim';
    scrim.addEventListener('click', close);
    scrim.style.pointerEvents = 'none';
    document.body.appendChild(scrim);

    wrapper = document.createElement('div');
    wrapper.className = 'radial-menu-wrapper';
    wrapper.setAttribute('role', 'navigation');
    wrapper.setAttribute('aria-hidden', 'true');

    canvas = document.createElement('canvas');
    canvas.className = 'rm-canvas-layer';
    wrapper.appendChild(canvas);
    ctx = canvas.getContext && canvas.getContext('2d');

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
    coreBtn.innerHTML = '✕';
    coreBtn.addEventListener('click', (e) => { e.stopPropagation(); onCoreClick(); });
    wrapper.appendChild(coreBtn);

    document.body.appendChild(wrapper);
  }

  function setCanvasSize(px) {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = px + 'px';
    canvas.style.height = px + 'px';
    canvas.width = Math.floor(px * dpr);
    canvas.height = Math.floor(px * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pulseParticles() {
    if (!ctx) return;
    const SIZE = 260;
    setCanvasSize(SIZE);
    const cX = SIZE / 2, cY = SIZE / 2;
    let t = 0;
    const maxT = 36;
    const theme = getThemeColors();

    function step() {
      ctx.clearRect(0, 0, SIZE, SIZE);
      // rings
      const rings = [ {r: 8, a: 1, color: theme.main}, {r:4, a:0.9, color: theme.balance}, {r:2,a:0.7,color:'rgba(255,255,255,0.9)'} ];
      rings.forEach((rg, i) => {
        const rr = rg.r + t * (6 + i * 2);
        const alpha = Math.max(0, rg.a - t * 0.03 - i * 0.02);
        if (alpha <= 0) return;
        ctx.beginPath(); ctx.arc(cX, cY, rr, 0, Math.PI * 2);
        ctx.strokeStyle = colorToRGBA(rg.color, alpha);
        ctx.lineWidth = 2.2 - i * 0.5;
        ctx.stroke();
      });

      // small particles
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2 + Math.random() * 0.4;
        const spd = Math.random() * 6 + 1.5;
        const x = cX + Math.cos(a) * (8 + t * spd * 0.6);
        const y = cY + Math.sin(a) * (8 + t * spd * 0.6);
        ctx.beginPath(); ctx.arc(x, y, Math.max(0.6, 2 - t * 0.03), 0, Math.PI * 2);
        ctx.fillStyle = (i % 3 === 0) ? theme.main : theme.balance;
        ctx.globalAlpha = Math.max(0, 1 - t * 0.03);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      t++;
      if (t < maxT) requestAnimationFrame(step); else ctx.clearRect(0,0,SIZE,SIZE);
    }
    step();
  }

  function colorToRGBA(c, a) {
    if (!c) return 'rgba(232,185,35,'+a+')';
    // if already rgba/hsla, try to insert alpha, otherwise return c
    if (/^rgba?\(/.test(c) || /^hsla?\(/.test(c)) return c;
    return c + (a < 1 ? '' : '');
  }

  function getThemeColors() {
    const s = getComputedStyle(document.documentElement);
    const main = (s.getPropertyValue('--main-color') || '#E8B923').trim();
    const balance = (s.getPropertyValue('--balance-color') || '#22A06B').trim();
    return { main, balance };
  }

  function computeLayout(items) {
    const layout = [];
    let remaining = items.length;
    let idx = 0;
    for (let s = 0; s < SHELL_CAPACITIES.length && remaining > 0; s++) {
      const cap = SHELL_CAPACITIES[s];
      const count = Math.min(remaining, cap);
      const r = SHELL_RADII[s];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const x = Math.round(Math.cos(angle) * r);
        const y = Math.round(Math.sin(angle) * r);
        layout.push({ item: items[idx], x, y, shell: s });
        idx++;
      }
      remaining -= count;
    }
    return layout;
  }

  function clearItems() {
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
      btn.setAttribute('aria-label', d.item.label + (d.item.items ? ' サブメニューあり' : ''));
      btn.innerHTML = d.item.icon || '•';
      btn.style.setProperty('--x', d.x + 'px');
      btn.style.setProperty('--y', d.y + 'px');
      btn.style.transitionDelay = (i * 28) + 'ms';

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (d.item.items && d.item.items.length) {
          stack.push(items);
          renderLevel(d.item.items);
          pulseParticles();
        } else if (d.item.url) {
          // close then navigate
          close(() => { location.href = d.item.url; });
        }
      });

      btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });

      itemsHost.appendChild(btn);
      // show with animation
      requestAnimationFrame(() => btn.classList.add('rendered'));
    });

    // create orbit rings
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

    if (stack.length > 0) coreBtn.classList.add('visible'); else coreBtn.classList.remove('visible');

    setTimeout(() => {
      const first = itemsHost.querySelector('.rm-item');
      if (first) first.focus(); else coreBtn.focus();
    }, 260);
  }

  function onCoreClick() {
    if (stack.length > 0) {
      const prev = stack.pop();
      renderLevel(prev);
      pulseParticles();
    } else {
      close();
    }
  }

  // open: set coords, show, run animation, render items
  function open(x, y) {
    ensureDOM();
    openPoint.x = Math.max(80, Math.min(x, window.innerWidth - 80));
    openPoint.y = Math.max(80, Math.min(y, window.innerHeight - 80));

    wrapper.style.left = openPoint.x + 'px';
    wrapper.style.top = openPoint.y + 'px';

    wrapper.classList.add('active');
    wrapper.setAttribute('aria-hidden', 'false');
    // animated class gives secondary effects; set on next frame
    requestAnimationFrame(() => wrapper.classList.add('animated'));

    if (scrim) {
      scrim.classList.add('active');
      scrim.style.pointerEvents = 'auto';
    }

    isOpen = true;
    stack = [];
    renderLevel(RADIAL_MENU_DATA);
    pulseParticles();
  }

  // close: remove animated then wait for transition end before fully hiding
  function close(callback) {
    if (!wrapper) { if (callback) callback(); return; }
    wrapper.classList.remove('animated');

    const onEnd = function (ev) {
      if (ev.target !== wrapper) return;
      if (ev.propertyName && ev.propertyName.indexOf('opacity') === -1) return;
      wrapper.classList.remove('active');
      wrapper.setAttribute('aria-hidden', 'true');
      if (scrim) { scrim.classList.remove('active'); scrim.style.pointerEvents = 'none'; }
      wrapper.removeEventListener('transitionend', onEnd);
      clearItems();
      isOpen = false;
      if (typeof callback === 'function') callback();
    };

    wrapper.addEventListener('transitionend', onEnd);
    // fallback
    setTimeout(() => {
      if (wrapper.classList.contains('active')) {
        wrapper.classList.remove('active');
        wrapper.setAttribute('aria-hidden', 'true');
        if (scrim) { scrim.classList.remove('active'); scrim.style.pointerEvents = 'none'; }
        clearItems();
        isOpen = false;
        try { wrapper.removeEventListener('transitionend', onEnd); } catch (e) {}
        if (typeof callback === 'function') callback();
      }
    }, 600);
  }

  // global pointer handlers for long-press / triple-tap
  function onPointerDown(e) {
    // if clicking inside menu, let it pass
    if (isOpen && wrapper && wrapper.contains(e.target)) return;
    if (isOpen && wrapper && !wrapper.contains(e.target) && !(scrim && scrim.contains(e.target))) { close(); return; }
    if (isOpen) return;

    startX = e.clientX; startY = e.clientY;
    tapCount++; clearTimeout(tapTimer);

    if (tapCount === 3) { clearTimeout(longPressTimer); longPressTimer = null; tapCount = 0; open(startX, startY); return; }

    tapTimer = setTimeout(() => { tapCount = 0; }, TRIPLE_TAP_DELAY_MS);

    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => { tapCount = 0; open(startX, startY); }, LONG_PRESS_MS);
  }

  function onPointerMove(e) {
    if (!longPressTimer || isOpen) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) { clearTimeout(longPressTimer); longPressTimer = null; }
  }

  function onPointerUp() {
    if (longPressTimer && !isOpen) { clearTimeout(longPressTimer); longPressTimer = null; }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' && isOpen) { close(); return; }
    if (!isOpen) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); focusMove(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); focusMove(-1); }
    else if (e.key === 'Enter' || e.key === ' ') { const el = document.activeElement; if (el && el.classList && el.classList.contains('rm-item')) el.click(); }
  }

  function focusMove(delta) {
    if (!itemsHost) return;
    const buttons = Array.from(itemsHost.querySelectorAll('.rm-item.rendered'));
    if (!buttons.length) return;
    const active = document.activeElement;
    let idx = buttons.indexOf(active);
    if (idx === -1) idx = 0;
    idx = (idx + delta + buttons.length) % buttons.length;
    buttons[idx].focus();
  }

  function bind() {
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', () => { if (isOpen) open(openPoint.x, openPoint.y); });
  }

  function boot() {
    ensureDOM(); bind();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
