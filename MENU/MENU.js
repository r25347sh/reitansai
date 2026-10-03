/**
 * Bootstrap MENU + site-fb highlight patch
 */
(function () {
  'use strict';
  var GOOD = 'https://cdn.jsdelivr.net/gh/r25347sh/reitansai@e8e1f779fbf483f5778d9205ab6fa99490a29d5f/MENU/MENU.js';
  function patch() {
    try {
      if (document.getElementById('rt-sitefb-menu-extra')) return;
      var style = document.createElement('style');
      style.id = 'rt-sitefb-menu-extra';
      style.textContent = [
        '.rm-item.rm-item-sitefb{border-color:#5ec8c8;background:linear-gradient(145deg,#5ec8c8 0%,#2a7a7a 100%);color:#0b0e14;box-shadow:0 0 0 3px rgba(94,200,200,.3),0 0 24px rgba(94,200,200,.45),0 10px 28px rgba(0,0,0,.4);z-index:5}',
        '.rm-item.rm-item-sitefb::after{background:#5ec8c8;color:#0b0e14;border-color:#8ee0e0;font-weight:800}',
        '.nav-desktop a.nav-sitefb{color:#5ec8c8;background:rgba(94,200,200,.14);font-weight:700}',
        '.ham-link-sitefb{border-color:rgba(94,200,200,.75)!important;background:linear-gradient(135deg,rgba(94,200,200,.18),#151a24 60%)!important;position:relative}',
        '.ham-link-sitefb::after{content:"ご意見";position:absolute;top:.45rem;right:.65rem;font-size:.62rem;font-weight:700;padding:.18rem .45rem;border-radius:999px;background:#5ec8c8;color:#0b0e14}'
      ].join('');
      document.head.appendChild(style);
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

    var mo = new MutationObserver(function () { enhance(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setInterval(enhance, 800);
    enhance();
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
  s.onload = function () { patch(); setTimeout(ensureLiveStatus, 50); };
  s.onerror = function () { ensureLiveStatus(); };
  document.head.appendChild(s);
})();
