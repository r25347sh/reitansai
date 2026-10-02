/**
 * Bootstrap: load known-good MENU then attach live-status loader.
 * Temporary until full MENU is restored in-repo.
 */
(function () {
  'use strict';
  var GOOD = 'https://cdn.jsdelivr.net/gh/r25347sh/reitansai@7970c927b9b70bfec1e83b959d1b377f1514a60a/MENU/MENU.js';
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
  s.onload = function () { setTimeout(ensureLiveStatus, 50); };
  s.onerror = function () { ensureLiveStatus(); };
  document.head.appendChild(s);
})();
