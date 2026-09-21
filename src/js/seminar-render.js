(function () {
  'use strict';
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }
  function observeCards() {
    var cards = document.querySelectorAll('.pres-card');
    if (!cards.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    cards.forEach(function (c, i) {
      c.style.transitionDelay = (i % 10) * 0.04 + 's';
      io.observe(c);
    });
  }
  function render(data) {
    if (!data) return;
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
    observeCards();
  }
  function boot() {
    if (window.SEMINAR_DATA) { render(window.SEMINAR_DATA); return; }
    var key = window.SEMINAR_KEY;
    if (key && window.SEMINARS_ALL && window.SEMINARS_ALL[key]) render(window.SEMINARS_ALL[key]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
