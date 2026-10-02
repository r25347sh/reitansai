/**
 * Schedule page — load base renderer then enhance with live status.
 */
(function () {
  'use strict';
  var GOOD = 'https://cdn.jsdelivr.net/gh/r25347sh/reitansai@7970c927b9b70bfec1e83b959d1b377f1514a60a/src/js/pages/schedule.js';

  function enhance() {
    if (!window.ReitansaiLiveStatus) return;
    var body = document.getElementById('sched-body');
    if (!body) return;
    var fSt = document.getElementById('f-status');

    function applyStatus() {
      var rows = body.querySelectorAll('tr[data-sid]');
      rows.forEach(function (tr) {
        var timeCell = tr.querySelector('.t-time');
        var endCell = tr.querySelector('.t-end');
        if (!timeCell) return;
        var start = (timeCell.textContent || '').trim();
        var end = endCell ? (endCell.textContent || '').trim() : '';
        if (start === '—') start = '';
        if (end === '—') end = '';
        var st = window.ReitansaiLiveStatus.getStatus(start, end);
        var meta = window.ReitansaiLiveStatus.meta(st);
        var cd = st === 'soon' ? window.ReitansaiLiveStatus.formatCountdown(start) : '';
        tr.classList.remove('status-before', 'status-soon', 'status-live', 'status-after');
        tr.classList.add('sched-row', meta.className);
        tr.setAttribute('data-status', st);
        var statusTd = tr.querySelector('.t-status');
        if (!statusTd) {
          statusTd = document.createElement('td');
          statusTd.className = 't-status';
          var noTd = tr.querySelector('.t-no');
          if (noTd && noTd.nextSibling) tr.insertBefore(statusTd, noTd.nextSibling);
          else if (noTd) noTd.insertAdjacentElement('afterend', statusTd);
          else tr.insertBefore(statusTd, tr.firstChild);
        }
        statusTd.innerHTML = '<span class="status-badge ' + meta.className + '">' +
          meta.label +
          (cd ? '<span class="status-cd">' + cd + '</span>' : '') +
          '</span>';
        if (fSt && fSt.value && st !== fSt.value) {
          tr.style.display = 'none';
        } else {
          tr.style.display = '';
        }
      });
      if (window.ReitansaiLiveStatus.refreshBanner) window.ReitansaiLiveStatus.refreshBanner();
    }

    if (fSt) {
      fSt.addEventListener('change', applyStatus);
    }
    var obs = new MutationObserver(function () { applyStatus(); });
    obs.observe(body, { childList: true, subtree: false });
    applyStatus();
    setInterval(applyStatus, 30000);
  }

  var s = document.createElement('script');
  s.src = GOOD;
  s.onload = function () {
    setTimeout(enhance, 800);
    setTimeout(enhance, 2500);
  };
  document.head.appendChild(s);
})();
