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
  var savedSet = {};

  function uniq(arr) {
    var o = {};
    arr.forEach(function (x) { if (x) o[x] = 1; });
    return Object.keys(o).sort();
  }

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

  function formatTime(t) {
    var mins = toMinutes(t);
    if (mins < 0) return t || '\u2014';
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
      progressLabel.textContent = '\u8aad\u307f\u8fbc\u307f\u5b8c\u4e86\uff08' + data.length + '\u4ef6\uff09';
      setTimeout(function () { progressWrap.classList.add('is-done'); }, 450);
    } else {
      progressLabel.textContent = '\u8aad\u307f\u8fbc\u307f\u4e2d\u2026 ' + done + '/' + total +
        (name ? '\uff08' + name + '\uff09' : '');
    }
  }

  function fillFilters() {
    if (!fS || !fV || !fF) return;
    fS.innerHTML = '<option value="">\u3059\u3079\u3066\u306e\u30bc\u30df</option>';
    fV.innerHTML = '<option value="">\u3059\u3079\u3066\u306e\u4f1a\u5834</option>';
    fF.innerHTML = '<option value="">\u3059\u3079\u3066\u306e\u5f62\u5f0f</option>';
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

  function refreshSavedSet() {
    savedSet = {};
    if (window.ReitansaiMySchedule) {
      window.ReitansaiMySchedule.readCache().forEach(function (r) {
        if (r.id) savedSet[r.id] = 1;
      });
    }
  }

  function ensureConflictCss() {
    if (document.getElementById('rt-consent-tutorial-css')) return;
    var link = document.createElement('link');
    link.id = 'rt-consent-tutorial-css';
    link.rel = 'stylesheet';
    link.href = '/reitansai/src/css/consent-tutorial.css';
    document.head.appendChild(link);
  }

  function showConflictDialog(candidate, conflicts) {
    return new Promise(function (resolve) {
      ensureConflictCss();
      var root = document.createElement('div');
      root.className = 'rt-overlay-root is-open';
      var list = conflicts.map(function (c) {
        return '<li><strong>' + esc(formatTime(c.t)) +
          (c.e ? '\u2013' + esc(formatTime(c.e)) : '') +
          '</strong> ' + esc(c.title || '') + '\uff08' + esc(c.s || '') + '\uff09</li>';
      }).join('');
      root.innerHTML =
        '<div class="rt-modal" role="dialog" aria-modal="true">' +
        '<h2>\u6642\u9593\u304c\u91cd\u306a\u3063\u3066\u3044\u307e\u3059</h2>' +
        '<p>\u4fdd\u5b58\u3057\u3088\u3046\u3068\u3057\u3066\u3044\u308b\u767a\u8868\u3068\u3001\u3059\u3067\u306b My\u30b9\u30b1\u30b8\u30e5\u30fc\u30eb \u306b\u3042\u308b\u767a\u8868\u306e\u6642\u9593\u304c\u91cd\u306a\u3063\u3066\u3044\u307e\u3059\u3002</p>' +
        '<p><strong>\u8ffd\u52a0\u5019\u88dc:</strong> ' + esc(formatTime(candidate.t)) +
        (candidate.e ? '\u2013' + esc(formatTime(candidate.e)) : '') + ' ' + esc(candidate.title) + '</p>' +
        '<ul class="rt-conflict-list">' + list + '</ul>' +
        '<div class="rt-modal-actions">' +
        '<button type="button" class="rt-btn rt-btn-ghost" data-act="cancel">\u30ad\u30e3\u30f3\u30bb\u30eb</button>' +
        '<button type="button" class="rt-btn rt-btn-ghost" data-act="ok">\u305d\u306e\u307e\u307e\u4fdd\u5b58</button>' +
        '<button type="button" class="rt-btn rt-btn-primary" data-act="replace">\u7f6e\u304d\u63db\u3048</button>' +
        '</div></div>';
      document.documentElement.appendChild(root);
      document.body.classList.add('rt-modal-open');
      function finish(act) {
        document.body.classList.remove('rt-modal-open');
        if (root.parentNode) root.parentNode.removeChild(root);
        resolve(act);
      }
      root.querySelectorAll('[data-act]').forEach(function (btn) {
        btn.addEventListener('click', function () { finish(btn.getAttribute('data-act')); });
      });
    });
  }

  function toast(msg) {
    var el = document.getElementById('rt-sched-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'rt-sched-toast';
      el.setAttribute('role', 'status');
      el.style.cssText =
        'position:fixed;bottom:5.5rem;left:50%;transform:translateX(-50%);z-index:9000;' +
        'padding:0.55rem 1rem;border-radius:999px;font-size:0.78rem;font-weight:700;' +
        'background:var(--rt-card);color:var(--rt-text);border:1px solid var(--rt-border);' +
        'box-shadow:var(--shadow);opacity:0;transition:opacity 0.25s;pointer-events:none;max-width:90vw;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.opacity = '0'; }, 2200);
  }

  async function onSaveClick(r, btn) {
    if (!window.ReitansaiMySchedule) {
      toast('\u4fdd\u5b58\u6a5f\u80fd\u3092\u8aad\u307f\u8fbc\u307f\u4e2d\u3067\u3059');
      return;
    }
    if (!window.ReitansaiUser || !window.ReitansaiUser.hasConsented()) {
      toast('\u521d\u56de\u540c\u610f\u306e\u3042\u3068\u3067\u4fdd\u5b58\u3067\u304d\u307e\u3059');
      if (window.ReitansaiOnboarding && window.ReitansaiOnboarding.showConsent) {
        window.ReitansaiOnboarding.showConsent();
      }
      return;
    }
    btn.disabled = true;
    try {
      var result = await window.ReitansaiMySchedule.save(r);
      if (!result.ok && result.conflicts) {
        var act = await showConflictDialog(r, result.conflicts);
        if (act === 'cancel') { toast('\u30ad\u30e3\u30f3\u30bb\u30eb\u3057\u307e\u3057\u305f'); return; }
        result = await window.ReitansaiMySchedule.save(r, { force: act });
      }
      if (result.already) toast('\u3059\u3067\u306b\u4fdd\u5b58\u6e08\u307f\u3067\u3059');
      else if (result.ok) toast('My\u30b9\u30b1\u30b8\u30e5\u30fc\u30eb\u306b\u4fdd\u5b58\u3057\u307e\u3057\u305f');
      else if (result.cancelled) toast('\u30ad\u30e3\u30f3\u30bb\u30eb\u3057\u307e\u3057\u305f');
      refreshSavedSet();
      render();
    } catch (err) {
      console.error(err);
      toast(err && err.message ? err.message : '\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f');
    } finally {
      btn.disabled = false;
    }
  }

  function render() {
    if (!body || !countEl) return;
    var rows = sortRows(filtered());
    countEl.textContent = String(rows.length);
    body.innerHTML = rows.map(function (r) {
      var venue = r.vn ? r.v + ' / ' + r.vn : r.v;
      var endCell = r.e ? esc(formatTime(r.e)) : '\u2014';
      var isSaved = !!(r.id && savedSet[r.id]);
      var saveBtn =
        '<button type="button" class="sched-save-btn' + (isSaved ? ' is-saved' : '') +
        '" data-id="' + esc(r.id) + '" title="' +
        (isSaved ? '\u4fdd\u5b58\u6e08\u307f' : 'My\u30b9\u30b1\u30b8\u30e5\u30fc\u30eb\u306b\u4fdd\u5b58') + '">' +
        (isSaved ? '\u4fdd\u5b58\u6e08' : '\u4fdd\u5b58') + '</button>';
      return '<tr data-sid="' + esc(r.id) + '">' +
        '<td class="t-time">' + esc(formatTime(r.t)) + '</td>' +
        '<td class="t-end">' + endCell + '</td>' +
        '<td class="t-seminar">' + esc(r.s) + '</td>' +
        '<td class="t-title">' + esc(r.title) + '</td>' +
        '<td class="t-sp">' + esc(r.sp) + '</td>' +
        '<td class="t-form">' + esc(r.form) + '</td>' +
        '<td class="t-venue">' + esc(venue) + '</td>' +
        '<td class="t-save">' + saveBtn + '</td></tr>';
    }).join('');
    body.querySelectorAll('.sched-save-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        var row = data.find(function (r) { return r.id === id; });
        if (row) onSaveClick(row, btn);
      });
    });
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
            var row = {
              t: p.start || '', e: p.end || '', s: d.name || name,
              title: p.title || '', sp: p.speakers || '', form: p.form || '',
              v: d.venue || '', vn: p.venue_note || '',
              no: p.no != null ? String(p.no) : ''
            };
            if (window.ReitansaiScheduleId) {
              row.id = window.ReitansaiScheduleId.makeScheduleId(row);
            }
            data.push(row);
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
    countEl.textContent = '\u8aad\u8fbc\u4e2d\u2026';
    setProgress(0, SEMINARS.length, '');
    for (var i = 0; i < SEMINARS.length; i++) {
      await loadSeminar(SEMINARS[i]);
      setProgress(i + 1, SEMINARS.length, SEMINARS[i]);
    }
    if (window.ReitansaiMySchedule) {
      await window.ReitansaiMySchedule.fetchRemote();
    }
    refreshSavedSet();
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
