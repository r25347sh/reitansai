/**
 * Schedule page — builds rows from each seminar SEMINAR_DATA, filters, My schedule
 */
(function () {
  'use strict';

  var SEMINAR_FILES = [
    'データサイエンス探究AIゼミ',
    '教育ゼミ',
    '国際地域研究ゼミ',
    '文芸小説創作ゼミ',
    '化学ゼミ',
    '文学ゼミ',
    'メディアゼミ',
    '社会ゼミ',
    '農業ゼミ',
    '観光ゼミ',
    '語学ゼミ',
    '遊びの探究ゼミ',
    '映像編集ゼミ',
    'デジタルコンテンツ制作ゼミ',
    'イベント企画ゼミ',
    '道徳ゼミ'
  ];

  var body = document.getElementById('sched-body');
  var q = document.getElementById('q');
  var fS = document.getElementById('f-seminar');
  var fV = document.getElementById('f-venue');
  var fF = document.getElementById('f-form');
  var fT = document.getElementById('f-time');
  var countEl = document.getElementById('result-count');
  var progressWrap = document.getElementById('sched-progress');
  var progressBar = document.getElementById('sched-progress-bar');
  var progressLabel = document.getElementById('sched-progress-label');
  var sortKey = 't';
  var sortAsc = true;
  var data = [];
  var savedSet = {};

  function uniq(arr) {
    var o = {};
    arr.forEach(function (x) { if (x) o[x] = 1; });
    return Object.keys(o).sort(function (a, b) {
      return String(a).localeCompare(String(b), 'ja');
    });
  }

  function toMinutes(t) {
    if (t == null || t === '') return -1;
    var s = String(t)
      .replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/[：．]/g, ':')
      .trim();
    var m = s.match(/(\d{1,2})\s*:\s*(\d{1,2})/);
    if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    return -1;
  }

  function formatTime(t) {
    var mins = toMinutes(t);
    if (mins < 0) return t || '—';
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

  function timeHour(t) {
    var mins = toMinutes(t);
    return mins < 0 ? -1 : Math.floor(mins / 60);
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function setProgress(done, total, label) {
    if (!progressWrap || !progressBar || !progressLabel) return;
    var pct = total ? Math.round((done / total) * 100) : 100;
    progressBar.style.width = pct + '%';
    progressBar.setAttribute('aria-valuenow', String(pct));
    if (done >= total) {
      progressLabel.textContent = '読み込み完了（' + data.length + '件）';
      setTimeout(function () { progressWrap.classList.add('is-done'); }, 400);
    } else {
      progressLabel.textContent = label || ('読み込み中… ' + done + '/' + total);
    }
  }

  function fillFilters() {
    if (!fS || !fV || !fF) return;
    fS.innerHTML = '<option value="">すべてのゼミ</option>';
    fV.innerHTML = '<option value="">すべての会場</option>';
    fF.innerHTML = '<option value="">すべての形式</option>';
    uniq(data.map(function (r) { return r.s; })).forEach(function (s) {
      var o = document.createElement('option');
      o.value = s; o.textContent = s; fS.appendChild(o);
    });
    uniq(data.map(function (r) { return r.v; })).forEach(function (s) {
      var o = document.createElement('option');
      o.value = s; o.textContent = s; fV.appendChild(o);
    });
    uniq(data.map(function (r) { return r.form; })).forEach(function (s) {
      var o = document.createElement('option');
      o.value = s; o.textContent = s; fF.appendChild(o);
    });
  }

  function filtered() {
    var qq = (q && q.value ? q.value.trim() : '').toLowerCase();
    var ss = fS ? fS.value : '';
    var vv = fV ? fV.value : '';
    var ff = fF ? fF.value : '';
    var tt = fT ? fT.value : '';
    return data.filter(function (r) {
      if (ss && r.s !== ss) return false;
      if (vv && r.v !== vv) return false;
      if (ff && r.form !== ff) return false;
      if (tt) {
        var h = timeHour(r.t);
        if (String(h) !== tt) return false;
      }
      if (qq) {
        var blob = (r.title + ' ' + r.sp + ' ' + r.s + ' ' + (r.ov || '')).toLowerCase();
        if (blob.indexOf(qq) < 0) return false;
      }
      return true;
    });
  }

  function sortRows(rows) {
    return rows.slice().sort(function (a, b) {
      var av, bv;
      if (sortKey === 't' || sortKey === 'e') {
        av = toMinutes(a[sortKey]); bv = toMinutes(b[sortKey]);
        if (av < 0) av = 99999; if (bv < 0) bv = 99999;
        if (av !== bv) return sortAsc ? av - bv : bv - av;
      } else if (sortKey === 'no') {
        av = parseInt(a.no, 10); bv = parseInt(b.no, 10);
        if (isNaN(av)) av = 99999; if (isNaN(bv)) bv = 99999;
        if (av !== bv) return sortAsc ? av - bv : bv - av;
      } else {
        av = String(a[sortKey] || ''); bv = String(b[sortKey] || '');
        var cmp = av.localeCompare(bv, 'ja');
        if (cmp !== 0) return sortAsc ? cmp : -cmp;
      }
      return toMinutes(a.t) - toMinutes(b.t);
    });
  }

  function render() {
    if (!body) return;
    var rows = sortRows(filtered());
    if (countEl) countEl.textContent = String(rows.length);
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="9">該当する発表がありません</td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (r) {
      var saved = !!savedSet[r.id];
      var venue = r.vn ? r.v + ' / ' + r.vn : (r.v || '—');
      return (
        '<tr data-sid="' + esc(r.id) + '">' +
        '<td class="t-no">' + esc(r.no != null && r.no !== '' ? r.no : '—') + '</td>' +
        '<td class="t-time">' + esc(formatTime(r.t)) + '</td>' +
        '<td class="t-end">' + esc(formatTime(r.e)) + '</td>' +
        '<td class="t-seminar">' + esc(r.s) + '</td>' +
        '<td class="t-title">' + esc(r.title) +
        (r.ov ? '<div class="t-overview">' + esc(r.ov) + '</div>' : '') +
        '</td>' +
        '<td class="t-sp">' + esc(r.sp) + '</td>' +
        '<td class="t-form">' + esc(r.form) + '</td>' +
        '<td class="t-venue">' + esc(venue) + '</td>' +
        '<td class="t-act">' +
        '<button type="button" class="sched-save-btn' + (saved ? ' is-saved' : '') +
        '" data-id="' + esc(r.id) + '">' + (saved ? '保存済' : '保存') + '</button>' +
        '</td></tr>'
      );
    }).join('');
  }

  function refreshSavedSet() {
    if (!window.ReitansaiMySchedule) return Promise.resolve();
    return window.ReitansaiMySchedule.readCache().then(function (rows) {
      savedSet = {};
      (rows || []).forEach(function (r) {
        if (r.id) savedSet[String(r.id)] = 1;
      });
    }).catch(function () { savedSet = {}; });
  }

  function onSaveClick(ev) {
    var btn = ev.target.closest('.sched-save-btn');
    if (!btn || !window.ReitansaiMySchedule) return;
    var id = btn.getAttribute('data-id');
    if (!id) return;
    var row = null;
    for (var i = 0; i < data.length; i++) {
      if (String(data[i].id) === String(id)) { row = data[i]; break; }
    }
    if (!row) return;
    if (savedSet[id]) {
      window.ReitansaiMySchedule.remove(id).then(function () {
        delete savedSet[id];
        render();
      }).catch(function (e) { alert(e.message || '削除に失敗しました'); });
      return;
    }
    var payload = {
      id: String(row.id), no: row.no, t: row.t, e: row.e, s: row.s,
      title: row.title, sp: row.sp, form: row.form, v: row.v,
      vn: row.vn || '', ov: row.ov || '', duration: row.duration, seminarId: row.seminarId
    };
    function doSave(force) {
      return window.ReitansaiMySchedule.save(payload, force ? { force: force } : {}).then(function (result) {
        if (result && result.conflicts && result.conflicts.length && !force) {
          if (window.confirm('時間が重なる発表が Myスケジュール にあります。\n置き換えて保存しますか？'))
            return doSave('replace');
          return null;
        }
        if (result && result.ok === false && result.cancelled) return null;
        savedSet[id] = 1;
        render();
        return result;
      });
    }
    doSave().catch(function (e) {
      alert((e && e.message) || '保存に失敗しました');
    });
  }

  function loadSeminarScript(name) {
    return new Promise(function (resolve) {
      var prev = window.SEMINAR_DATA;
      window.SEMINAR_DATA = null;
      var s = document.createElement('script');
      s.src = '../../../src/data/' + encodeURIComponent(name) + '.data.js?t=' + Date.now();
      s.onload = function () {
        var d = window.SEMINAR_DATA;
        window.SEMINAR_DATA = prev;
        resolve(d || null);
      };
      s.onerror = function () {
        window.SEMINAR_DATA = prev;
        resolve(null);
      };
      document.head.appendChild(s);
    });
  }

  function flattenSeminar(sem) {
    if (!sem || !sem.presentations) return [];
    var venue = sem.venue || '';
    return sem.presentations.map(function (p) {
      var start = p.start || '';
      var end = p.end || '';
      var dur = p.duration || '';
      if (!end && start && dur) {
        var m = String(dur).match(/(\d+)/);
        if (m) end = addMinutes(start, parseInt(m[1], 10));
      }
      return {
        id: String(p.no != null ? p.no : ''),
        scheduleId: p.no,
        seminarId: sem.key || sem.name || '',
        no: p.no != null ? p.no : '',
        t: start,
        e: end,
        duration: dur,
        s: sem.name || sem.key || '',
        title: p.title || '',
        sp: p.speakers || '',
        form: p.form || '',
        v: venue,
        vn: p.venue_note || '',
        ov: p.overview || ''
      };
    });
  }

  function boot() {
    if (!body) return;
    if (progressWrap) progressWrap.classList.remove('is-done');
    if (countEl) countEl.textContent = '読込中…';
    setProgress(0, SEMINAR_FILES.length, 'ゼミデータを読み込み中…');
    var loaded = 0;
    var all = [];
    Promise.all(SEMINAR_FILES.map(function (name) {
      return loadSeminarScript(name).then(function (sem) {
        loaded++;
        setProgress(loaded, SEMINAR_FILES.length, name);
        if (sem) all = all.concat(flattenSeminar(sem));
      });
    })).then(function () {
      data = all;
      setProgress(SEMINAR_FILES.length, SEMINAR_FILES.length, '');
      return refreshSavedSet();
    }).then(function () {
      fillFilters();
      [q, fS, fV, fF, fT].forEach(function (el) {
        if (!el) return;
        el.addEventListener('input', render);
        el.addEventListener('change', render);
      });
      if (body) body.addEventListener('click', onSaveClick);
      document.querySelectorAll('[data-sort]').forEach(function (th) {
        th.addEventListener('click', function () {
          var k = th.getAttribute('data-sort');
          if (sortKey === k) sortAsc = !sortAsc;
          else { sortKey = k; sortAsc = true; }
          render();
        });
      });
      render();
    }).catch(function (err) {
      if (countEl) countEl.textContent = '0';
      if (body) body.innerHTML = '<tr><td colspan="9">読み込みに失敗しました: ' + esc(err.message || err) + '</td></tr>';
      setProgress(1, 1, 'エラー');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
