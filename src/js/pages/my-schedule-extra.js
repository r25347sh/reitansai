/**
 * My-schedule extras: next-card countdown, conflict warn, text/CSV/print export
 * Loads after my-schedule.js — does not replace core list/remove logic.
 */
(function () {
  'use strict';

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
    var mins = toMinutes(t);
    if (mins < 0) return t == null || t === '' ? '—' : String(t);
    var h = Math.floor(mins / 60),
      m = mins % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
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

  function collectRows() {
    var body = document.getElementById('my-sched-body');
    if (!body) return [];
    var rows = [];
    body.querySelectorAll('tr[data-sid]').forEach(function (tr) {
      var tds = tr.querySelectorAll('td');
      if (tds.length < 7) return;
      var hasNo = tds.length >= 9;
      var i = hasNo ? 1 : 0;
      rows.push({
        id: tr.getAttribute('data-sid') || '',
        no: hasNo ? (tds[0].textContent || '').trim() : '',
        t: (tds[i].textContent || '').trim(),
        e: (tds[i + 1].textContent || '').trim(),
        s: (tds[i + 2].textContent || '').trim(),
        title: (tds[i + 3].textContent || '').trim().split('\n')[0],
        sp: (tds[i + 4].textContent || '').trim(),
        form: (tds[i + 5].textContent || '').trim(),
        v: (tds[i + 6].textContent || '').trim()
      });
    });
    return rows;
  }

  function updateNextCard(rows) {
    var nextCard = document.getElementById('my-next-card');
    if (!nextCard) return;
    var nowM = nowMinutesJST();
    var sorted = rows.slice().sort(function (a, b) {
      return toMinutes(a.t) - toMinutes(b.t);
    });
    var live = null,
      next = null;
    sorted.forEach(function (r) {
      var s = toMinutes(r.t);
      var e = toMinutes(r.e);
      if (s < 0) return;
      if (e < 0) e = s + 10;
      if (nowM >= s && nowM < e && !live) live = r;
      if (s > nowM && !next) next = r;
    });
    var target = live || next;
    if (!target) {
      nextCard.hidden = true;
      return;
    }
    var labelEl = nextCard.querySelector('.mnc-label');
    var titleEl = nextCard.querySelector('.mnc-title');
    var metaEl = nextCard.querySelector('.mnc-meta');
    var cdEl = nextCard.querySelector('.mnc-countdown');
    var s = toMinutes(target.t);
    var e = toMinutes(target.e);
    if (e < 0) e = s + 10;
    if (live) {
      if (labelEl) labelEl.textContent = 'いま発表中';
      var left = e - nowM;
      if (cdEl) cdEl.textContent = left > 0 ? '終了まで あと約 ' + left + ' 分' : 'まもなく終了';
    } else {
      if (labelEl) labelEl.textContent = '次の発表';
      var wait = s - nowM;
      if (cdEl) {
        if (wait <= 0) cdEl.textContent = 'まもなく開始';
        else if (wait < 60) cdEl.textContent = '開始まで あと約 ' + wait + ' 分';
        else cdEl.textContent = '開始 ' + formatTime(target.t);
      }
    }
    if (titleEl) titleEl.textContent = target.title || '（無題）';
    if (metaEl) {
      metaEl.textContent =
        formatTime(target.t) +
        '–' +
        formatTime(target.e) +
        ' · ' +
        (target.s || '') +
        ' · ' +
        (target.v || '') +
        (target.sp ? ' · ' + target.sp : '');
    }
    nextCard.hidden = false;
  }

  function updateConflicts(rows) {
    var el = document.getElementById('my-conflict-warn');
    if (!el) return;
    var pairs = [];
    var sorted = rows.slice().sort(function (a, b) {
      return toMinutes(a.t) - toMinutes(b.t);
    });
    for (var i = 0; i < sorted.length; i++) {
      for (var j = i + 1; j < sorted.length; j++) {
        var a = sorted[i],
          b = sorted[j];
        var as = toMinutes(a.t),
          ae = toMinutes(a.e);
        var bs = toMinutes(b.t),
          be = toMinutes(b.e);
        if (as < 0 || bs < 0) continue;
        if (ae < 0) ae = as + 10;
        if (be < 0) be = bs + 10;
        if (as < be && bs < ae) pairs.push([a, b]);
      }
    }
    if (!pairs.length) {
      el.hidden = true;
      el.textContent = '';
      return;
    }
    el.textContent =
      '時間の重なりが ' +
      pairs.length +
      ' 組あります: ' +
      pairs
        .slice(0, 3)
        .map(function (p) {
          return '「' + (p[0].title || '') + '」と「' + (p[1].title || '') + '」';
        })
        .join('、') +
      (pairs.length > 3 ? ' ほか' : '');
    el.hidden = false;
  }

  function applyRowClasses() {
    var body = document.getElementById('my-sched-body');
    if (!body) return;
    var nowM = nowMinutesJST();
    body.querySelectorAll('tr[data-sid]').forEach(function (tr) {
      var tds = tr.querySelectorAll('td');
      var hasNo = tds.length >= 9;
      var i = hasNo ? 1 : 0;
      var s = toMinutes((tds[i] && tds[i].textContent) || '');
      var e = toMinutes((tds[i + 1] && tds[i + 1].textContent) || '');
      if (e < 0 && s >= 0) e = s + 10;
      tr.classList.remove('row-live', 'row-soon', 'row-past');
      if (s < 0) return;
      if (nowM >= s && nowM < e) tr.classList.add('row-live');
      else if (e <= nowM) tr.classList.add('row-past');
      else if (s - nowM > 0 && s - nowM <= 30) tr.classList.add('row-soon');
    });
  }

  function refreshExtras() {
    var rows = collectRows();
    updateNextCard(rows);
    updateConflicts(rows);
    applyRowClasses();
  }

  function rowsToText(rows) {
    var lines = ['麗探祭 2026 Myスケジュール', '発表枠 09:30–11:30', ''];
    rows.forEach(function (r, i) {
      lines.push(
        i +
          1 +
          '. ' +
          formatTime(r.t) +
          '–' +
          formatTime(r.e) +
          '  ' +
          (r.title || '') +
          '  / ' +
          (r.s || '') +
          '  @ ' +
          (r.v || '') +
          (r.sp ? '  (' + r.sp + ')' : '')
      );
    });
    lines.push('', '（この端末の IndexedDB に保存された一覧）');
    return lines.join('\n');
  }

  function rowsToCsv(rows) {
    function cell(v) {
      var s = String(v == null ? '' : v);
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }
    var lines = [['通しNo', '開始', '終了', 'ゼミ', 'タイトル', '発表者', '形式', '会場'].join(',')];
    rows.forEach(function (r) {
      lines.push(
        [cell(r.no), cell(formatTime(r.t)), cell(formatTime(r.e)), cell(r.s), cell(r.title), cell(r.sp), cell(r.form), cell(r.v)].join(',')
      );
    });
    return lines.join('\n');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        resolve();
      } catch (e) {
        reject(e);
      }
      document.body.removeChild(ta);
    });
  }

  function downloadCsv(text) {
    var blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'reitansai-my-schedule.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 500);
  }

  function boot() {
    var exportTextBtn = document.getElementById('my-export-text');
    var exportCsvBtn = document.getElementById('my-export-csv');
    var printBtn = document.getElementById('my-print');
    if (exportTextBtn) {
      exportTextBtn.addEventListener('click', function () {
        copyText(rowsToText(collectRows()))
          .then(function () {
            exportTextBtn.textContent = 'コピーしました';
            setTimeout(function () {
              exportTextBtn.textContent = 'テキストコピー';
            }, 1800);
          })
          .catch(function () {
            alert('コピーに失敗しました');
          });
      });
    }
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', function () {
        downloadCsv(rowsToCsv(collectRows()));
      });
    }
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }
    var body = document.getElementById('my-sched-body');
    if (body) {
      var obs = new MutationObserver(function () {
        refreshExtras();
      });
      obs.observe(body, { childList: true, subtree: true });
    }
    refreshExtras();
    setInterval(refreshExtras, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
