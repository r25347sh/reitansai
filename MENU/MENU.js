/**
 * Radial Menu — Reitansai
 * ログイン状態は localStorage + sessionStorage の reitansai_user を参照
 */
(function () {
  const SESSION_KEY = 'reitansai_user';
  const path = location.pathname;
  let root = '';
  if (path.includes('/pages/seminars/')) root = '../../';
  else if (path.includes('/pages/')) root = '../';

  function getUser() {
    try {
      const raw =
        localStorage.getItem(SESSION_KEY) ||
        sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function buildMenuData() {
    const data = [
      { label: 'ホーム', icon: '🏠', url: root + 'index.html' },
      { label: '麗誕祭とは', icon: '🌲', url: root + 'pages/about_reitansai.html' },
      { label: 'サイトについて', icon: 'ℹ️', url: root + 'pages/aboutThisSite.html' },
      { label: 'MAP', icon: '🗺️', url: root + 'map.html' },
      {
        label: 'ゼミ一覧',
        icon: '📚',
        items: [
          { label: 'AI', icon: '🤖', url: root + 'pages/seminars/ai.html' },
          { label: '教育', icon: '📖', url: root + 'pages/seminars/kyouiku.html' },
          { label: '国際', icon: '🌍', url: root + 'pages/seminars/kokusai.html' },
          { label: '文芸', icon: '✍️', url: root + 'pages/seminars/bungei.html' },
          { label: '化学', icon: '🧪', url: root + 'pages/seminars/kagaku.html' },
          { label: '文学', icon: '📚', url: root + 'pages/seminars/bungaku.html' },
          { label: 'メディア', icon: '📡', url: root + 'pages/seminars/media.html' },
          { label: '社会', icon: '🏛️', url: root + 'pages/seminars/syakai.html' },
          { label: '農業', icon: '🌾', url: root + 'pages/seminars/nougyou.html' },
          { label: '観光', icon: '🏞️', url: root + 'pages/seminars/kankou.html' },
          { label: '語学', icon: '🌐', url: root + 'pages/seminars/gogaku.html' },
          { label: '遊び', icon: '🎲', url: root + 'pages/seminars/asobi.html' },
          { label: '映像', icon: '🎬', url: root + 'pages/seminars/eizou.html' },
          { label: 'デジタル', icon: '💻', url: root + 'pages/seminars/digi.html' },
          { label: 'イベント', icon: '🎉', url: root + 'pages/seminars/event.html' }
        ]
      },
      { label: '瀧村', icon: '🌿', url: root + 'pages/takimura_t.html' }
    ];
    if (getUser()) {
      data.push({ label: 'CMS', icon: '✏️', url: root + 'admin.html' });
    }
    return data;
  }

  const LONG_PRESS_MS = 380;
  const TRIPLE_TAP_DELAY_MS = 320;
  const MOVE_THRESHOLD = 10;
  const SHELL_CAPACITIES = [6, 10, 14];
  const SHELL_RADII = [118, 188, 258];
  let menuEl, itemsContainer, orbitsContainer, coreBtn;
  let timer, startX, startY, isOpen = false, menuStack = [], tapCount = 0, tapTimer;

  function navigateWithDelay(url) {
    closeMenu();
    setTimeout(() => {
      location.href = url;
    }, 160);
  }

  function calculateShellLayout(items) {
    const layout = [];
    let remaining = items.length;
    let itemIdx = 0;
    for (let sIdx = 0; sIdx < SHELL_CAPACITIES.length && remaining > 0; sIdx++) {
      const count = Math.min(remaining, SHELL_CAPACITIES[sIdx]);
      const radius = SHELL_RADII[sIdx];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        layout.push({
          item: items[itemIdx],
          x: Math.round(Math.cos(angle) * radius),
          y: Math.round(Math.sin(angle) * radius),
          shellIndex: sIdx
        });
        itemIdx++;
      }
      remaining -= count;
    }
    return layout;
  }

  function renderMenuLevel(items) {
    itemsContainer.querySelectorAll('.rm-item').forEach((el) => {
      el.classList.remove('rendered');
      setTimeout(() => el.remove(), 200);
    });
    orbitsContainer.innerHTML = '';
    const layout = calculateShellLayout(items);
    const activeShells = new Set();
    layout.forEach((data, index) => {
      activeShells.add(data.shellIndex);
      const btn = document.createElement('button');
      btn.className = 'rm-item' + (data.item.items ? ' has-sub' : '');
      btn.setAttribute('data-label', data.item.label);
      btn.innerHTML = data.item.icon;
      btn.style.setProperty('--x', data.x + 'px');
      btn.style.setProperty('--y', data.y + 'px');
      btn.style.transitionDelay = index * 0.022 + 's';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (data.item.items && data.item.items.length) {
          menuStack.push(items);
          renderMenuLevel(data.item.items);
        } else if (data.item.url) {
          navigateWithDelay(data.item.url);
        }
      });
      itemsContainer.appendChild(btn);
      requestAnimationFrame(() => setTimeout(() => btn.classList.add('rendered'), 12));
    });
    activeShells.forEach((sIdx) => {
      const orbit = document.createElement('div');
      orbit.className = 'rm-shell-orbit';
      const d = SHELL_RADII[sIdx] * 2;
      orbit.style.width = d + 'px';
      orbit.style.height = d + 'px';
      orbit.style.marginTop = -SHELL_RADII[sIdx] + 'px';
      orbit.style.marginLeft = -SHELL_RADII[sIdx] + 'px';
      orbitsContainer.appendChild(orbit);
    });
    coreBtn.classList.toggle('visible', menuStack.length > 0);
  }

  function createMenuDOM() {
    menuEl = document.createElement('div');
    menuEl.className = 'radial-menu-wrapper';
    orbitsContainer = document.createElement('div');
    menuEl.appendChild(orbitsContainer);
    itemsContainer = document.createElement('div');
    menuEl.appendChild(itemsContainer);
    coreBtn = document.createElement('button');
    coreBtn.className = 'rm-core-btn';
    coreBtn.innerHTML = '←';
    coreBtn.setAttribute('aria-label', '戻る');
    coreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (menuStack.length) renderMenuLevel(menuStack.pop());
      else closeMenu();
    });
    menuEl.appendChild(coreBtn);
    document.body.appendChild(menuEl);
  }

  function openMenu(x, y) {
    if (!menuEl) return;
    const margin = 170;
    const cx = typeof x === 'number' ? x : window.innerWidth / 2;
    const cy = typeof y === 'number' ? y : window.innerHeight / 2;
    menuEl.style.left = Math.max(margin, Math.min(cx, window.innerWidth - margin)) + 'px';
    menuEl.style.top = Math.max(margin, Math.min(cy, window.innerHeight - margin)) + 'px';
    menuEl.classList.add('active');
    isOpen = true;
    menuStack = [];
    renderMenuLevel(buildMenuData());
  }

  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    itemsContainer.querySelectorAll('.rm-item').forEach((el) => el.classList.remove('rendered'));
    coreBtn.classList.remove('visible');
    isOpen = false;
  }

  function mountAuthHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const old = header.querySelector('.header-auth');
    if (old) old.remove();
    const box = document.createElement('div');
    box.className = 'header-auth';
    const user = getUser();
    if (user) {
      box.innerHTML =
        '<span class="auth-name">' +
        (user.name || user.id) +
        '</span>' +
        '<a class="auth-btn auth-cms" href="' +
        root +
        'admin.html">CMS</a>' +
        '<button type="button" class="auth-btn auth-out" id="auth-logout">ログアウト</button>';
      header.appendChild(box);
      document.getElementById('auth-logout')?.addEventListener('click', () => {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        location.reload();
      });
    } else {
      box.innerHTML =
        '<a class="auth-btn auth-in" href="' +
        root +
        'admin.html" title="関係者専用">ログイン</a>';
      header.appendChild(box);
    }
    if (!document.querySelector('.menu-fab')) {
      const fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'menu-fab';
      fab.setAttribute('aria-label', 'メニューを開く');
      fab.innerHTML = '☰';
      fab.title = 'メニューを開く（Ctrl+K / 長押しでも可）';
      document.body.appendChild(fab);
      fab.addEventListener('click', (e) => {
        e.stopPropagation();
        openMenu(window.innerWidth / 2, window.innerHeight * 0.42);
      });
    }
  }

  function initEvents() {
    document.addEventListener('pointerdown', (e) => {
      if (
        e.target.closest('.menu-fab') ||
        e.target.closest('.header-auth') ||
        e.target.closest('.site-header a')
      )
        return;
      if (isOpen && menuEl.contains(e.target)) return;
      if (isOpen && !menuEl.contains(e.target)) {
        closeMenu();
        return;
      }
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
      tapTimer = setTimeout(() => {
        tapCount = 0;
      }, TRIPLE_TAP_DELAY_MS);
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
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) closeMenu();
        else openMenu(window.innerWidth / 2, window.innerHeight / 2);
      }
      if (e.key === 'Escape' && isOpen) closeMenu();
    });
    window.addEventListener('reitansai:open-menu', (ev) => {
      openMenu(ev.detail?.x, ev.detail?.y);
    });
    window.addEventListener('reitansai:auth-changed', () => {
      mountAuthHeader();
    });
    window.addEventListener('storage', (e) => {
      if (e.key === SESSION_KEY) mountAuthHeader();
    });
  }

  function boot() {
    createMenuDOM();
    initEvents();
    mountAuthHeader();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
