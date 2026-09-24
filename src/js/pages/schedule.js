(function () {
  'use strict';

  var SEMINARS = [
    'データサイエンス探究AIゼミ', '教育ゼミ', '国際地域研究ゼミ', '文芸小説創作ゼミ',
    '化学ゼミ', '文学ゼミ', 'メディアゼミ', '社会ゼミ', '農業ゼミ', '観光ゼミ',
    '語学ゼミ', '遊びの探究ゼミ', 'デジタルコンテンツ制作ゼミ', '映像編集ゼミ',
    'イベント企画ゼミ', '道徳ゼミ'
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

  function uniq(arr) {
    var o = {};
    arr.forEach(function (x) { if (x) o[x] = 1; });
    return Object.keys(o).sort();
  }

  /** Parse HH:MM (or messy string) → minutes from midnight. Returns -1 if invalid. */
  function toMinutes(t) {
    if (t == null || t === '') return -1;
    var s = String(t)
      .replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/[：．]/g, ':')
      .replace(/[〜～~]/g, '~')
      .trim();
    var m = s.match(/(\d{1,2})\s*:\s*(\d{1,2})/);
    if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    m = s.match(/^(\d{1,2})$/);
    if (m) return parseInt(m[1], 10) * 60;
    return -1;
  }

  function timeHour(t) {
    var mins = toMinutes(t);
    return mins < 0 ? -1 : Math.floor(mins / 60);
  }

  /** Always display as HH:MM (half-width, zero-padded, no seconds). */
  function formatTime(t) {
    var mins = toMinutes(t);
    if (mins < 0) return t || '—';
    var h = Math.floor(mins / 60), m = mins % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function setProgress(done, total, name) {
    if (!progressWrap || !progressBar || !progressLabel) return;
    var pct = total ? Math.round((done / total) * 100) : 0;
    progressBar.style.width = pct + '%';
    progressBar.setAttribute('aria-valuenow', String(pct));
    if (done >= total) {
      progressLabel.textContent = '読み込み完了（' + data.length + '件）';
      setTimeout(function () {
        progressWrap.classList.add('is-done');
      }, 450);
    } else {
      progressLabel.textContent = '読み込み中… ' + done + '/' + total +
        (name ? '（' + name + '）' : '');
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
    uniq(data.map(function (r) { return r.v; })).forEach(function (v) {
      var o = document.createElement('option');
      o.value = v; o.textContent = v; fV.appendChild(o);
    });
    uniq(data.map(function (r) { return r.form; })).forEach(function (f) {
      if (!f) return;
      var o = document.createElement('option');
      o.value = f; o.textContent = f; fF.appendChild(o);
    });
  }

  function filtered() {
    var qq = (q && q.value || '').trim().toLowerCase();
    var ss = fS ? fS.value : '';
    var vv = fV ? fV.value : '';
    var ff = fF ? fF.value : '';
    var th = fT ? fT.value : '';
    return data.filter(function (r) {
      if (ss && r.s !== ss) return false;
      if (vv && r.v !== vv) return false;
      if (ff && r.form !== ff) return false;
      if (th && String(timeHour(r.t)) !== th) return false;
      if (qq) {
        var hay = (r.title + ' ' + r.sp + ' ' + r.s + ' ' + r.v + ' ' + r.form).toLowerCase();
        if (hay.indexOf(qq) < 0) return false;
      }
      return true;
    });
  }

  function sortRows(rows) {
    rows = rows.slice();
    rows.sort(function (a, b) {
      if (sortKey === 't' || sortKey === 'e') {
        var av = toMinutes(sortKey === 't' ? a.t : a.e);
        var bv = toMinutes(sortKey === 't' ? b.t : b.e);
        if (av < 0) av = 99999;
        if (bv < 0) bv = 99999;
        return sortAsc ? av - bv : bv - av;
      }
      var av = String(a[sortKey] || ''), bv = String(b[sortKey] || '');
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return rows;
  }

  function render() {
    if (!body || !countEl) return;
    var rows = sortRows(filtered());
    countEl.textContent = String(rows.length);
    body.innerHTML = rows.map(function (r) {
      var venue = r.vn ? r.v + ' / ' + r.vn : r.v;
      var endCell = r.e ? esc(formatTime(r.e)) : '—';
      return '<tr>' +
        '<td class="t-time">' + esc(formatTime(r.t)) + '</td>' +
        '<td class="t-end">' + endCell + '</td>' +
        '<td class="t-seminar">' + esc(r.s) + '</td>' +
        '<td class="t-title">' + esc(r.title) + '</td>' +
        '<td class="t-sp">' + esc(r.sp) + '</td>' +
        '<td class="t-form">' + esc(r.form) + '</td>' +
        '<td class="t-venue">' + esc(venue) + '</td>' +
        '</tr>';
    }).join('');
  }

  function loadSeminar(name) {
    return new Promise(function (resolve) {
      window.SEMINAR_DATA = undefined;
      var s = document.createElement('script');
      s.src = '/reitansai/src/data/' + encodeURIComponent(name) + '.data.js?t=' + Date.now();
      s.onload = function () {
        var d = window.SEMINAR_DATA;
        if (d && d.presentations) {
          d.presentations.forEach(function (p) {
            data.push({
              t: p.start || '',
              e: p.end || '',
              s: d.name || name,
              title: p.title || '',
              sp: p.speakers || '',
              form: p.form || '',
              v: d.venue || '',
              vn: p.venue_note || ''
            });
          });
        }
        resolve();
      };
      s.onerror = function () { resolve(); };
      document.head.appendChild(s);
    });
  }

  async function boot() {
    if (!body || !countEl) {
      console.error('[schedule] required DOM elements missing');
      return;
    }
    if (progressWrap) progressWrap.classList.remove('is-done');
    countEl.textContent = '読込中…';
    setProgress(0, SEMINARS.length, '');

    for (var i = 0; i < SEMINARS.length; i++) {
      await loadSeminar(SEMINARS[i]);
      setProgress(i + 1, SEMINARS.length, SEMINARS[i]);
    }

    fillFilters();
    [q, fS, fV, fF, fT].forEach(function (el) {
      if (!el) return;
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    document.querySelectorAll('.sched-table th[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () {
        var k = th.getAttribute('data-sort');
        if (sortKey === k) sortAsc = !sortAsc;
        else { sortKey = k; sortAsc = true; }
        render();
      });
    });
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
