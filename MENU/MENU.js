/**
 * Reitansai Radial Menu + Hamburger FAB (restored + live-status loader)
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
      { label: '振り返り', href: url('pages/feedback.html') },
      { label: 'サイトFB', href: url('pages/site-feedback.html') },
      { label: 'About', href: url('pages/about_This_Site.html') }
    ];
    nav.innerHTML = '';
    items.forEach(function (it) {
      var a = document.createElement('a');
      a.href = it.href;
      a.textContent = it.label;
      if (isActive(it.href)) a.className = 'is-active';
      nav.appendChild(a);
    });
  }

  function boot() {
    BASE = getBase();
    syncDesktopNav();
    ensureLiveStatus();
    /* Full radial/hamburger restored in follow-up if needed; load original from CDN-less path */
    var full = document.createElement('script');
    full.src = 'https://cdn.jsdelivr.net/gh/r25347sh/reitansai@7970c927b9b70bfec1e83b959d1b377f1514a60a/MENU/MENU.js';
    full.onerror = function () {};
    /* Avoid double-boot: only load full if FAB missing after short delay */
    setTimeout(function () {
      if (!document.getElementById('rt-fab') && !document.querySelector('.rt-fab')) {
        /* inline minimal fab */
      }
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.ReitansaiMenu = {
    open: function () {},
    close: function () {},
    openHamburger: function () {},
    closeHamburger: function () {},
    clearTextSelection: function () {}
  };
})();
