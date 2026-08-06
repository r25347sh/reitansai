/**
 * MENU/MENU.js - 麗探祭 放射状メニュー v3
 * Scrim + premium gold particles
 */
const RADIAL_MENU_DATA = [
  { label: 'ホーム', icon: '🏠', url: '/reitansai/index.html' },
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
      { label: '遊びの探究ゼミ', icon: '🎮', url: '/reitansai/pages/zemi/asobi-tankyu.html' },
      {
        label: '外部企業ゼミ',
        icon: '🏢',
        items: [
          { label: '映像編集ゼミ', icon: '⏯️', url: '/reitansai/pages/zemi/mieta/eizo-henshu.html' },
          { label: 'デジタルコンテンツ制作ゼミ', icon: '💻', url: '/reitansai/pages/zemi/mieta/digital-content-create.html' },
          { label: 'イベント企画ゼミ', icon: '🎪', url: '/reitansai/pages/zemi/mieta/event-kikaku.html' }
        ]
      }
    ]
  },
  { label: '麗探祭', icon: '🎉', url: '/reitansai/pages/event.html' },
  { label: 'このサイトについて', icon: '⭐', url: '/reitansai/pages/aboutsite.html' },
  { label: 'テーマ設定', icon: '⚙️', url: '/reitansai/pages/settings.html' }
];

