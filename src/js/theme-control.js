/**
 * Theme control — dark / classic / green / sakura / ocean / midnight / system
 * + atmosphere toggle
 * localStorage: rt-color-mode, rt-atmosphere
 */
(function () {
  'use strict';

  var STORAGE_MODE = 'rt-color-mode';
  var STORAGE_ATM = 'rt-atmosphere';
  var ROOT = document.documentElement;
  var VALID = {
    dark: 1,
    classic: 1,
    green: 1,
    sakura: 1,
    ocean: 1,
    midnight: 1,
    system: 1
  };
  var LIGHT_SCHEMES = { classic: 1, green: 1, sakura: 1, ocean: 1 };

  function readMode() {
    try {
      var m = localStorage.getItem(STORAGE_MODE);
      if (m === 'light') return 'classic';
      if (VALID[m]) return m;
    } catch (e) {}
    return 'dark';
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
      return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (e) {
      return true;
    }
  }

  function resolveScheme(mode) {
    if (mode === 'system') {
      return systemPrefersDark() ? 'dark' : 'classic';
    }
    if (VALID[mode] && mode !== 'system') return mode;
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

  function sunSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4.2"/>' +
      '<path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6"/>' +
      '</svg>';
  }

  function syncUI() {
    if (!panelEl) return;
    panelEl.querySelectorAll('.rt-theme-mode').forEach(function (btn) {
      var m = btn.getAttribute('data-mode');
      btn.classList.toggle('is-active', m === state.mode);
    });
    var chk = panelEl.querySelector('#rt-atm-check');
    if (chk) chk.checked = state.atmosphere;
    var hint = panelEl.querySelector('.rt-theme-system-hint');
    if (hint) {
      if (state.mode === 'system') {
        hint.hidden = false;
        hint.textContent = systemPrefersDark() ? 'OS: \u30c0\u30fc\u30af \u2192 \u30c0\u30fc\u30af\u9069\u7528\u4e2d' : 'OS: \u30e9\u30a4\u30c8 \u2192 \u30af\u30e9\u30b7\u30c3\u30af\u9069\u7528\u4e2d';
      } else {
        hint.hidden = true;
      }
    }
  }

  function closePanel() {
    if (!panelEl || !triggerEl) return;
    panelEl.classList.remove('is-open');
    triggerEl.setAttribute('aria-expanded', 'false');
  }

  function openPanel() {
    if (!panelEl || !triggerEl) return;
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

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rt-theme-trigger';
    btn.id = 'rt-theme-trigger';
    btn.setAttribute('aria-label', '\u30c6\u30fc\u30de\u8a2d\u5b9a');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'rt-theme-panel');
    btn.title = '\u30c6\u30fc\u30de\u8a2d\u5b9a';
    btn.innerHTML = sunSVG();
    triggerEl = btn;

    var panel = document.createElement('div');
    panel.className = 'rt-theme-panel';
    panel.id = 'rt-theme-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '\u30ab\u30e9\u30fc\u30c6\u30fc\u30de');
    panel.innerHTML =
      '<div class="rt-theme-modes" role="group" aria-label="\u30ab\u30e9\u30fc\u30e2\u30fc\u30c9">' +
        '<button type="button" class="rt-theme-mode" data-mode="dark" title="\u30c0\u30fc\u30af">\u30c0\u30fc\u30af</button>' +
        '<button type="button" class="rt-theme-mode" data-mode="classic" title="\u30af\u30e9\u30b7\u30c3\u30af">\u30af\u30e9\u30b7</button>' +
        '<button type="button" class="rt-theme-mode" data-mode="green" title="\u30b0\u30ea\u30fc\u30f3">\u30b0\u30ea\u30fc\u30f3</button>' +
        '<button type="button" class="rt-theme-mode" data-mode="sakura" title="\u3055\u304f\u3089">\u3055\u304f\u3089</button>' +
        '<button type="button" class="rt-theme-mode" data-mode="ocean" title="\u30aa\u30fc\u30b7\u30e3\u30f3">\u6d77</button>' +
        '<button type="button" class="rt-theme-mode" data-mode="midnight" title="\u30df\u30c3\u30c9\u30ca\u30a4\u30c8">\u6df1\u591c</button>' +
        '<button type="button" class="rt-theme-mode" data-mode="system" title="OS\u306e\u8a2d\u5b9a\u306b\u5408\u308f\u305b\u308b">\u30b7\u30b9\u30c6\u30e0</button>' +
      '</div>' +
      '<p class="rt-theme-system-hint" hidden></p>' +
      '<div class="rt-theme-sep" aria-hidden="true"></div>' +
      '<label class="rt-atm-toggle" for="rt-atm-check">' +
        '<span class="rt-atm-toggle-label">\u6642\u9593\u30fb\u5929\u6c17\u9023\u52d5</span>' +
        '<span class="rt-atm-switch">' +
          '<input type="checkbox" id="rt-atm-check" />' +
          '<span class="rt-atm-track"><span class="rt-atm-thumb"></span></span>' +
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

    syncUI();
  }

  if (window.matchMedia) {
    try {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        if (state.mode === 'system') {
          applyShell(state.mode, state.atmosphere, true);
          syncUI();
          notifyThemeEngine();
        }
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
