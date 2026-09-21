(function () {
  'use strict';

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function render(data) {
    if (!data) return;
    var box = document.getElementById('overview-box');
    if (box && data.overview) {
      var parts = String(data.overview).split(/\n+/).filter(Boolean);
      box.innerHTML = parts.map(function (p) {
        return '<p>' + esc(p) + '</p>';
      }).join('');
    }
    var list = document.getElementById('pres-list');
    if (!list || !data.presentations) return;
    list.innerHTML = data.presentations.map(function (p, i) {
      var no = esc(p.no || (i + 1));
      var start = esc(p.start || '');
      var title = esc(p.title || '');
      var form = p.form ? '<span class="pres-form">' + esc(p.form) + '</span>' : '';
      var dur = p.duration ? '<span class="pres-duration">' + esc(p.duration) + '</span>' : '';
      var speakers = esc(p.speakers || '');
      var ov = p.overview ? '<div class="pres-overview">' + esc(p.overview) + '</div>' : '';
      var vn = p.venue_note ? '<div class="venue-note">会場: ' + esc(p.venue_note) + '</div>' : '';
      return '<article class="pres-card">' +
        '<div class="pres-head"><span class="pres-no">#' + no + '</span>' +
        (start ? '<span class="pres-time">' + start + '</span>' : '') +
        form + dur + '</div>' +
        '<h3 class="pres-title">' + title + '</h3>' +
        (speakers ? '<div class="pres-speakers">' + speakers + '</div>' : '') +
        vn + ov + '</article>';
    }).join('');
  }

  function resolveData() {
    if (window.SEMINAR_DATA) return window.SEMINAR_DATA;
    var key = window.SEMINAR_KEY;
    if (key && window.SEMINARS_ALL && window.SEMINARS_ALL[key]) return window.SEMINARS_ALL[key];
    return null;
  }

  function boot() {
    var data = resolveData();
    if (data) {
      render(data);
      return;
    }
    // fallback: wait a tick for async data scripts
    setTimeout(function () {
      var d = resolveData();
      if (d) render(d);
    }, 50);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
