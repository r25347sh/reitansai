/**
 * Radial Menu — localStorage/sessionStorage の reitansai_user を参照
 */
(function () {
  var SESSION_KEY = 'reitansai_user';
  var path = location.pathname;
  var root = '';
  if (path.indexOf('/pages/seminars/') >= 0) root = '../../';
  else if (path.indexOf('/pages/') >= 0) root = '../';

  function getUser() {
    try {
      var raw =
        localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function buildMenuData() {
    var data = [
      { label: 'ホーム', icon: '🏠', url: root + 'index.html' },
      { label: '麗探祭とは', icon: '🌲', url: root + 'pages/about_reitansai.html' },
      { label: 'サイトについて', icon: 'ℹ️', url: root + 'pages/aboutThisSite.html' },
      { label: 'MAP', icon: '🗺️', url: root + 'map.html' },
      {
        label: 'ゼミ一覧',
        icon: '📚',
        items: [
          { label: '道徳', icon: '⚖️', url: root + 'pages/seminars/doutoku.html' },
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
    if (getUser()) data.push({ label: 'CMS', icon: '✏️', url: root + 'admin.html' });
    return data;
  }

  var LONG_PRESS_MS = 380,
    TRIPLE_TAP_DELAY_MS = 320,
    MOVE_THRESHOLD = 10;
  var SHELL_CAPACITIES = [6, 10, 14],
    SHELL_RADII = [118, 188, 258];
  var menuEl,
    itemsContainer,
    orbitsContainer,
    coreBtn;
  var timer,
    startX,
    startY,
    isOpen = false,
    menuStack = [],
    tapCount = 0,
    tapTimer;

  function navigateWithDelay(url) {
    closeMenu();
    setTimeout(function () {
      location.href = url;
    }, 160);
  }

  function calculateShellLayout(items) {
    var layout = [];
    var remaining = items.length,
      itemIdx = 0;
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
      (function (el) {
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 200);
      })(old[i]);
    }
    orbitsContainer.innerHTML = '';
    var layout = calculateShellLayout(items);
    var activeShells = {};
    layout.forEach(function (data, index) {
      activeShells[data.shellIndex] = true;
      var btn = document.createElement('button');
      btn.className = 'rm-item' + (data.item.items ? ' has-sub' : '');
      btn.setAttribute('data-label', data.item.label);
      btn.innerHTML = data.item.icon;
      btn.style.setProperty('--x', data.x + 'px');
      btn.style.setProperty('--y', data.y + 'px');
      btn.style.transitionDelay = index * 0.022 + 's';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (data.item.items && data.item.items.length) {
          menuStack.push(items);
          renderMenuLevel(data.item.items);
        } else if (data.item.url) navigateWithDelay(data.item.url);
      });
      itemsContainer.appendChild(btn);
      requestAnimationFrame(function () {
        setTimeout(function () {
          btn.classList.add('rendered');
        }, 12);
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
    coreBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menuStack.length) renderMenuLevel(menuStack.pop());
      else closeMenu();
    });
    menuEl.appendChild(coreBtn);
    document.body.appendChild(menuEl);
  }

  function openMenu(x, y) {
    if (pieDisabled) return;
    if (!menuEl) return;
    var margin = 170;
    var cx = typeof x === 'number' ? x : window.innerWidth / 2;
    var cy = typeof y === 'number' ? y : window.innerHeight / 2;
    menuEl.style.left =
      Math.max(margin, Math.min(cx, window.innerWidth - margin)) + 'px';
    menuEl.style.top =
      Math.max(margin, Math.min(cy, window.innerHeight - margin)) + 'px';
    menuEl.classList.add('active');
    isOpen = true;
    menuStack = [];
    renderMenuLevel(buildMenuData());
  }

  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    var items = itemsContainer.querySelectorAll('.rm-item');
    for (var i = 0; i < items.length; i++) items[i].classList.remove('rendered');
    coreBtn.classList.remove('visible');
    isOpen = false;
  }

  function mountAuthHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var old = header.querySelector('.header-auth');
    if (old) old.parentNode.removeChild(old);
    var box = document.createElement('div');
    box.className = 'header-auth';
    var user = getUser();
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
      var lo = document.getElementById('auth-logout');
      if (lo)
        lo.onclick = function () {
          localStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(SESSION_KEY);
          location.reload();
        };
    } else {
      box.innerHTML =
        '<a class="auth-btn auth-in" href="' +
        root +
        'admin.html">ログイン</a>';
      header.appendChild(box);
    }
    if (!document.querySelector('.menu-fab')) {
      var fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'menu-fab';
      fab.innerHTML = '☰';
      fab.setAttribute('aria-label', 'メニュー');
      document.body.appendChild(fab);
      fab.onclick = function (e) {
        e.stopPropagation();
        openMenu(window.innerWidth / 2, window.innerHeight * 0.42);
      };
    }
  }

  function initEvents() {
    document.addEventListener('pointerdown', function (e) {
      if (
        e.target.closest &&
        (e.target.closest('.menu-fab') ||
          e.target.closest('.header-auth') ||
          e.target.closest('.site-header a'))
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
      tapTimer = setTimeout(function () {
        tapCount = 0;
      }, TRIPLE_TAP_DELAY_MS);
      clearTimeout(timer);
      timer = setTimeout(function () {
        tapCount = 0;
        openMenu(startX, startY);
      }, LONG_PRESS_MS);
    });
    document.addEventListener('pointermove', function (e) {
      if (!timer || isOpen) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) {
        clearTimeout(timer);
        timer = null;
      }
    });
    document.addEventListener('pointerup', function () {
      if (timer && !isOpen) {
        clearTimeout(timer);
        timer = null;
      }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) closeMenu();
        else openMenu(window.innerWidth / 2, window.innerHeight / 2);
      }
      if (e.key === 'Escape' && isOpen) closeMenu();
    });
  }


  var pieDisabled = false;

  function ensureHamburgerUI() {
    if (document.getElementById('ham-overlay')) return;
    if (!document.getElementById('ham-style')) {
      var style = document.createElement('style');
      style.id = 'ham-style';
      style.textContent = [
        '#ham-overlay{position:fixed;inset:0;z-index:100000;display:none;background:rgba(5,20,12,.6);backdrop-filter:blur(6px);}',
        '#ham-overlay.open{display:block}',
        '#ham-panel{position:fixed;inset:0;z-index:100001;display:none;flex-direction:column;',
        'background:linear-gradient(165deg,#0b1f14 0%,#143020 55%,#1b5e20 100%);color:#e8f5e9;padding:1.25rem 1.25rem 2rem;overflow:auto}',
        '#ham-panel.open{display:flex}',
        '#ham-panel .ham-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem}',
        '#ham-panel .ham-title{font-weight:700;font-size:1.15rem}',
        '#ham-panel .ham-close{background:transparent;border:1px solid rgba(232,245,233,.25);color:#e8f5e9;border-radius:999px;width:2.4rem;height:2.4rem;font-size:1.2rem;cursor:pointer}',
        '#ham-list{display:flex;flex-direction:column;gap:.55rem}',
        '#ham-list .ham-link,#ham-list .ham-group-btn{display:block;width:100%;text-align:left;padding:.85rem 1rem;border-radius:14px;',
        'background:rgba(255,255,255,.06);border:1px solid rgba(232,245,233,.12);color:#e8f5e9;text-decoration:none;font:inherit;cursor:pointer}',
        '#ham-list .ham-sub{display:flex;flex-direction:column;gap:.35rem;padding:.35rem 0 .35rem 1rem}',
        '#ham-list .ham-sub a{color:#c8e6c9;text-decoration:none;padding:.45rem .6rem;border-radius:10px}',
        '.menu-fab{position:fixed;top:1rem;right:1rem;z-index:99990;width:2.75rem;height:2.75rem;border-radius:999px;',
        'border:1px solid rgba(232,245,233,.2);background:rgba(11,31,20,.85);color:#e8f5e9;font-size:1.25rem;cursor:pointer;',
        'box-shadow:0 8px 24px rgba(0,0,0,.35);backdrop-filter:blur(8px)}'
      ].join('');
      document.head.appendChild(style);
    }
    var overlay = document.createElement('div');
    overlay.id = 'ham-overlay';
    overlay.onclick = closeHamburger;
    var panel = document.createElement('div');
    panel.id = 'ham-panel';
    panel.innerHTML = '<div class="ham-top"><div class="ham-title">🌲 MENU</div><button type="button" class="ham-close" id="ham-close" aria-label="閉じる">×</button></div><div id="ham-list"></div>';
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    document.getElementById('ham-close').onclick = function (e) { e.stopPropagation(); closeHamburger(); };
    panel.onclick = function (e) { e.stopPropagation(); };
  }

  function openHamburger() {
    ensureHamburgerUI();
    pieDisabled = true;
    try { closeMenu(); } catch (e) {}
    var list = document.getElementById('ham-list');
    list.innerHTML = '';
    var data = buildMenuData();
    data.forEach(function (item) {
      if (item.items && item.items.length) {
        var wrap = document.createElement('div');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ham-group-btn';
        btn.textContent = (item.icon ? item.icon + ' ' : '') + item.label;
        var sub = document.createElement('div');
        sub.className = 'ham-sub';
        sub.style.display = 'none';
        item.items.forEach(function (subItem) {
          var a = document.createElement('a');
          a.href = subItem.url || '#';
          a.textContent = (subItem.icon ? subItem.icon + ' ' : '') + subItem.label;
          sub.appendChild(a);
        });
        btn.onclick = function () {
          sub.style.display = sub.style.display === 'none' ? 'flex' : 'none';
        };
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
    var o = document.getElementById('ham-overlay');
    var p = document.getElementById('ham-panel');
    if (o) o.classList.remove('open');
    if (p) p.classList.remove('open');
    pieDisabled = false;
  }

  function ensureMenuFab() {
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

  function boot() {
    createMenuDOM();
    initEvents();
    mountAuthHeader();
    ensureMenuFab();
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
