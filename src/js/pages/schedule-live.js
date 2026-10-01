/**
 * Live filter addon for schedule page (loads after schedule.js)
 * Does not replace core schedule.js — only adds LIVE badges / progress filter.
 */
(function () {
  'use strict';

  function toMinutes(t) {
    if (t == null || t === '') return -1;
    var s = String(t)
      .replace(/[０-９]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
      })
      .replace(/[：．]/g, ':')
      .trim();
    var m = s.match(/(\d{1,2})\s*:\s*(\d{1,2})/);
    if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    return -1;
  }

  function nowMinutesJST() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(new Date());
      var h = 0,
        m = 0;
      parts.forEach(function (p) {
        if (p.type === 'hour') h = parseInt(p.value, 10);
        if (p.type === 'minute') m = parseInt(p.value, 10);
      });
      return h * 60 + m;
    } catch (e) {
      var d = new Date();
      return d.getHours() * 60 + d.getMinutes();
    }
  }

  function formatClock(mins) {
    var h = Math.floor(mins / 60) % 24,
      m = mins % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function rowStatus(tr, nowM) {
    var tds = tr.querySelectorAll('td');
    if (tds.length < 3) return 'unknown';
    var startText = (tds[1].textContent || '').replace(/LIVE|まもなく|終了/g, '').trim();
    var endText = (tds[2].textContent || '').trim();
    var s = toMinutes(startText);
    var e = toMinutes(endText);
    if (s < 0) return 'unknown';
    if (e < 0) e = s + 10;
    if (nowM >= s && nowM < e) return 'live';
    if (e <= nowM) return 'past';
    if (s - nowM > 0 && s - nowM <= 30) return 'soon';
    return 'future';
  }

  function applyLive() {
    var fLive = document.getElementById('f-live');
    var liveStatusEl = document.getElementById('live-status');
    var body = document.getElementById('sched-body');
    if (!body) return;
    var nowM = nowMinutesJST();
    var rows = body.querySelectorAll('tr[data-sid]');
    var liveCount = 0,
      soonCount = 0;
    var mode = fLive ? fLive.value : '';
    rows.forEach(function (tr) {
      var st = rowStatus(tr, nowM);
      tr.classList.remove('row-live', 'row-soon', 'row-past', 'row-future', 'row-unknown');
      tr.classList.add('row-' + st);
      if (st === 'live') liveCount++;
      if (st === 'soon') soonCount++;
      var timeTd = tr.querySelector('.t-time');
      if (timeTd) {
        var existing = timeTd.querySelector('.status-badge');
        if (existing) existing.remove();
        if (st === 'live' || st === 'soon' || st === 'past') {
          var span = document.createElement('span');
          span.className = 'status-badge status-' + st;
          span.textContent = st === 'live' ? 'LIVE' : st === 'soon' ? 'まもなく' : '終了';
          timeTd.insertBefore(span, timeTd.firstChild);
          timeTd.insertBefore(document.createTextNode(' '), span.nextSibling);
        }
      }
      if (mode === 'live' && st !== 'live') tr.style.display = 'none';
      else if (mode === 'soon' && st !== 'soon' && st !== 'live') tr.style.display = 'none';
      else if (mode === 'upcoming' && (st === 'past' || st === 'unknown')) tr.style.display = 'none';
      else if (mode === 'past' && st !== 'past') tr.style.display = 'none';
      else tr.style.display = '';
    });
    if (liveStatusEl) {
      liveStatusEl.textContent =
        'JST ' +
        formatClock(nowM) +
        ' · 進行中 ' +
        liveCount +
        '件' +
        (soonCount ? ' · まもなく ' + soonCount + '件' : '');
    }
  }

  function boot() {
    var fLive = document.getElementById('f-live');
    if (fLive) {
      fLive.addEventListener('change', applyLive);
      fLive.addEventListener('input', applyLive);
    }
    var body = document.getElementById('sched-body');
    if (body) {
      var obs = new MutationObserver(function () {
        applyLive();
      });
      obs.observe(body, { childList: true, subtree: true });
    }
    applyLive();
    setInterval(applyLive, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
