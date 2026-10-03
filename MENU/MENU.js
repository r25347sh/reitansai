/**
 * Bootstrap MENU + site-fb + triple-tap + site-wide 振り返り push after 11:30
 */
(function () {
  'use strict';
  var GOOD = 'https://cdn.jsdelivr.net/gh/r25347sh/reitansai@e8e1f779fbf483f5778d9205ab6fa99490a29d5f/MENU/MENU.js';
  var EVENT_Y = 2026, EVENT_M = 10, EVENT_D = 3, PUSH_FROM_MIN = 11 * 60 + 30;

  function nowJST() {
    try {
      var fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
      var map = {};
      fmt.formatToParts(new Date()).forEach(function (p) { map[p.type] = p.value; });
      var h = parseInt(map.hour, 10); if (h === 24) h = 0;
      return { y: parseInt(map.year, 10), m: parseInt(map.month, 10), d: parseInt(map.day, 10), minutes: h * 60 + parseInt(map.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function shouldPush() {
    var n = nowJST();
    if (n.y > EVENT_Y || (n.y === EVENT_Y && n.m > EVENT_M) || (n.y === EVENT_Y && n.m === EVENT_M && n.d > EVENT_D)) return true;
    if (n.y === EVENT_Y && n.m === EVENT_M && n.d === EVENT_D && n.minutes >= PUSH_FROM_MIN) return true;
    return false;
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

  function isFeedbackPage() {
    return /feedback\.html/.test(location.pathname || '');
  }

  function installSitewidePush() {
    if (!shouldPush() || isFeedbackPage()) return;
    if (document.getElementById('rt-feedback-bottom')) return;

    document.documentElement.classList.add('rt-push-feedback', 'rt-has-feedback-bottom');

    if (!document.getElementById('rt-push-global-css')) {
      var css = document.createElement('style');
      css.id = 'rt-push-global-css';
      css.textContent =
        '.rt-feedback-bottom{position:fixed;left:0;right:0;bottom:0;z-index:2147483500;padding:.65rem .75rem calc(.65rem + env(safe-area-inset-bottom));background:linear-gradient(180deg,#e8c547,#c9a227);box-shadow:0 -8px 32px rgba(201,162,39,.55);animation:rtBotPulse 1.4s ease-in-out infinite}' +
        '@keyframes rtBotPulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.1)}}' +
        '.rt-feedback-bottom-cta{display:flex;align-items:center;gap:.75rem;width:min(100%,640px);margin:0 auto;color:#0b0e14!important;text-decoration:none!important;font-weight:800}' +
        '.rt-feedback-bottom-icon{font-size:1.75rem;line-height:1}' +
        '.rt-feedback-bottom-text{flex:1;line-height:1.25;text-align:left}' +
        '.rt-feedback-bottom-text strong{display:block;font-size:1.05rem}' +
        '.rt-feedback-bottom-text small{display:block;font-size:.72rem;font-weight:600;opacity:.85;margin-top:.1rem}' +
        '.rt-feedback-bottom-go{flex-shrink:0;padding:.55rem 1rem;border-radius:999px;background:#0b0e14;color:#f0d060;font-size:.88rem;animation:rtGoBounce 1.1s ease-in-out infinite}' +
        '@keyframes rtGoBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}' +
        'html.rt-has-feedback-bottom body{padding-bottom:5.5rem}' +
        '.rm-item.rm-item-highlight{animation:rmHighlightPulse 1.2s ease-in-out infinite!important;transform:scale(1.08)}' +
        '.ham-link-highlight{animation:rtGoBounce 1.2s ease-in-out infinite}' +
        '.nav-desktop a.nav-feedback{background:#c9a227!important;color:#0b0e14!important;font-weight:800!important}';
      document.head.appendChild(css);
    }

    var bar = document.createElement('div');
    bar.id = 'rt-feedback-bottom';
    bar.className = 'rt-feedback-bottom';
    bar.innerHTML =
      '<a class="rt-feedback-bottom-cta" href="' + url('pages/feedback.html') + '">' +
      '<span class="rt-feedback-bottom-icon" aria-hidden="true">📝</span>' +
      '<span class="rt-feedback-bottom-text"><strong>振り返りフォーム</strong><small>発表終了 — ご協力をお願いします！！</small></span>' +
      '<span class="rt-feedback-bottom-go">開く →</span></a>';
    (document.body || document.documentElement).appendChild(bar);
  }

  function patchSiteFb() {
    try {
      if (!document.getElementById('rt-sitefb-menu-extra')) {
        var style = document.createElement('style');
        style.id = 'rt-sitefb-menu-extra';
        style.textContent = [
          '.rm-item.rm-item-sitefb{border-color:#8ee0e0!important;background:linear-gradient(145deg,#5ec8c8 0%,#2a7a7a 100%)!important;color:#0b0e14!important;box-shadow:0 0 0 3px rgba(94,200,200,.4),0 0 28px rgba(94,200,200,.55)!important;z-index:6}',
          '.nav-desktop a.nav-sitefb{color:#5ec8c8!important;background:rgba(94,200,200,.18)!important;font-weight:700!important}',
          '.ham-link-sitefb{border-color:rgba(94,200,200,.9)!important;background:linear-gradient(135deg,rgba(94,200,200,.28),#151a24 55%)!important;position:relative}',
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
        if (label.indexOf('振り返り') !== -1 || icon.indexOf('📝') !== -1) {
          btn.classList.add('rm-item-highlight');
          btn.setAttribute('data-label', '★ 振り返り');
        }
      });
      document.querySelectorAll('.ham-link').forEach(function (a) {
        var t = a.textContent || '';
        if (t.indexOf('サイトFB') !== -1) {
          a.classList.add('ham-link-sitefb');
          if (t.indexOf('ご意見') === -1) a.textContent = t.trim() + '  ご意見歓迎';
        }
        if (t.indexOf('振り返り') !== -1) {
          a.classList.add('ham-link-highlight');
          if (t.indexOf('ご協力') === -1) a.textContent = t.trim() + '  ★今すぐ！！';
        }
      });
      document.querySelectorAll('nav.nav-desktop a').forEach(function (a) {
        var t = (a.textContent || '').trim();
        if (t === 'サイトFB') a.classList.add('nav-sitefb');
        if (t === '振り返り') a.classList.add('nav-feedback');
      });
    }
    if (!window.__rtSiteFbEnhance) {
      window.__rtSiteFbEnhance = true;
      new MutationObserver(function () { enhance(); }).observe(document.documentElement, { childList: true, subtree: true });
      setInterval(enhance, 1000);
    }
    enhance();
  }

  function installTripleOpen() {
    if (window.__rtTripleOpenInstalled) return;
    window.__rtTripleOpenInstalled = true;
    var taps = [], WINDOW_MS = 900, MAX_MOVE = 40;
    function isBlockedTarget(el) {
      if (!el || !el.closest) return false;
      return !!(el.closest('.menu-fab') || el.closest('.radial-menu-wrapper') || el.closest('#ham-panel') || el.closest('#ham-overlay') || el.closest('.feedback-fab') || el.closest('.sitefb-fab') || el.closest('.cta-fab-stack') || el.closest('.feedback-banner') || el.closest('#rt-feedback-bottom') || el.closest('input') || el.closest('textarea') || el.closest('select'));
    }
    function tryOpen(x, y) {
      if (window.ReitansaiMenu && typeof window.ReitansaiMenu.open === 'function') {
        window.ReitansaiMenu.open(x, y); return true;
      }
      return false;
    }
    document.addEventListener('pointerup', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (isBlockedTarget(e.target)) return;
      var now = Date.now(), x = e.clientX, y = e.clientY;
      taps = taps.filter(function (t) { return (now - t.t) < WINDOW_MS && Math.abs(t.x - x) < MAX_MOVE && Math.abs(t.y - y) < MAX_MOVE; });
      taps.push({ t: now, x: x, y: y });
      if (taps.length >= 3) { var last = taps[taps.length - 1]; taps = []; tryOpen(last.x, last.y); }
    }, true);
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

  function bootExtras() {
    patchSiteFb();
    installTripleOpen();
    installSitewidePush();
    setTimeout(ensureLiveStatus, 50);
    // if before 11:30, poll
    if (!shouldPush()) {
      setInterval(function () {
        if (shouldPush()) installSitewidePush();
      }, 15000);
    }
  }

  var s = document.createElement('script');
  s.src = GOOD;
  s.onload = bootExtras;
  s.onerror = function () { installTripleOpen(); installSitewidePush(); ensureLiveStatus(); };
  document.head.appendChild(s);
  installTripleOpen();
})();
