/**
 * Theme control — dark / classic / green / system (default)
 * localStorage: rt-color-mode, rt-atmosphere
 *
 * Panel: dropdown below the trigger (right-aligned).
 * Flips upward when there is not enough space below the header.
 *
 * Also injects site favicon / apple-touch-icon from sources/favicon.png
 * so every page that loads this script gets consistent icons.
 */
(function () {
  'use strict';

  /* ---- Favicon / site icon (all pages) ---- */
  (function ensureFavicons() {
    try {
      var href = '../../sources/favicon.png';
      var head = document.head || document.getElementsByTagName('head')[0];
      if (!head) return;
      function addLink(rel, sizes) {
        if (document.querySelector('link[rel="' + rel + '"][href*="favicon"]')) return;
        var link = document.createElement('link');
        link.rel = rel;
        link.type = 'image/png';
        link.href = href;
        if (sizes) link.setAttribute('sizes', sizes);
        head.appendChild(link);
      }
      addLink('icon', '32x32');
      addLink('icon', '192x192');
      addLink('apple-touch-icon', '180x180');
      if (!document.querySelector('link[rel="shortcut icon"]')) {
        var sc = document.createElement('link');
        sc.rel = 'shortcut icon';
        sc.type = 'image/png';
        sc.href = href;
        head.appendChild(sc);
      }
    } catch (e) { /* ignore */ }
  })();

  var STORAGE_MODE = 'rt-color-mode';
  var STORAGE_ATM = 'rt-atmosphere';
  var ROOT = document.documentElement;

  var VALID = { dark: 1, classic: 1, green: 1, system: 1 };
  var LIGHT_SCHEMES = { classic: 1, green: 1, light: 1 };
  var LEGACY = {
    light: 'classic',
    sakura: 'classic',
    ocean: 'classic',
    midnight: 'dark'
  };

  function readMode() {
    try {
      var m = localStorage.getItem(STORAGE_MODE);
      if (m && LEGACY[m]) m = LEGACY[m];
      if (VALID[m]) return m;
    } catch (e) {}
    return 'system';
  }

  function readAtmosphere() {
    try {
      var v = localStorage.getItem(STORAGE_ATM);
      if (v === '0' || v === 'false' || v === 'off') return false;
      if (v === '1' || v === 'true' || v === 'on') return true;
    } catch (e) {}
    return true;
  }

  function systemPrefersDark() {
    try {
      if (!window.matchMedia) return true;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return true;
    }
  }

  function resolveScheme(mode) {
    if (mode === 'system') {
      return systemPrefersDark() ? 'dark' : 'classic';
    }
    if (mode === 'classic' || mode === 'green' || mode === 'dark') return mode;
    return 'dark';
  }

  function isLightScheme(scheme) {
    return !!LIGHT_SCHEMES[scheme];
  }

  function flashNoTransition() {
    ROOT.classList.add('rt-theme-switching');
    void ROOT.offsetHeight;
    window.setTimeout(function () {
      ROOT.classList.remove('rt-theme-switching');
    }, 80);
  }

  function applyShell(mode, atmosphereOn, instant) {
    if (instant !== false) flashNoTransition();
    var scheme = resolveScheme(mode);
    ROOT.setAttribute('data-color-mode', mode);
    ROOT.setAttribute('data-color-scheme', scheme);
    ROOT.setAttribute('data-atmosphere', atmosphereOn ? 'on' : 'off');
    try {
      ROOT.style.colorScheme = isLightScheme(scheme) ? 'light' : 'dark';
    } catch (e) {}
    return scheme;
  }

  function saveMode(mode) {
    try { localStorage.setItem(STORAGE_MODE, mode); } catch (e) {}
  }

  function saveAtmosphere(on) {
    try { localStorage.setItem(STORAGE_ATM, on ? '1' : '0'); } catch (e) {}
  }

  var state = {
    mode: readMode(),
    atmosphere: readAtmosphere()
  };

  try {
    var stored = localStorage.getItem(STORAGE_MODE);
    if (stored && LEGACY[stored]) saveMode(state.mode);
  } catch (e) {}

  applyShell(state.mode, state.atmosphere, false);

  function notifyThemeEngine() {
    if (window.ReitansaiTheme && typeof window.ReitansaiTheme.retick === 'function') {
      window.ReitansaiTheme.retick();
    } else if (window.ReitansaiTheme && typeof window.ReitansaiTheme.tick === 'function') {
      window.ReitansaiTheme.tick();
    }
    document.dispatchEvent(new CustomEvent('rt-theme-change', {
      detail: {
        mode: state.mode,
        scheme: resolveScheme(state.mode),
        atmosphere: state.atmosphere
      }
    }));
  }

  function setMode(mode) {
    if (!VALID[mode]) return;
    state.mode = mode;
    saveMode(mode);
    applyShell(state.mode, state.atmosphere, true);
    syncUI();
    notifyThemeEngine();
  }

  function setAtmosphere(on) {
    state.atmosphere = !!on;
    saveAtmosphere(state.atmosphere);
    applyShell(state.mode, state.atmosphere, true);
    syncUI();
    notifyThemeEngine();
  }

  var panelEl = null;
  var triggerEl = null;
  var wrapEl = null;

  function sunSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4.2"/>' +
      '<path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6"/>' +
      '</svg>';
  }

  function syncUI() {
    if (!panelEl) return;
    panelEl.querySelectorAll('.rt-theme-mode').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-mode') === state.mode);
    });
    var chk = panelEl.querySelector('#rt-atm-check');
    if (chk) chk.checked = state.atmosphere;
    var hint = panelEl.querySelector('.rt-theme-system-hint');
    if (hint) {
      if (state.mode === 'system') {
        hint.hidden = false;
        hint.textContent = systemPrefersDark()
          ? 'OS設定: ダーク → ダークを適用中'
          : 'OS設定: ライト → クラシックを適用中';
      } else {
        hint.hidden = true;
        hint.textContent = '';
      }
    }
  }

  function positionPanel() {
    if (!panelEl || !triggerEl) return;
    var rect = triggerEl.getBoundingClientRect();
    var vv = window.visualViewport;
    var vh = (vv && vv.height > 0) ? vv.height : window.innerHeight;
    var spaceBelow = vh - rect.bottom;
    var spaceAbove = rect.top;
    var need = 220;
    if (spaceBelow < need && spaceAbove > spaceBelow) {
      panelEl.setAttribute('data-placement', 'top');
    } else {
      panelEl.setAttribute('data-placement', 'bottom');
    }
  }

  function closePanel() {
    if (!panelEl || !triggerEl) return;
    panelEl.classList.remove('is-open');
    triggerEl.setAttribute('aria-expanded', 'false');
  }

  function openPanel() {
    if (!panelEl || !triggerEl) return;
    positionPanel();
    panelEl.classList.add('is-open');
    triggerEl.setAttribute('aria-expanded', 'true');
    syncUI();
  }

  function togglePanel() {
    if (panelEl && panelEl.classList.contains('is-open')) closePanel();
    else openPanel();
  }

  function injectUI() {
    if (document.getElementById('rt-theme-ctrl')) return;
    var wrap = document.createElement('div');
    wrap.className = 'rt-theme-ctrl';
    wrap.id = 'rt-theme-ctrl';
    wrapEl = wrap;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rt-theme-trigger';
    btn.id = 'rt-theme-trigger';
    btn.setAttribute('aria-label', 'テーマ設定');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'rt-theme-panel');
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.title = 'テーマ設定';
    btn.innerHTML = sunSVG();
    triggerEl = btn;
    var panel = document.createElement('div');
    panel.className = 'rt-theme-panel';
    panel.id = 'rt-theme-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'カラーテーマ');
    panel.setAttribute('data-placement', 'bottom');
    panel.innerHTML =
      '<div class="rt-theme-modes" role="group" aria-label="カラーモード">' +
        '<button type="button" class="rt-theme-mode" data-mode="dark" title="ダーク">ダーク</button>' +
        '<button type="button" class="rt-theme-mode" data-mode="classic" title="クラシック">クラシック</button>' +
        '<button type="button" class="rt-theme-mode" data-mode="green" title="グリーン（深緑）">グリーン</button>' +
        '<button type="button" class="rt-theme-mode" data-mode="system" title="OSの外観設定に合わせる">システム</button>' +
      '</div>' +
      '<p class="rt-theme-system-hint" hidden></p>' +
      '<div class="rt-theme-sep" aria-hidden="true"></div>' +
      '<label class="rt-atm-toggle" for="rt-atm-check">' +
        '<span class="rt-atm-toggle-label">時間・天気連動</span>' +
        '<span class="rt-atm-switch">' +
          '<input type="checkbox" id="rt-atm-check" />' +
          '<span class="rt-atm-track"><span class="rt-atm-thumb"></span>' +
        '</span>' +
      '</label>';
    panelEl = panel;
    wrap.appendChild(btn);
    wrap.appendChild(panel);
    var header = document.querySelector('.site-header');
    if (header) {
      header.appendChild(wrap);
    } else {
      wrap.style.position = 'fixed';
      wrap.style.top = '0.85rem';
      wrap.style.right = '0.85rem';
      wrap.style.zIndex = '1200';
      document.body.appendChild(wrap);
    }
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      togglePanel();
    });
    panel.querySelectorAll('.rt-theme-mode').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setMode(b.getAttribute('data-mode'));
      });
    });
    var chk = panel.querySelector('#rt-atm-check');
    if (chk) {
      chk.addEventListener('change', function () {
        setAtmosphere(chk.checked);
      });
      chk.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) closePanel();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });
    var onViewportChange = function () {
      if (panelEl && panelEl.classList.contains('is-open')) positionPanel();
    };
    window.addEventListener('resize', onViewportChange, { passive: true });
    window.addEventListener('scroll', onViewportChange, { passive: true, capture: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onViewportChange);
      window.visualViewport.addEventListener('scroll', onViewportChange);
    }
    syncUI();
  }

  if (window.matchMedia) {
    try {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        if (state.mode !== 'system') return;
        applyShell(state.mode, state.atmosphere, true);
        syncUI();
        notifyThemeEngine();
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    } catch (e) {}
  }

  function boot() {
    injectUI();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.ReitansaiThemeControl = {
    getMode: function () { return state.mode; },
    getScheme: function () { return resolveScheme(state.mode); },
    isAtmosphereOn: function () { return state.atmosphere; },
    isLightScheme: isLightScheme,
    setMode: setMode,
    setAtmosphere: setAtmosphere,
    resolveScheme: resolveScheme
  };
})();
