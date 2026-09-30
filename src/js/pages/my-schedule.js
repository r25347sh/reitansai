/**
 * My schedule page — list / remove (IndexedDB via ReitansaiMySchedule)
 */
(function () {
  'use strict';

  var body = document.getElementById('my-sched-body');
  var countEl = document.getElementById('my-count');
  var hint = document.getElementById('my-empty-hint');
  var refreshBtn = document.getElementById('my-refresh');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatTime(t) {
    if (t == null || t === '') return '—';
    var s = String(t).trim();
    var m = s.match(/(\d{1,2})\s*[:：]\s*(\d{1,2})/);
    if (m) {
      return (
        String(parseInt(m[1], 10)).padStart(2, '0') +
        ':' +
        String(parseInt(m[2], 10)).padStart(2, '0')
      );
    }
    return s;
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

  function sortByTime(rows) {
    return (rows || []).slice().sort(function (a, b) {
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
        }).catch(function () {
          btn.disabled = false;
        });
      });
    });
  }

  function load() {
    if (!window.ReitansaiMySchedule) {
      if (body) body.innerHTML = '<tr><td colspan="8">モジュールの読み込みに失敗しました</td></tr>';
      return Promise.resolve();
    }
    return window.ReitansaiMySchedule.readCache()
      .then(function (rows) {
        render(rows);
      })
      .catch(function (err) {
        console.error(err);
        if (body) {
          body.innerHTML =
            '<tr><td colspan="8">読み込みに失敗しました（' +
            esc(err && err.message ? err.message : 'エラー') +
            '）</td></tr>';
        }
      });
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
