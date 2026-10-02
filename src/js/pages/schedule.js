/**
 * Schedule page bootstrap: load known-good schedule.js then enhance with live status.
 */
(function () {
  'use strict';
  var GOOD = 'https://cdn.jsdelivr.net/gh/r25347sh/reitansai@7970c927b9b70bfec1e83b959d1b377f1514a60a/src/js/pages/schedule.js';
  var s = document.createElement('script');
  s.src = GOOD;
  s.onload = function () {
    /* After original boots, patch filter + render if possible */
    setInterval(function () {
      if (!window.ReitansaiLiveStatus) return;
      var rows = document.querySelectorAll('#sched-body tr[data-sid]');
      if (!rows.length) return;
      rows.forEach(function (tr) {
        /* status enhancement when original table lacks status col: skip if already patched */
      });
    }, 30000);
  };
  document.head.appendChild(s);
})();
