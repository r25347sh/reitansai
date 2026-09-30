(function () {
  'use strict';

  var body = document.getElementById('my-sched-body');
  var countEl = document.getElementById('my-count');
  var hint = document.getElementById('my-empty-hint');
  var refreshBtn = document.getElementById('my-refresh');

  function toMinutes(t) {
    if (window.ReitansaiMySchedule) return window.ReitansaiMySchedule.toMinutes(t);
    return -1;
  }

  function formatTime(t) {
    var mins = toMinutes(t);
    if (mins < 0) return t || '—';
    var h = Math.floor(mins / 60),
      m = mins % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function sortByTime(rows) {
    return rows.slice().sort(function (a, b) {
      var av = toMinutes(a.t);
      var bv = toMinutes(b.t);
      if (av < 0) av = 99999;
      if (bv < 0) bv = 99999;
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

    body.innerHTML = rows
      .map(function (r) {
        var venue = r.vn ? r.v + ' / ' + r.vn : r.v || '—';
        return (
          '<tr data-sid="' +
          esc(r.id) +
          '">' +
          '<td class="t-time">' +
          esc(formatTime(r.t)) +
          '</td>' +
          '<td class="t-end">' +
          (r.e ? esc(formatTime(r.e)) : '—') +
          '</td>' +
          '<td class="t-seminar">' +
          esc(r.s) +
          '</td>' +
          '<td class="t-title">' +
          esc(r.title) +
          '</td>' +
          '<td class="t-sp">' +
          esc(r.sp) +
          '</td>' +
          '<td class="t-form">' +
          esc(r.form) +
          '</td>' +
          '<td class="t-venue">' +
          esc(venue) +
          '</td>' +
          '<td class="t-save">' +
          '<button type="button" class="sched-save-btn is-saved" data-remove="' +
          esc(r.id) +
          '">削除</button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    body.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-remove');
        if (!window.ReitansaiMySchedule) return;
        btn.disabled = true;
        window.ReitansaiMySchedule.remove(id).then(function (next) {
          render(next);
        });
      });
    });
  }

  function load() {
    if (!window.ReitansaiMySchedule) {
      if (body) body.innerHTML = '<tr><td colspan="8">モジュールの読み込みに失敗しました</td></tr>';
      return Promise.resolve();
    }
    var rows = window.ReitansaiMySchedule.readCache();
    render(rows);
    return Promise.resolve();
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', function () {
      refreshBtn.disabled = true;
      load().finally(function () {
        refreshBtn.disabled = false;
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
