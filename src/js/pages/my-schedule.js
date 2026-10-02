/**
 * My schedule — display saved rows from IndexedDB
 * Full row data is stored at save time (from schedule page / seminar data).
 * No longer depends on schedule.json (obsolete single-file catalog).
 * Default event window: 09:30–11:30 (presentation slot)
 */
(function () {
  'use strict';

  var EVENT_START = '09:30';
  var EVENT_END = '11:30';

  var body = document.getElementById('my-sched-body');
  var countEl = document.getElementById('my-count');
  var hint = document.getElementById('my-empty-hint');
  var refreshBtn = document.getElementById('my-refresh');
  var rangeWrap = document.getElementById('my-personal-range');
  var rangeStartEl = document.getElementById('my-range-start');
  var rangeEndEl = document.getElementById('my-range-end');
  var eventStartEl = document.getElementById('my-event-start');
  var eventEndEl = document.getElementById('my-event-end');

  if (eventStartEl) eventStartEl.textContent = EVENT_START;
  if (eventEndEl) eventEndEl.textContent = EVENT_END;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
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

  function normalize(r) {
    var id = String(r.id || r.scheduleId || '');
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
  }

  function sortByTime(rows) {
    return (rows || []).slice().sort(function (a, b) {
      var av = toMinutes(a.t); var bv = toMinutes(b.t);
      if (av < 0) av = 99999; if (bv < 0) bv = 99999;
      if (av !== bv) return av - bv;
      return String(a.title || '').localeCompare(String(b.title || ''), 'ja');
    });
  }

  function updatePersonalRange(rows) {
    if (!rangeWrap) return;
    if (!rows || !rows.length) {
      rangeWrap.hidden = true;
      return;
    }
    var minS = 99999, maxE = -1;
    rows.forEach(function (r) {
      var s = toMinutes(r.t);
      var e = toMinutes(r.e);
      if (e < 0 && s >= 0) e = s;
      if (s >= 0 && s < minS) minS = s;
      if (e >= 0 && e > maxE) maxE = e;
    });
    if (minS >= 99999) {
      rangeWrap.hidden = true;
      return;
    }
    function minsToStr(m) {
      var h = Math.floor(m / 60), mm = m % 60;
      return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
    }
    if (rangeStartEl) rangeStartEl.textContent = minsToStr(minS);
    if (rangeEndEl) rangeEndEl.textContent = maxE >= 0 ? minsToStr(maxE) : '—';
    rangeWrap.hidden = false;
  }

  function render(rows) {
    if (!body) return;
    rows = sortByTime((rows || []).map(normalize));
    if (countEl) countEl.textContent = String(rows.length);
    if (hint) hint.hidden = rows.length > 0;
    updatePersonalRange(rows);
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
    window.ReitansaiMySchedule.list().then(function (rows) {
      render(rows);
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