(function () {
  const LONG_PRESS_MS = 360;
  const TRIPLE_TAP_DELAY_MS = 300;
  const MOVE_THRESHOLD = 8;
  const SHELL_CAPACITIES = [6, 10, 14];
  const SHELL_RADII = [115, 185, 255];

  let menuEl = null;
  let scrimEl = null;
  let itemsContainer = null;
  let orbitsContainer = null;
  let coreBtn = null;
  let canvas = null;
  let ctx = null;
  let timer = null;
  let startX = 0, startY = 0;
  let isOpen = false;
  let menuStack = [];
  let tapCount = 0;
  let tapTimer = null;

  function navigateWithDelay(url) {
    closeMenu();
    setTimeout(() => { location.href = url; }, 180);
  }

  function triggerParticleBurst() {
    if (!canvas || !ctx) return;
    canvas.width = 600;
    canvas.height = 600;
    const cX = 300, cY = 300;
    let ring1Radius = 8, ring1Alpha = 1;
    let ring2Radius = 4, ring2Alpha = 0.9;
    let ring3Radius = 2, ring3Alpha = 0.7;

    const particles = Array.from({ length: 42 }, (_, idx) => {
      const a = (idx / 42) * Math.PI * 2 + Math.random() * 0.2;
      const spd = Math.random() * 8 + 2.5;
      const isGold = Math.random() > 0.35;
      return {
        x: cX, y: cY,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: Math.random() * 2.8 + 1.2,
        color: isGold
          ? `hsla(${42 + Math.random() * 18}, 90%, ${55 + Math.random() * 25}%, 1)`
          : `hsla(${140 + Math.random() * 30}, 70%, ${40 + Math.random() * 20}%, 1)`,
        alpha: 1,
        drag: 0.91 + Math.random() * 0.04
      };
    });

    function draw() {
      ctx.clearRect(0, 0, 600, 600);

      if (ring1Alpha > 0) {
        ctx.beginPath();
        ctx.arc(cX, cY, ring1Radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 197, 71, ${ring1Alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ring1Radius += 9;
        ring1Alpha -= 0.045;
      }
      if (ring2Alpha > 0) {
        ctx.beginPath();
        ctx.arc(cX, cY, ring2Radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(248, 224, 138, ${ring2Alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ring2Radius += 7;
        ring2Alpha -= 0.04;
      }
      if (ring3Alpha > 0) {
        ctx.beginPath();
        ctx.arc(cX, cY, ring3Radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(26, 122, 69, ${ring3Alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ring3Radius += 5.5;
        ring3Alpha -= 0.035;
      }

      let alive = false;
      particles.forEach(p => {
        if (p.alpha <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.alpha -= 0.028;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      if (ring1Alpha > 0 || ring2Alpha > 0 || ring3Alpha > 0 || alive) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, 600, 600);
      }
    }
    draw();
  }

  function calculateShellLayout(items) {
    const layout = [];
    let remaining = items.length, itemIdx = 0;
    for (let sIdx = 0; sIdx < SHELL_CAPACITIES.length && remaining > 0; sIdx++) {
      const capacity = SHELL_CAPACITIES[sIdx];
      const countInShell = Math.min(remaining, capacity);
      const radius = SHELL_RADII[sIdx];
      for (let i = 0; i < countInShell; i++) {
        const angle = (i / countInShell) * 2 * Math.PI - (Math.PI / 2);
        layout.push({
          item: items[itemIdx],
          x: Math.round(Math.cos(angle) * radius),
          y: Math.round(Math.sin(angle) * radius),
          shellIndex: sIdx
        });
        itemIdx++;
      }
      remaining -= countInShell;
    }
    return layout;
  }

  function renderMenuLevel(items) {
    itemsContainer.querySelectorAll('.rm-item').forEach(el => {
      el.classList.remove('rendered');
      setTimeout(() => el.remove(), 220);
    });
    orbitsContainer.innerHTML = '';
    const layout = calculateShellLayout(items);
    const activeShells = new Set();

    layout.forEach((data, index) => {
      activeShells.add(data.shellIndex);
      const btn = document.createElement('button');
      btn.className = 'rm-item' + (data.item.items ? ' has-sub' : '');
      btn.type = 'button';
      btn.setAttribute('data-label', data.item.label);
      btn.innerHTML = data.item.icon || '•';
      btn.style.setProperty('--x', data.x + 'px');
      btn.style.setProperty('--y', data.y + 'px');
      btn.style.transitionDelay = (index * 0.028) + 's';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (data.item.items && data.item.items.length > 0) {
          menuStack.push(items);
          renderMenuLevel(data.item.items);
          triggerParticleBurst();
        } else if (data.item.url) {
          navigateWithDelay(data.item.url);
        }
      });
      itemsContainer.appendChild(btn);
      requestAnimationFrame(() => setTimeout(() => btn.classList.add('rendered'), 12));
    });

    activeShells.forEach(sIdx => {
      const orbit = document.createElement('div');
      orbit.className = 'rm-shell-orbit';
      const d = SHELL_RADII[sIdx] * 2;
      orbit.style.width = d + 'px';
      orbit.style.height = d + 'px';
      orbit.style.marginTop = -SHELL_RADII[sIdx] + 'px';
      orbit.style.marginLeft = -SHELL_RADII[sIdx] + 'px';
      orbit.style.transitionDelay = (sIdx * 0.06) + 's';
      orbitsContainer.appendChild(orbit);
    });

    if (menuStack.length > 0) coreBtn.classList.add('visible');
    else coreBtn.classList.remove('visible');
  }

  function createMenuDOM() {
    if (document.querySelector('.radial-menu-wrapper')) return;

    scrimEl = document.createElement('div');
    scrimEl.className = 'rm-scrim';
    scrimEl.addEventListener('click', () => closeMenu());
    document.body.appendChild(scrimEl);

    menuEl = document.createElement('div');
    menuEl.className = 'radial-menu-wrapper';
    menuEl.setAttribute('role', 'navigation');

    canvas = document.createElement('canvas');
    canvas.className = 'rm-canvas-layer';
    ctx = canvas.getContext('2d');
    menuEl.appendChild(canvas);

    orbitsContainer = document.createElement('div');
    menuEl.appendChild(orbitsContainer);

    itemsContainer = document.createElement('div');
    menuEl.appendChild(itemsContainer);

    coreBtn = document.createElement('button');
    coreBtn.className = 'rm-core-btn';
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
    menuEl.appendChild(coreBtn);
    document.body.appendChild(menuEl);
  }

  function openMenu(x, y) {
    if (!menuEl) createMenuDOM();
    const margin = 190;
    menuEl.style.left = Math.max(margin, Math.min(x, window.innerWidth - margin)) + 'px';
    menuEl.style.top = Math.max(margin, Math.min(y, window.innerHeight - margin)) + 'px';
    menuEl.classList.add('active');
    if (scrimEl) scrimEl.classList.add('active');
    isOpen = true;
    menuStack = [];
    renderMenuLevel(RADIAL_MENU_DATA);
    triggerParticleBurst();
  }

  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    if (scrimEl) scrimEl.classList.remove('active');
    itemsContainer.querySelectorAll('.rm-item').forEach(el => el.classList.remove('rendered'));
    coreBtn.classList.remove('visible');
    isOpen = false;
  }

  function initEvents() {
    document.addEventListener('pointerdown', (e) => {
      if (isOpen && menuEl && menuEl.contains(e.target)) return;
      if (isOpen && menuEl && !menuEl.contains(e.target) && !(scrimEl && scrimEl.contains(e.target))) {
        closeMenu();
        return;
      }
      if (isOpen) return;

      startX = e.clientX;
      startY = e.clientY;
      tapCount++;
      clearTimeout(tapTimer);

      if (tapCount === 3) {
        clearTimeout(timer);
        timer = null;
        tapCount = 0;
        openMenu(startX, startY);
        return;
      }

      tapTimer = setTimeout(() => { tapCount = 0; }, TRIPLE_TAP_DELAY_MS);
      clearTimeout(timer);
      timer = setTimeout(() => {
        tapCount = 0;
        openMenu(startX, startY);
      }, LONG_PRESS_MS);
    });

    document.addEventListener('pointermove', (e) => {
      if (!timer || isOpen) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) {
        clearTimeout(timer);
        timer = null;
      }
    });

    document.addEventListener('pointerup', () => {
      if (timer && !isOpen) {
        clearTimeout(timer);
        timer = null;
      }
    });

    document.addEventListener('contextmenu', (e) => { if (isOpen) e.preventDefault(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) closeMenu(); });
  }

  function boot() { createMenuDOM(); initEvents(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
