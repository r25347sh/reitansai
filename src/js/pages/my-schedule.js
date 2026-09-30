/**
 * My schedule — resolve saved scheduleId against schedule.json for full row display
 */
(function () {
  'use strict';

  var SCHEDULE_JSON = '/reitansai/src/json/schedule.json';
  var body = document.getElementById('my-sched-body');
  var countEl = document.getElementById('my-count');
  var hint = document.getElementById('my-empty-hint');
  var refreshBtn = document.getElementById('my-refresh');
  var catalog = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toMinutes(t) {
    if (window.ReitansaiMySchedule && window.ReitansaiMySchedule.toMinutes) {
      return window.ReitansaiMySchedule.toMinutes(t);
    }
    if (t == null || t === '') return -1;
    var m = String(t).match(/(\d{1,2})\s*[:：]\s*(\d{1,2})/);
    if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    return -1;
  }

  function formatTime(t) {
    if (t == null || t === '') return '—';
    var mins = toMinutes(t);
    if (mins < 0) return String(t);
    var h = Math.floor(mins / 60), m = mins % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function addMinutes(t, dur) {
    var m = toMinutes(t);
    if (m < 0) return '';
    var n = m + (parseInt(dur, 10) || 0);
    var h = Math.floor(n / 60), mm = n % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
  }

  function buildCatalog(json) {
    var map = {};
    var seminars = {};
    (json.seminars || []).forEach(function (s) { seminars[s.id] = s; });
    (json.schedules || []).forEach(function (sc) {
      var sem = seminars[sc.seminarId] || {};
      var start = sc.start || '';
      var dur = sc.duration || 0;
      map[String(sc.scheduleId)] = {
        id: String(sc.scheduleId),
        t: start,
        e: addMinutes(start, dur),
        duration: dur,
        s: sem.name || '',
        title: sc.title || '',
        sp: sc.speakers || '',
        form: sc.form || '',
        v: sem.venue || '',
        vn: sc.venueNote || '',
        ov: sc.overview || '',
        seminarId: sc.seminarId
      };
    });
    return map;
  }

  function hydrate(savedRows) {
    return (savedRows || []).map(function (r) {
      var id = String(r.id || r.scheduleId || '');
      if (catalog && catalog[id]) return catalog[id];
      return {
        id: id,
        t: r.t || '',
        e: r.e || '',
        s: r.s || '',
        title: r.title || '',
        sp: r.sp || '',
        form: r.form || '',
        v: r.v || '',
        vn: r.vn || '',
        ov: r.ov || ''
      };
    });
  }

  function sortByTime(rows) {
    return (rows || []).slice().sort(function (a, b) {
      var av = toMinutes(a.t); var bv = toMinutes(b.t);
      if (av < 0) av = 99999; if (bv < 0) bv = 99999;
      if (av !== bv) return av - bv;
      return String(a.title || '').localeCompare(String(b.title || ''), 'ja');
    });
  }

  function render(rows) {
    if (!body) return;
    rows = sortByTime(rows || []);
    if (countEl) countEl.textContent = String(rows.length);
    if (hint) hint.hidden = rows.length > 0;
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="8">保存された発表はありません</td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (r) {
      var venue = r.vn ? (r.v || '') + ' / ' + r.vn : (r.v || '—');
      return (
        '<tr data-sid="' + esc(r.id) + '">' +
        '<td class="t-time">' + esc(formatTime(r.t)) + '</td>' +
        '<td class="t-end">' + (r.e ? esc(formatTime(r.e)) : '—') + '</td>' +
        '<td class="t-seminar">' + esc(r.s) + '</td>' +
        '<td class="t-title">' + esc(r.title) +
        (r.ov ? '<div class="t-overview">' + esc(r.ov) + '</div>' : '') +
        '</td>' +
        '<td class="t-sp">' + esc(r.sp) + '</td>' +
        '<td class="t-form">' + esc(r.form || '—') + '</td>' +
        '<td class="t-venue">' + esc(venue) + '</td>' +
        '<td class="t-act">' +
        '<button type="button" class="sched-save-btn" data-remove="' + esc(r.id) + '">削除</button>' +
        '</td></tr>'
      );
    }).join('');
  }

  function loadAndRender() {
    if (!window.ReitansaiMySchedule) {
      body.innerHTML = '<tr><td colspan="8">ストアを読み込めません</td></tr>';
      return;
    }
    var pCatalog = catalog
      ? Promise.resolve(catalog)
      : fetch(SCHEDULE_JSON + '?t=' + Date.now())
          .then(function (r) { return r.json(); })
          .then(function (json) {
            catalog = buildCatalog(json);
            return catalog;
          })
          .catch(function (e) {
            console.warn('[my-schedule] catalog load failed', e);
            catalog = {};
            return catalog;
          });

    pCatalog.then(function () {
      return window.ReitansaiMySchedule.list();
    }).then(function (rows) {
      render(hydrate(rows));
    }).catch(function (e) {
      console.error(e);
      body.innerHTML = '<tr><td colspan="8">読み込みエラー</td></tr>';
    });
  }

  function onClick(ev) {
    var btn = ev.target.closest('[data-remove]');
    if (!btn || !window.ReitansaiMySchedule) return;
    var id = btn.getAttribute('data-remove');
    window.ReitansaiMySchedule.remove(id).then(loadAndRender).catch(function (e) {
      alert(e.message || '削除に失敗しました');
    });
  }

  function boot() {
    if (!body) return;
    if (refreshBtn) refreshBtn.addEventListener('click', loadAndRender);
    body.addEventListener('click', onClick);
    loadAndRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
