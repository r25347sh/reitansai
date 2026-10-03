/**
 * Bootstrap MENU + stronger site-fb highlight + triple-tap open
 */
(function () {
  'use strict';
  var GOOD = 'https://cdn.jsdelivr.net/gh/r25347sh/reitansai@e8e1f779fbf483f5778d9205ab6fa99490a29d5f/MENU/MENU.js';

  function patchSiteFb() {
    try {
      if (!document.getElementById('rt-sitefb-menu-extra')) {
        var style = document.createElement('style');
        style.id = 'rt-sitefb-menu-extra';
        style.textContent = [
          '.rm-item.rm-item-sitefb{border-color:#8ee0e0!important;background:linear-gradient(145deg,#5ec8c8 0%,#2a7a7a 100%)!important;color:#0b0e14!important;box-shadow:0 0 0 3px rgba(94,200,200,.4),0 0 28px rgba(94,200,200,.55),0 10px 28px rgba(0,0,0,.45)!important;animation:rmSitefbPulse 2.2s ease-in-out infinite;z-index:6}',
          '.rm-item.rm-item-sitefb::after{background:#5ec8c8!important;color:#0b0e14!important;border-color:#8ee0e0!important;font-weight:800!important}',
          '@keyframes rmSitefbPulse{0%,100%{box-shadow:0 0 0 3px rgba(94,200,200,.35),0 0 22px rgba(94,200,200,.45),0 10px 28px rgba(0,0,0,.45)}50%{box-shadow:0 0 0 5px rgba(94,200,200,.25),0 0 36px rgba(94,200,200,.7),0 12px 32px rgba(0,0,0,.5)}}',
          '.nav-desktop a.nav-sitefb{color:#5ec8c8!important;background:rgba(94,200,200,.18)!important;font-weight:700!important;box-shadow:0 0 0 1px rgba(94,200,200,.4)}',
          '.ham-link-sitefb{border-color:rgba(94,200,200,.9)!important;background:linear-gradient(135deg,rgba(94,200,200,.28),#151a24 55%)!important;box-shadow:0 0 0 1px rgba(94,200,200,.35),0 8px 24px rgba(94,200,200,.2)!important;position:relative}',
          '.ham-link-sitefb::after{content:"ご意見";position:absolute;top:.45rem;right:.65rem;font-size:.62rem;font-weight:700;padding:.18rem .45rem;border-radius:999px;background:#5ec8c8;color:#0b0e14}'
        ].join('');
        document.head.appendChild(style);
      }
    } catch (e) {}

    function enhance() {
      document.querySelectorAll('.rm-item').forEach(function (btn) {
        var label = btn.getAttribute('data-label') || btn.getAttribute('aria-label') || '';
        var icon = btn.textContent || '';
        if (label.indexOf('サイトFB') !== -1 || (icon.indexOf('💬') !== -1 && label.indexOf('サイト') !== -1)) {
          btn.classList.add('rm-item-sitefb');
          btn.setAttribute('data-label', '💬 サイトFB');
        }
      });
      document.querySelectorAll('.ham-link').forEach(function (a) {
        var t = a.textContent || '';
        if (t.indexOf('サイトFB') !== -1) {
          a.classList.add('ham-link-sitefb');
          if (t.indexOf('ご意見') === -1) a.textContent = t.trim() + '  ご意見歓迎';
        }
      });
      document.querySelectorAll('nav.nav-desktop a').forEach(function (a) {
        if ((a.textContent || '').trim() === 'サイトFB') a.classList.add('nav-sitefb');
      });
    }

    if (!window.__rtSiteFbEnhance) {
      window.__rtSiteFbEnhance = true;
      var mo = new MutationObserver(function () { enhance(); });
      mo.observe(document.documentElement, { childList: true, subtree: true });
      setInterval(enhance, 1000);
    }
    enhance();
  }

  function installTripleOpen() {
    if (window.__rtTripleOpenInstalled) return;
    window.__rtTripleOpenInstalled = true;

    var taps = [];
    var WINDOW_MS = 900;
    var MAX_MOVE = 40;

    function isBlockedTarget(el) {
      if (!el || !el.closest) return false;
      return !!(el.closest('.menu-fab') ||
        el.closest('.radial-menu-wrapper') ||
        el.closest('#ham-panel') ||
        el.closest('#ham-overlay') ||
        el.closest('.feedback-fab') ||
        el.closest('.sitefb-fab') ||
        el.closest('.cta-fab-stack') ||
        el.closest('.feedback-banner') ||
        el.closest('input') ||
        el.closest('textarea') ||
        el.closest('select') ||
        el.closest('label') ||
        el.closest('[contenteditable="true"]'));
    }

    function tryOpen(x, y) {
      if (window.ReitansaiMenu && typeof window.ReitansaiMenu.open === 'function') {
        window.ReitansaiMenu.open(x, y);
        return true;
      }
      return false;
    }

    function onPointerUp(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (isBlockedTarget(e.target)) return;
      var now = Date.now();
      var x = e.clientX;
      var y = e.clientY;
      taps = taps.filter(function (t) {
        return (now - t.t) < WINDOW_MS && Math.abs(t.x - x) < MAX_MOVE && Math.abs(t.y - y) < MAX_MOVE;
      });
      taps.push({ t: now, x: x, y: y });
      if (taps.length >= 3) {
        var last = taps[taps.length - 1];
        taps = [];
        tryOpen(last.x, last.y);
      }
    }

    document.addEventListener('pointerup', onPointerUp, true);

    var clickTimes = [];
    document.addEventListener('click', function (e) {
      if (isBlockedTarget(e.target)) return;
      var now = Date.now();
      clickTimes = clickTimes.filter(function (t) { return now - t < WINDOW_MS; });
      clickTimes.push(now);
      if (clickTimes.length >= 3) {
        clickTimes = [];
        tryOpen(e.clientX || (window.innerWidth / 2), e.clientY || (window.innerHeight / 2));
      }
    }, true);
  }

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
    if (p.indexOf('/reitansai/') === 0 || p === '/reitansai') return (location.origin || '') + '/reitansai/';
    if (/\/pages\/seminars\//.test(p)) return '../../';
    if (/\/pages\//.test(p)) return '../';
    return './';
  }
  function url(path) {
    var BASE = getBase();
    if (!path) return '#';
    if (/^https?:\/\//i.test(path)) return path;
    if (path.charAt(0) === '/') {
      if (BASE.indexOf('/reitansai') !== -1) return path.indexOf('/reitansai') === 0 ? path : '/reitansai' + path;
      return path;
    }
    return BASE + path.replace(/^\.\//, '');
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

  var s = document.createElement('script');
  s.src = GOOD;
  s.onload = function () {
    patchSiteFb();
    installTripleOpen();
    setTimeout(ensureLiveStatus, 50);
  };
  s.onerror = function () {
    installTripleOpen();
    ensureLiveStatus();
  };
  document.head.appendChild(s);
  installTripleOpen();
})();
