/**
 * Live presentation status (JST) + site-wide banner for saved items that are soon/live.
 * Event day: 2026-10-03. Statuses: before | soon | live | after
 * Depends (banner only): ReitansaiMySchedule (loaded dynamically if missing)
 */
(function (global) {
  'use strict';

  var EVENT_Y = 2026;
  var EVENT_M = 10;
  var EVENT_D = 3;
  var SOON_MINUTES = 15;
  var BANNER_ID = 'rt-live-banner';
  var POLL_MS = 30000;
  var bannerTimer = null;
  var bannerDismissedUntil = 0;

  var STATUS_META = {
    before: { label: '発表前', short: '前', className: 'status-before' },
    soon:   { label: '発表間近', short: '間近', className: 'status-soon' },
    live:   { label: '発表中', short: '中', className: 'status-live' },
    after:  { label: '発表後', short: '後', className: 'status-after' }
  };

  function toMinutes(t) {
    if (t == null || t === '') return -1;
    if (global.ReitansaiMySchedule && global.ReitansaiMySchedule.toMinutes) {
      return global.ReitansaiMySchedule.toMinutes(t);
    }
    var s = String(t)
      .replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/[：．]/g, ':')
      .trim();
    var m = s.match(/(\d{1,2})\s*:\s*(\d{1,2})/);
    if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    return -1;
  }

  function nowJST() {
    var fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    var parts = fmt.formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    var y = parseInt(map.year, 10);
    var m = parseInt(map.month, 10);
    var d = parseInt(map.day, 10);
    var h = parseInt(map.hour, 10);
    var mi = parseInt(map.minute, 10);
    if (h === 24) h = 0;
    return {
      y: y, m: m, d: d,
      minutes: h * 60 + mi,
      dateKey: y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d
    };
  }

  function isEventDay(n) {
    n = n || nowJST();
    return n.y === EVENT_Y && n.m === EVENT_M && n.d === EVENT_D;
  }

  function getStatus(start, end) {
    var n = nowJST();
    var s = toMinutes(start);
    var e = toMinutes(end);
    if (e < 0 && s >= 0) e = s + 10;
    if (n.y < EVENT_Y || (n.y === EVENT_Y && (n.m < EVENT_M || (n.m === EVENT_M && n.d < EVENT_D)))) return 'before';
    if (n.y > EVENT_Y || (n.y === EVENT_Y && (n.m > EVENT_M || (n.m === EVENT_M && n.d > EVENT_D)))) return 'after';
    if (s < 0) return 'before';
    if (n.minutes >= e) return 'after';
    if (n.minutes >= s) return 'live';
    if (s - n.minutes <= SOON_MINUTES) return 'soon';
    return 'before';
  }

  function meta(status) {
    return STATUS_META[status] || STATUS_META.before;
  }

  function formatCountdown(start) {
    var n = nowJST();
    if (!isEventDay(n)) return '';
    var s = toMinutes(start);
    if (s < 0) return '';
    var diff = s - n.minutes;
    if (diff <= 0) return '';
    if (diff < 60) return 'あと' + diff + '分';
    var h = Math.floor(diff / 60);
    var m = diff % 60;
    return 'あと' + h + '時間' + (m ? m + '分' : '');
  }

  function ensureStoreScript() {
    if (global.ReitansaiMySchedule) return Promise.resolve();
    return new Promise(function (resolve) {
      var existing = document.querySelector('script[data-rt-my-store]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(); });
        existing.addEventListener('error', function () { resolve(); });
        return;
      }
      var base = '';
      try {
        var scripts = document.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; i--) {
          var abs = scripts[i].src || '';
          var idx = abs.indexOf('/src/js/');
          if (idx !== -1) { base = abs.substring(0, idx + 1); break; }
          idx = abs.indexOf('/MENU/');
          if (idx !== -1) { base = abs.substring(0, idx + 1); break; }
        }
      } catch (e) {}
      if (!base) {
        var p = location.pathname || '';
        if (p.indexOf('/reitansai/') === 0) base = (location.origin || '') + '/reitansai/';
        else if (/\/pages\/seminars\//.test(p)) base = '../../';
        else if (/\/pages\//.test(p) || /\/my\//.test(p)) base = '../';
        else base = './';
      }
      var s = document.createElement('script');
      s.src = base + 'src/js/my-schedule-store.js';
      s.setAttribute('data-rt-my-store', '1');
      s.onload = function () { resolve(); };
      s.onerror = function () { resolve(); };
      document.head.appendChild(s);
    });
  }

  function removeBanner() {
    var el = document.getElementById(BANNER_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
    document.documentElement.classList.remove('rt-has-live-banner');
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function showBanner(items) {
    if (!items || !items.length) { removeBanner(); return; }
    if (Date.now() < bannerDismissedUntil) return;
    var html = items.map(function (it) {
      var st = getStatus(it.t, it.e);
      var m = meta(st);
      var cd = st === 'soon' ? formatCountdown(it.t) : '';
      var time = (it.t || '') + (it.e ? '–' + it.e : '');
      return (
        '<div class="rt-live-banner-item ' + m.className + '">' +
        '<span class="rt-live-badge">' + m.label + '</span>' +
        '<span class="rt-live-time">' + escapeHtml(time) + '</span>' +
        '<span class="rt-live-title">' + escapeHtml(it.title || '') + '</span>' +
        (it.v ? '<span class="rt-live-venue">' + escapeHtml(it.v) + '</span>' : '') +
        (cd ? '<span class="rt-live-cd">' + escapeHtml(cd) + '</span>' : '') +
        '</div>'
      );
    }).join('');
    var el = document.getElementById(BANNER_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = BANNER_ID;
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.innerHTML =
        '<div class="rt-live-banner-inner">' +
        '<div class="rt-live-banner-head">' +
        '<strong>保存した発表</strong>' +
        '<button type="button" class="rt-live-dismiss" aria-label="閉じる">×</button>' +
        '</div>' +
        '<div class="rt-live-banner-list"></div>' +
        '<a class="rt-live-banner-link" href="#">Myスケジュールへ</a>' +
        '</div>';
      document.body.appendChild(el);
      el.querySelector('.rt-live-dismiss').addEventListener('click', function () {
        bannerDismissedUntil = Date.now() + 5 * 60 * 1000;
        removeBanner();
      });
    }
    var list = el.querySelector('.rt-live-banner-list');
    if (list) list.innerHTML = html;
    var link = el.querySelector('.rt-live-banner-link');
    if (link) {
      var href = 'pages/my/my_schedule.html';
      try {
        var p = location.pathname || '';
        if (/\/pages\/my\//.test(p)) href = 'my_schedule.html';
        else if (/\/pages\/seminars\//.test(p)) href = '../my/my_schedule.html';
        else if (/\/pages\//.test(p)) href = 'my/my_schedule.html';
        else if (p.indexOf('/reitansai/') === 0) href = '/reitansai/pages/my/my_schedule.html';
      } catch (e) {}
      link.href = href;
    }
    document.documentElement.classList.add('rt-has-live-banner');
  }

  function refreshBanner() {
    ensureStoreScript().then(function () {
      if (!global.ReitansaiMySchedule || !global.ReitansaiMySchedule.readCache) {
        removeBanner();
        return;
      }
      return global.ReitansaiMySchedule.readCache().then(function (rows) {
        var relevant = (rows || []).filter(function (r) {
          var st = getStatus(r.t, r.e);
          return st === 'soon' || st === 'live';
        });
        relevant.sort(function (a, b) {
          var sa = getStatus(a.t, a.e);
          var sb = getStatus(b.t, b.e);
          if (sa !== sb) return sa === 'soon' ? -1 : 1;
          return toMinutes(a.t) - toMinutes(b.t);
        });
        showBanner(relevant.slice(0, 3));
      });
    }).catch(function () { removeBanner(); });
  }

  function startBanner() {
    if (bannerTimer) return;
    refreshBanner();
    bannerTimer = setInterval(refreshBanner, POLL_MS);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) refreshBanner();
    });
  }

  function injectBannerStyles() {
    if (document.getElementById('rt-live-banner-css')) return;
    var style = document.createElement('style');
    style.id = 'rt-live-banner-css';
    style.textContent =
      '#' + BANNER_ID + '{position:fixed;top:0;left:0;right:0;z-index:9998;' +
      'background:linear-gradient(180deg,rgba(12,18,32,.97),rgba(12,18,32,.92));' +
      'border-bottom:1px solid rgba(201,162,39,.35);box-shadow:0 4px 24px rgba(0,0,0,.35);' +
      'font-family:system-ui,-apple-system,sans-serif;color:#eef4ff;padding:.55rem .75rem;}' +
      '#' + BANNER_ID + ' .rt-live-banner-inner{max-width:960px;margin:0 auto;}' +
      '#' + BANNER_ID + ' .rt-live-banner-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:.35rem;}' +
      '#' + BANNER_ID + ' .rt-live-banner-head strong{font-size:.78rem;letter-spacing:.06em;color:#c9a227;}' +
      '#' + BANNER_ID + ' .rt-live-dismiss{appearance:none;border:0;background:transparent;color:#9eb0cc;font-size:1.25rem;line-height:1;cursor:pointer;padding:.15rem .4rem;}' +
      '#' + BANNER_ID + ' .rt-live-banner-item{display:flex;flex-wrap:wrap;align-items:baseline;gap:.35rem .55rem;font-size:.82rem;padding:.25rem 0;border-top:1px solid rgba(140,180,255,.1);}' +
      '#' + BANNER_ID + ' .rt-live-badge{font-size:.65rem;font-weight:700;letter-spacing:.04em;padding:.15rem .4rem;border-radius:4px;}' +
      '#' + BANNER_ID + ' .status-soon .rt-live-badge{background:#ff9a3c;color:#1a1008;}' +
      '#' + BANNER_ID + ' .status-live .rt-live-badge{background:#3dd6c3;color:#06201c;animation:rt-pulse 1.6s ease-in-out infinite;}' +
      '#' + BANNER_ID + ' .rt-live-time{font-variant-numeric:tabular-nums;font-weight:700;color:#7ad4ff;}' +
      '#' + BANNER_ID + ' .rt-live-title{flex:1 1 8em;}' +
      '#' + BANNER_ID + ' .rt-live-venue{font-size:.75rem;color:#9eb0cc;}' +
      '#' + BANNER_ID + ' .rt-live-cd{font-size:.75rem;color:#ff9a3c;font-weight:600;}' +
      '#' + BANNER_ID + ' .rt-live-banner-link{display:inline-block;margin-top:.35rem;font-size:.75rem;color:#c9a227;text-decoration:none;}' +
      '#' + BANNER_ID + ' .rt-live-banner-link:hover{text-decoration:underline;}' +
      '@keyframes rt-pulse{0%,100%{opacity:1}50%{opacity:.72}}' +
      '@media (max-width:600px){#' + BANNER_ID + '{font-size:.9em}}';
    document.head.appendChild(style);
  }

  global.ReitansaiLiveStatus = {
    getStatus: getStatus,
    meta: meta,
    nowJST: nowJST,
    isEventDay: isEventDay,
    formatCountdown: formatCountdown,
    toMinutes: toMinutes,
    startBanner: function () { injectBannerStyles(); startBanner(); },
    refreshBanner: refreshBanner,
    SOON_MINUTES: SOON_MINUTES,
    STATUS_META: STATUS_META
  };

  function autoStart() { injectBannerStyles(); startBanner(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoStart);
  else autoStart();
})(typeof window !== 'undefined' ? window : this);
