/**
 * Reitansai Radial Menu + Hamburger FAB
 * Base path: auto-detect (GitHub Pages / Vercel / Cloudflare / local)
 * Feedback item highlighted (radial + hamburger + desktop nav)
 */
(function () {
  'use strict';

  function getBase() {
    try {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        var abs = scripts[i].src || '';
        var markers = ['/src/js/', '/MENU/'];
        for (var m = 0; m < markers.length; m++) {
          var idx = abs.indexOf(markers[m]);
          if (idx !== -1) return abs.substring(0, idx + 1);
        }
      }
    } catch (e) {}
    var p = location.pathname || '';
    if (p.indexOf('/reitansai/') === 0 || p === '/reitansai') {
      return (location.origin || '') + '/reitansai/';
    }
    if (/\/pages\/seminars\//.test(p)) return '../../';
    if (/\/pages\//.test(p)) return '../';
    return './';
  }

  var BASE = getBase();

  function url(path) {
    if (!path) return '#';
    if (/^https?:\/\//i.test(path)) return path;
    if (path.charAt(0) === '/') {
      if (BASE.indexOf('/reitansai') !== -1) {
        return path.indexOf('/reitansai') === 0 ? path : '/reitansai' + path;
      }
      return path;
    }
    return BASE + path.replace(/^\.\//, '');
  }

  function buildMenuData() {
    return [
      { label: 'ホーム', icon: '🏠', url: url('index.html') },
      { label: '振り返り', icon: '📝', url: url('pages/feedback.html'), highlight: true },
      { label: 'スケジュール', icon: '📅', url: url('pages/schedule.html') },
      { label: 'Myスケジュール', icon: '⭐', url: url('pages/my/my_schedule.html') },
      { label: '会場マップ', icon: '🗺️', url: url('pages/venue.html') },
      { label: 'サイトFB', icon: '💬', url: url('pages/site-feedback.html') },
      {
        label: 'ゼミ一覧', icon: '🎓', items: [
          { label: 'データサイエンス探究AI', icon: '📊', url: url('pages/seminars/データサイエンス探究AIゼミ.html') },
          { label: '教育ゼミ', icon: '📚', url: url('pages/seminars/教育ゼミ.html') },
          { label: '国際地域研究', icon: '🌍', url: url('pages/seminars/国際地域研究ゼミ.html') },
          { label: '文芸小説創作', icon: '✍️', url: url('pages/seminars/文芸小説創作ゼミ.html') },
          { label: '化学ゼミ', icon: '⚗️', url: url('pages/seminars/化学ゼミ.html') },
          { label: '文学ゼミ', icon: '📖', url: url('pages/seminars/文学ゼミ.html') },
          { label: 'メディアゼミ', icon: '📡', url: url('pages/seminars/メディアゼミ.html') },
          { label: '社会ゼミ', icon: '🏛️', url: url('pages/seminars/社会ゼミ.html') },
          { label: '農業ゼミ', icon: '🌱', url: url('pages/seminars/農業ゼミ.html') },
          { label: '観光ゼミ', icon: '🗺️', url: url('pages/seminars/観光ゼミ.html') },
          { label: '語学ゼミ', icon: '🗣️', url: url('pages/seminars/語学ゼミ.html') },
          { label: '遊びの探究', icon: '🎮', url: url('pages/seminars/遊びの探究ゼミ.html') },
          { label: 'デジタルコンテンツ制作', icon: '💻', url: url('pages/seminars/デジタルコンテンツ制作ゼミ.html') },
          { label: '映像編集', icon: '🎬', url: url('pages/seminars/映像編集ゼミ.html') },
          { label: 'イベント企画', icon: '🎉', url: url('pages/seminars/イベント企画ゼミ.html') },
          { label: '道徳ゼミ', icon: '☯️', url: url('pages/seminars/道徳ゼミ.html') }
        ]
      },
      { label: 'ゼミトップ', icon: '📋', url: url('pages/seminars/index.html') },
      { label: 'About', icon: 'ℹ️', url: url('pages/about_This_Site.html') },
      { label: 'サイトマップ', icon: '🗺️', url: url('sitemap.html') }
    ];
  }

  var LONG_PRESS_MS = 380;
  var menuStack = [];
  var isOpen = false;
  var pieDisabled = false;
  var menuEl, itemsContainer, orbitsContainer, coreBtn, fab;
  var pressTimer = null;
  var pressStart = null;

  function portalRoot() {
    return document.body || document.documentElement;
  }

  function shellConfig() {
    var w = window.innerWidth || 800;
    if (w < 420) return { caps: [5, 8, 12], radii: [78, 130, 182], margin: 240 };
    if (w < 720) return { caps: [6, 9, 13], radii: [96, 155, 214], margin: 280 };
    return { caps: [6, 10, 14], radii: [118, 190, 262], margin: 330 };
  }

  function navigateWithDelay(href) {
    closeMenu();
    closeHamburger();
    setTimeout(function () { location.href = href; }, 160);
  }

  function calculateShellLayout(items) {
    var cfg = shellConfig();
    var layout = [], remaining = items.length, itemIdx = 0;
    for (var sIdx = 0; sIdx < cfg.caps.length && remaining > 0; sIdx++) {
      var count = Math.min(remaining, cfg.caps[sIdx]);
      var radius = cfg.radii[sIdx];
      for (var i = 0; i < count; i++) {
        var angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        layout.push({
          item: items[itemIdx],
          x: Math.round(Math.cos(angle) * radius),
          y: Math.round(Math.sin(angle) * radius),
          shellIndex: sIdx,
          radius: radius
        });
        itemIdx++;
      }
      remaining -= count;
    }
    return layout;
  }

  function renderMenuLevel(items) {
    if (!itemsContainer) return;
    var old = itemsContainer.querySelectorAll('.rm-item');
    for (var i = 0; i < old.length; i++) {
      old[i].classList.remove('rendered');
      (function (el) {
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
      })(old[i]);
    }
    orbitsContainer.innerHTML = '';
    var layout = calculateShellLayout(items);
    var activeShells = {};
    layout.forEach(function (data, index) {
      activeShells[data.shellIndex] = data.radius;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rm-item' + (data.item.items ? ' has-sub' : '') + (data.item.highlight ? ' rm-item-highlight' : '');
      btn.setAttribute('data-label', data.item.highlight ? ('★ ' + data.item.label) : data.item.label);
      btn.setAttribute('aria-label', data.item.highlight ? (data.item.label + '（おすすめ）') : data.item.label);
      btn.innerHTML = data.item.icon || '•';
      btn.style.setProperty('--x', data.x + 'px');
      btn.style.setProperty('--y', data.y + 'px');
      btn.style.transitionDelay = (index * 0.022) + 's';
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
        setTimeout(function () { btn.classList.add('rendered'); }, 12);
      });
    });
    Object.keys(activeShells).forEach(function (sIdx) {
      var radius = activeShells[sIdx];
      var orbit = document.createElement('div');
      orbit.className = 'rm-shell-orbit';
      var d = radius * 2;
      orbit.style.width = d + 'px';
      orbit.style.height = d + 'px';
      orbit.style.marginTop = -radius + 'px';
      orbit.style.marginLeft = -radius + 'px';
      orbitsContainer.appendChild(orbit);
    });
    if (coreBtn) coreBtn.classList.toggle('visible', menuStack.length > 0);
  }

  function createMenuDOM() {
    if (document.querySelector('.radial-menu-wrapper')) {
      menuEl = document.querySelector('.radial-menu-wrapper');
      itemsContainer = menuEl.querySelector('.rm-items') || menuEl;
      orbitsContainer = menuEl.querySelector('.rm-orbits');
      coreBtn = menuEl.querySelector('.rm-core-btn');
      return;
    }
    menuEl = document.createElement('div');
    menuEl.className = 'radial-menu-wrapper';
    menuEl.setAttribute('role', 'menu');
    menuEl.setAttribute('aria-label', '放射状メニュー');
    orbitsContainer = document.createElement('div');
    orbitsContainer.className = 'rm-orbits';
    itemsContainer = document.createElement('div');
    itemsContainer.className = 'rm-items';
    coreBtn = document.createElement('button');
    coreBtn.type = 'button';
    coreBtn.className = 'rm-core-btn';
    coreBtn.setAttribute('aria-label', '一つ戻る');
    coreBtn.textContent = '←';
    coreBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (menuStack.length) {
        var prev = menuStack.pop();
        renderMenuLevel(prev);
      }
    });
    menuEl.appendChild(orbitsContainer);
    menuEl.appendChild(itemsContainer);
    menuEl.appendChild(coreBtn);
    portalRoot().appendChild(menuEl);
  }

  function openMenu(cx, cy) {
    if (pieDisabled) return;
    createMenuDOM();
    menuStack = [];
    var cfg = shellConfig();
    var x = Math.max(cfg.margin / 2, Math.min((window.innerWidth || 0) - cfg.margin / 2, cx));
    var y = Math.max(cfg.margin / 2, Math.min((window.innerHeight || 0) - cfg.margin / 2, cy));
    menuEl.style.left = x + 'px';
    menuEl.style.top = y + 'px';
    menuEl.classList.add('active');
    isOpen = true;
    renderMenuLevel(buildMenuData());
  }

  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    isOpen = false;
    menuStack = [];
    if (itemsContainer) {
      itemsContainer.querySelectorAll('.rm-item').forEach(function (i) {
        i.classList.remove('rendered');
      });
    }
    if (coreBtn) coreBtn.classList.remove('visible');
  }

  function mountFab() {
    if (document.querySelector('.menu-fab')) {
      fab = document.querySelector('.menu-fab');
      return;
    }
    fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'menu-fab';
    fab.setAttribute('aria-label', 'メニューを開く');
    fab.innerHTML = '☰';
    fab.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openHamburger();
    });
    portalRoot().appendChild(fab);
  }

  function clearTextSelection() {
    try {
      var sel = window.getSelection && window.getSelection();
      if (sel && sel.removeAllRanges) sel.removeAllRanges();
    } catch (e) {}
  }

  function initEvents() {
    var startX = 0, startY = 0;
    document.addEventListener('pointerdown', function (e) {
      if (e.button && e.button !== 0) return;
      if (e.target && (e.target.closest && (e.target.closest('.menu-fab') || e.target.closest('.radial-menu-wrapper') || e.target.closest('#ham-panel') || e.target.closest('#ham-overlay')))) return;
      startX = e.clientX; startY = e.clientY;
      pressStart = Date.now();
      pressTimer = setTimeout(function () {
        clearTextSelection();
        openMenu(startX, startY);
      }, LONG_PRESS_MS);
    }, { passive: true });
    document.addEventListener('pointerup', function () {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    }, { passive: true });
    document.addEventListener('pointercancel', function () {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    }, { passive: true });
    document.addEventListener('pointermove', function (e) {
      if (!pressTimer) return;
      if (Math.abs(e.clientX - startX) > 12 || Math.abs(e.clientY - startY) > 12) {
        clearTimeout(pressTimer); pressTimer = null;
      }
    }, { passive: true });

    var clickCount = 0, clickTimer = null;
    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && (e.target.closest('.menu-fab') || e.target.closest('.radial-menu-wrapper') || e.target.closest('#ham-panel'))) return;
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(function () { clickCount = 0; }, 420);
      } else if (clickCount >= 3) {
        clearTimeout(clickTimer); clickCount = 0;
        openMenu(e.clientX || (window.innerWidth / 2), e.clientY || (window.innerHeight / 2));
      }
    }, true);

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (document.getElementById('ham-panel') && document.getElementById('ham-panel').classList.contains('open')) closeHamburger();
        else openHamburger();
      }
      if (e.key === 'Escape') { closeMenu(); closeHamburger(); }
    });

    document.addEventListener('click', function (e) {
      if (isOpen && menuEl && !menuEl.contains(e.target)) closeMenu();
    });
  }

  function ensureHamStyle() {
    if (document.getElementById('rt-ham-style')) return;
    var st = document.createElement('style');
    st.id = 'rt-ham-style';
    st.textContent =
      '#ham-overlay{position:fixed;inset:0;z-index:2147483000;display:none;background:rgba(5,8,14,.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}' +
      '#ham-overlay.open{display:block}' +
      '#ham-panel{position:fixed;inset:0;z-index:2147483001;display:none;flex-direction:column;background:#0b0e14;color:#e8eef7;padding:1.1rem 1.1rem calc(1.5rem + env(safe-area-inset-bottom));overflow:auto;-webkit-overflow-scrolling:touch}' +
      '#ham-panel.open{display:flex}' +
      '#ham-list{display:flex;flex-direction:column;gap:.45rem;padding-bottom:2rem}' +
      '.ham-link,.ham-group-btn{display:block;width:100%;text-align:left;padding:.9rem 1rem;border-radius:6px;background:#151a24;border:1px solid rgba(201,162,39,0.35);color:#f0f4fa;text-decoration:none;font:inherit;font-weight:700;font-size:0.95rem;cursor:pointer;letter-spacing:0.03em;touch-action:manipulation}' +
      '.ham-link:active,.ham-group-btn:active{background:#c9a227;color:#0b0e14}' +
      '.ham-sub{display:none;flex-direction:column;gap:.28rem;padding:0.35rem 0 0.35rem 0.65rem}' +
      '.ham-sub.open{display:flex}' +
      '.ham-sub a{color:#e8eef7;text-decoration:none;padding:.6rem .75rem;border-radius:6px;font-weight:600;font-size:0.88rem;background:#12161f;border:1px solid rgba(255,255,255,0.08);touch-action:manipulation}' +
      '.ham-close{border:1px solid rgba(201,162,39,0.5);background:#151a24;color:#c9a227;width:44px;height:44px;border-radius:6px;cursor:pointer;font-size:1.15rem;font-weight:700;touch-action:manipulation}' +
      '#ham-title{font-family:Shippori Mincho,serif;font-weight:700;font-size:1.1rem;letter-spacing:0.12em}' +
      '.ham-link-highlight{border-color:rgba(201,162,39,0.85)!important;background:linear-gradient(135deg,rgba(201,162,39,0.22),#151a24 60%)!important;box-shadow:0 0 0 1px rgba(201,162,39,0.35),0 8px 24px rgba(201,162,39,0.18);position:relative}' +
      '.ham-link-highlight::after{content:"おすすめ";position:absolute;top:0.45rem;right:0.65rem;font-size:0.62rem;font-weight:700;letter-spacing:0.06em;padding:0.18rem 0.45rem;border-radius:999px;background:#c9a227;color:#0b0e14}';
    document.head.appendChild(st);
  }

  function ensureHamDOM() {
    ensureHamStyle();
    if (document.getElementById('ham-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'ham-overlay';
    var panel = document.createElement('div');
    panel.id = 'ham-panel';
    panel.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">' +
      '<div id="ham-title">麗探祭 MENU</div>' +
      '<button type="button" class="ham-close" id="ham-close" aria-label="閉じる">✕</button></div>' +
      '<div id="ham-list"></div>';
    portalRoot().appendChild(ov);
    portalRoot().appendChild(panel);
    ov.addEventListener('click', closeHamburger);
    document.getElementById('ham-close').addEventListener('click', closeHamburger);
  }

  function openHamburger() {
    ensureHamDOM();
    pieDisabled = true;
    closeMenu();
    var list = document.getElementById('ham-list');
    list.innerHTML = '';
    buildMenuData().forEach(function (item) {
      if (item.items && item.items.length) {
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
        btn.addEventListener('click', function () {
          sub.classList.toggle('open');
        });
        list.appendChild(btn);
        list.appendChild(sub);
      } else {
        var a = document.createElement('a');
        a.className = 'ham-link' + (item.highlight ? ' ham-link-highlight' : '');
        a.href = item.url || '#';
        a.textContent = (item.icon ? item.icon + ' ' : '') + item.label + (item.highlight ? '  ★ご協力ください' : '');
        list.appendChild(a);
      }
    });
    document.getElementById('ham-overlay').classList.add('open');
    document.getElementById('ham-panel').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeHamburger() {
    var ov = document.getElementById('ham-overlay');
    var panel = document.getElementById('ham-panel');
    if (ov) ov.classList.remove('open');
    if (panel) panel.classList.remove('open');
    pieDisabled = false;
    document.body.style.overflow = '';
  }

  function syncDesktopNav() {
    var nav = document.querySelector('nav.nav-desktop');
    if (!nav) return;
    var path = (location.pathname || '').replace(/\/+$/, '') || '/';
    function isActive(href) {
      try {
        var u = new URL(href, location.href);
        var p = (u.pathname || '').replace(/\/+$/, '') || '/';
        if (p === path) return true;
        if (/\/pages\/seminars\//.test(path) && /\/pages\/seminars\/index\.html$/.test(p)) return true;
        return false;
      } catch (e) { return false; }
    }
    var items = [
      { label: 'ホーム', href: url('index.html') },
      { label: 'スケジュール', href: url('pages/schedule.html') },
      { label: 'Myスケジュール', href: url('pages/my/my_schedule.html') },
      { label: '会場マップ', href: url('pages/venue.html') },
      { label: 'ゼミ一覧', href: url('pages/seminars/index.html') },
      { label: '振り返り', href: url('pages/feedback.html'), highlight: true },
      { label: 'サイトFB', href: url('pages/site-feedback.html') },
      { label: 'About', href: url('pages/about_This_Site.html') }
    ];
    nav.innerHTML = '';
    items.forEach(function (it) {
      var a = document.createElement('a');
      a.href = it.href;
      a.textContent = it.label;
      var cls = [];
      if (isActive(it.href)) cls.push('is-active');
      if (it.highlight) cls.push('nav-feedback');
      if (cls.length) a.className = cls.join(' ');
      nav.appendChild(a);
    });
  }

  function ensureLiveStatus() {
    if (window.ReitansaiLiveStatus) {
      if (window.ReitansaiLiveStatus.startBanner) window.ReitansaiLiveStatus.startBanner();
      return;
    }
    if (document.querySelector('script[data-rt-live-status]')) return;
    var s = document.createElement('script');
    s.src = url('src/js/live-status.js');
    s.defer = true;
    s.setAttribute('data-rt-live-status', '1');
    document.head.appendChild(s);
  }

  function boot() {
    BASE = getBase();
    syncDesktopNav();
    createMenuDOM();
    initEvents();
    mountFab();
    setTimeout(ensureLiveStatus, 50);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.ReitansaiMenu = {
    open: openMenu,
    close: closeMenu,
    openHamburger: openHamburger,
    closeHamburger: closeHamburger,
    clearTextSelection: clearTextSelection
  };
})();
