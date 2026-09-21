(function () {
  'use strict';
  var key = window.SEMINAR_KEY;
  if (!key) return;

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function render(data) {
    var box = document.getElementById('overview-box');
    if (box && data.overview) {
      var parts = String(data.overview).split(/\n+/).filter(Boolean);
      box.innerHTML = parts.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
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

  var urls = [
    '/reitansai/src/json/seminars-p0.json',
    '/reitansai/src/json/seminars-p1.json',
    '/reitansai/src/json/seminars-p2.json',
    '/reitansai/src/json/seminars-p3.json'
  ];

  Promise.all(urls.map(function (u) {
    return fetch(u + '?t=' + Date.now()).then(function (r) {
      return r.ok ? r.json() : {};
    }).catch(function () { return {}; });
  })).then(function (parts) {
    var all = {};
    parts.forEach(function (p) {
      Object.keys(p).forEach(function (k) { all[k] = p[k]; });
    });
    if (all[key]) render(all[key]);
    else console.warn('No data for', key);
  });
})();
