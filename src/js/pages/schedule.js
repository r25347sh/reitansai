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
  var sortKey = 't';
  var sortAsc = true;
  var data = [];

  function uniq(arr) {
    var o = {};
    arr.forEach(function (x) { if (x) o[x] = 1; });
    return Object.keys(o).sort();
  }

  function timeHour(t) {
    var m = String(t || '').match(/(\d{1,2})/);
    return m ? parseInt(m[1], 10) : -1;
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function fillFilters() {
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
    var qq = (q.value || '').trim().toLowerCase();
    var ss = fS.value, vv = fV.value, ff = fF.value, th = fT.value;
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
      if (sortKey === 't') {
        var av = timeHour(a.t) * 100 + (parseInt((String(a.t).match(/:(\d+)/) || [])[1] || 0, 10));
        var bv = timeHour(b.t) * 100 + (parseInt((String(b.t).match(/:(\d+)/) || [])[1] || 0, 10));
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
    var rows = sortRows(filtered());
    countEl.textContent = String(rows.length);
    body.innerHTML = rows.map(function (r) {
      var venue = r.vn ? r.v + ' / ' + r.vn : r.v;
      return '<tr><td class="t-time">' + esc(r.t) + '</td><td class="t-seminar">' + esc(r.s) +
        '</td><td class="t-title">' + esc(r.title) + '</td><td class="t-sp">' + esc(r.sp) +
        '</td><td class="t-form">' + esc(r.form) + '</td><td class="t-venue">' + esc(venue) + '</td></tr>';
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
    countEl.textContent = '読込中…';
    for (var i = 0; i < SEMINARS.length; i++) {
      await loadSeminar(SEMINARS[i]);
    }
    fillFilters();
    [q, fS, fV, fF, fT].forEach(function (el) {
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

  boot();
})();
