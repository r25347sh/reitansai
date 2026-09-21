/**
 * Reitansai Radial Menu — high contrast labels + FAB
 */
(function () {
  'use strict';

  var path = location.pathname;
  function rootPath() {
    if (path.indexOf('/pages/seminars/') >= 0) return '../../';
    if (path.indexOf('/pages/') >= 0) return '../';
    return './';
  }
  var root = rootPath();

  function abs(url) {
    if (!url) return '#';
    if (url.startsWith('http') || url.startsWith('/')) return url;
    return root + url.replace(/^\.\//, '');
  }

  function buildMenuData() {
    return [
      { label: 'ホーム', icon: '🏠', url: abs('index.html') },
      { label: 'スケジュール', icon: '📅', url: abs('pages/schedule.html') },
      {
        label: 'ゼミ一覧', icon: '🎓', items: [
          { label: 'データサイエンス探究AI', icon: '📊', url: abs('pages/seminars/データサイエンス探究AIゼミ.html') },
          { label: '教育ゼミ', icon: '📚', url: abs('pages/seminars/教育ゼミ.html') },
          { label: '国際地域研究', icon: '🌍', url: abs('pages/seminars/国際地域研究ゼミ.html') },
          { label: '文芸小説創作', icon: '✍️', url: abs('pages/seminars/文芸小説創作ゼミ.html') },
          { label: '化学ゼミ', icon: '⚗️', url: abs('pages/seminars/化学ゼミ.html') },
          { label: '文学ゼミ', icon: '📖', url: abs('pages/seminars/文学ゼミ.html') },
          { label: 'メディアゼミ', icon: '📡', url: abs('pages/seminars/メディアゼミ.html') },
          { label: '社会ゼミ', icon: '🏛️', url: abs('pages/seminars/社会ゼミ.html') },
          { label: '農業ゼミ', icon: '🌱', url: abs('pages/seminars/農業ゼミ.html') },
          { label: '観光ゼミ', icon: '🗺️', url: abs('pages/seminars/観光ゼミ.html') },
          { label: '語学ゼミ', icon: '🗣️', url: abs('pages/seminars/語学ゼミ.html') },
          { label: '遊びの探究', icon: '🎮', url: abs('pages/seminars/遊びの探究ゼミ.html') },
          { label: 'デジタルコンテンツ制作', icon: '💻', url: abs('pages/seminars/デジタルコンテンツ制作ゼミ.html') },
          { label: '映像編集', icon: '🎬', url: abs('pages/seminars/映像編集ゼミ.html') },
          { label: 'イベント企画', icon: '🎉', url: abs('pages/seminars/イベント企画ゼミ.html') },
          { label: '道徳ゼミ', icon: '☯️', url: abs('pages/seminars/道徳ゼミ.html') }
        ]
      },
      { label: 'ゼミトップ', icon: '📋', url: abs('pages/seminars/index.html') },
      { label: 'About', icon: 'ℹ️', url: abs('pages/about_This_Site.html') },
      { label: 'サイトマップ', icon: '🗺️', url: abs('sitemap.html') }
    ];
  }

  var LONG_PRESS_MS = 360;
  var TRIPLE_TAP_DELAY_MS = 300;
  var MOVE_THRESHOLD = 8;
  var SHELL_CAPACITIES = [6, 10, 14];
  var SHELL_RADII = [118, 190, 262];
  var menuEl, itemsContainer, orbitsContainer, coreBtn;
  var timer, startX, startY, isOpen = false, menuStack = [];
  var pieDisabled = false;
  var tapCount = 0, tapTimer = null;

  function navigateWithDelay(url) {
    closeMenu();
    setTimeout(function () { location.href = url; }, 180);
  }

  function calculateShellLayout(items) {
    var layout = [], remaining = items.length, itemIdx = 0;
    for (var sIdx = 0; sIdx < SHELL_CAPACITIES.length && remaining > 0; sIdx++) {
      var count = Math.min(remaining, SHELL_CAPACITIES[sIdx]);
      var radius = SHELL_RADII[sIdx];
      for (var i = 0; i < count; i++) {
        var angle = (i / count) * 2 * Math.PI - Math.PI / 2;
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
    var old = itemsContainer.querySelectorAll('.rm-item');
    for (var i = 0; i < old.length; i++) {
      old[i].classList.remove('rendered');
      (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220); })(old[i]);
    }
    orbitsContainer.innerHTML = '';
    var layout = calculateShellLayout(items);
    var activeShells = {};
    layout.forEach(function (data, index) {
      activeShells[data.shellIndex] = true;
      var btn = document.createElement('button');
      btn.className = 'rm-item' + (data.item.items ? ' has-sub' : '');
      btn.setAttribute('data-label', data.item.label);
      btn.setAttribute('aria-label', data.item.label);
      btn.innerHTML = data.item.icon || '•';
      btn.style.setProperty('--x', data.x + 'px');
      btn.style.setProperty('--y', data.y + 'px');
      btn.style.transitionDelay = (index * 0.024) + 's';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (data.item.items && data.item.items.length) {
          menuStack.push(items);
          renderMenuLevel(data.item.items);
        } else if (data.item.url) {
          navigateWithDelay(data.item.url);
        }
      });
      itemsContainer.appendChild(btn);
      requestAnimationFrame(function () {
        setTimeout(function () { btn.classList.add('rendered'); }, 14);
      });
    });
    Object.keys(activeShells).forEach(function (sIdx) {
      sIdx = +sIdx;
      var orbit = document.createElement('div');
      orbit.className = 'rm-shell-orbit';
      var d = SHELL_RADII[sIdx] * 2;
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
    coreBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menuStack.length) renderMenuLevel(menuStack.pop());
      else closeMenu();
    });
    menuEl.appendChild(coreBtn);
    document.body.appendChild(menuEl);
  }

  function openMenu(x, y) {
    if (!menuEl) return;
    var margin = 180;
    menuEl.style.left = Math.max(margin, Math.min(x || window.innerWidth / 2, window.innerWidth - margin)) + 'px';
    menuEl.style.top = Math.max(margin, Math.min(y || window.innerHeight / 2, window.innerHeight - margin)) + 'px';
    menuEl.classList.add('active');
    isOpen = true;
    menuStack = [];
    renderMenuLevel(buildMenuData());
  }

  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    itemsContainer.querySelectorAll('.rm-item').forEach(function (i) { i.classList.remove('rendered'); });
    coreBtn.classList.remove('visible');
    isOpen = false;
  }

  function mountFab() {
    if (document.querySelector('.menu-fab')) return;
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'menu-fab';
    fab.setAttribute('aria-label', 'メニューを開く');
    fab.innerHTML = '☰';
    document.body.appendChild(fab);
    fab.onclick = function (e) {
      e.stopPropagation();
      openHamburger();
    };
  }

  function initEvents() {
    document.addEventListener('pointerdown', function (e) {
      if (e.target.closest && (e.target.closest('.menu-fab') || e.target.closest('.radial-menu-wrapper') || e.target.closest('#ham-panel') || e.target.closest('#ham-overlay') || e.target.closest('.site-header'))) return;
      if (isOpen && menuEl && !menuEl.contains(e.target)) { closeMenu(); return; }
      startX = e.clientX; startY = e.clientY;
      tapCount++;
      clearTimeout(tapTimer);
      if (tapCount === 3) {
        clearTimeout(timer); timer = null; tapCount = 0;
        if (!pieDisabled) openMenu(startX, startY);
        return;
      }
      tapTimer = setTimeout(function () { tapCount = 0; }, TRIPLE_TAP_DELAY_MS);
      if (pieDisabled) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (pieDisabled) return;
        tapCount = 0;
        openMenu(startX, startY);
      }, LONG_PRESS_MS);
    });
    document.addEventListener('pointermove', function (e) {
      if (!timer || isOpen) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) {
        clearTimeout(timer); timer = null;
      }
    });
    document.addEventListener('pointerup', function () {
      if (timer && !isOpen) { clearTimeout(timer); timer = null; }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (pieDisabled) return;
        if (isOpen) closeMenu(); else openMenu();
      }
      if (e.key === 'Escape') {
        if (pieDisabled) closeHamburger();
        if (isOpen) closeMenu();
      }
    });
  }

  function ensureHamburgerUI() {
    if (document.getElementById('ham-overlay')) return;
    var style = document.createElement('style');
    style.id = 'ham-style';
    style.textContent =
      '#ham-overlay{position:fixed;inset:0;z-index:100000;display:none;background:rgba(5,8,14,.75);backdrop-filter:blur(8px)}' +
      '#ham-overlay.open{display:block}' +
      '#ham-panel{position:fixed;inset:0;z-index:100001;display:none;flex-direction:column;background:#0b0e14;color:#e8eef7;padding:1.25rem;overflow:auto}' +
      '#ham-panel.open{display:flex}' +
      '#ham-list{display:flex;flex-direction:column;gap:.5rem}' +
      '.ham-link,.ham-group-btn{display:block;width:100%;text-align:left;padding:.95rem 1.05rem;border-radius:4px;background:#151a24;border:1px solid rgba(201,162,39,0.35);color:#f0f4fa;text-decoration:none;font:inherit;font-weight:700;font-size:0.95rem;cursor:pointer;letter-spacing:0.04em}' +
      '.ham-link:hover,.ham-group-btn:hover{background:#c9a227;color:#0b0e14;border-color:#f0d060}' +
      '.ham-sub{display:none;flex-direction:column;gap:.3rem;padding:0.4rem 0 0.4rem 0.75rem}' +
      '.ham-sub a{color:#e8eef7;text-decoration:none;padding:.55rem .75rem;border-radius:4px;font-weight:600;font-size:0.88rem;background:#12161f;border:1px solid rgba(255,255,255,0.08)}' +
      '.ham-sub a:hover{background:#1c2330;border-color:rgba(201,162,39,0.4);color:#c9a227}' +
      '.ham-close{border:1px solid rgba(201,162,39,0.5);background:#151a24;color:#c9a227;width:42px;height:42px;border-radius:4px;cursor:pointer;font-size:1.1rem;font-weight:700}' +
      '.ham-close:hover{background:#c9a227;color:#0b0e14}' +
      '#ham-title{font-family:Shippori Mincho,serif;font-weight:700;font-size:1.15rem;letter-spacing:0.12em;color:#e8eef7}';
    document.head.appendChild(style);
    var ov = document.createElement('div');
    ov.id = 'ham-overlay';
    var panel = document.createElement('div');
    panel.id = 'ham-panel';
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem"><div id="ham-title">麗探祭 MENU</div><button type="button" class="ham-close" id="ham-close" aria-label="閉じる">✕</button></div><div id="ham-list"></div>';
    document.body.appendChild(ov);
    document.body.appendChild(panel);
    document.getElementById('ham-close').onclick = closeHamburger;
    ov.onclick = closeHamburger;
  }

  function openHamburger() {
    ensureHamburgerUI();
    pieDisabled = true;
    closeMenu();
    var list = document.getElementById('ham-list');
    list.innerHTML = '';
    buildMenuData().forEach(function (item) {
      if (item.items && item.items.length) {
        var wrap = document.createElement('div');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ham-group-btn';
        btn.textContent = (item.icon ? item.icon + ' ' : '') + item.label;
        var sub = document.createElement('div');
        sub.className = 'ham-sub';
        item.items.forEach(function (subItem) {
          var a = document.createElement('a');
          a.href = subItem.url || '#';
          a.textContent = (subItem.icon ? subItem.icon + ' ' : '') + subItem.label;
          sub.appendChild(a);
        });
        btn.onclick = function () { sub.style.display = sub.style.display === 'flex' ? 'none' : 'flex'; };
        wrap.appendChild(btn);
        wrap.appendChild(sub);
        list.appendChild(wrap);
      } else {
        var a = document.createElement('a');
        a.className = 'ham-link';
        a.href = item.url || '#';
        a.textContent = (item.icon ? item.icon + ' ' : '') + item.label;
        list.appendChild(a);
      }
    });
    document.getElementById('ham-overlay').classList.add('open');
    document.getElementById('ham-panel').classList.add('open');
  }

  function closeHamburger() {
    var ov = document.getElementById('ham-overlay');
    var panel = document.getElementById('ham-panel');
    if (ov) ov.classList.remove('open');
    if (panel) panel.classList.remove('open');
    pieDisabled = false;
  }

  function boot() {
    createMenuDOM();
    initEvents();
    mountFab();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
