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
    }, { threshold: 0.1 });
    cards.forEach(function (c, i) {
      c.style.transitionDelay = (i % 12) * 0.05 + 's';
      io.observe(c);
    });
  }
  function themeExtras(data) {
    var theme = (data && data.theme) || '';
    var list = document.getElementById('pres-list');
    if (!list) return;

    if (theme === 'theme-data') {
      list.querySelectorAll('.pres-card').forEach(function (card, i) {
        var bar = document.createElement('div');
        bar.className = 'data-bar';
        var span = document.createElement('span');
        span.style.setProperty('--w', (45 + (i * 17) % 50) + '%');
        bar.appendChild(span);
        card.appendChild(bar);
      });
      var hero = document.querySelector('.seminar-hero');
      if (hero) {
        var scan = document.createElement('div');
        scan.className = 'scan-fx';
        hero.appendChild(scan);
      }
    }
    if (theme === 'theme-tour') {
      list.querySelectorAll('.pres-card').forEach(function (card) {
        var st = document.createElement('div');
        st.className = 'stamp';
        st.textContent = 'VIEW';
        card.appendChild(st);
      });
    }
    if (theme === 'theme-digital') {
      list.querySelectorAll('.pres-card').forEach(function (card, i) {
        var line = document.createElement('div');
        line.className = 'code-line';
        line.textContent = '// content[' + i + '] · export ready';
        card.insertBefore(line, card.firstChild);
      });
    }
    if (theme === 'theme-film') {
      list.querySelectorAll('.pres-title').forEach(function (t) {
        var icon = document.createElement('span');
        icon.className = 'play-icon';
        t.insertBefore(icon, t.firstChild);
      });
    }
    if (theme === 'theme-novel') {
      list.querySelectorAll('.pres-title').forEach(function (t) {
        t.classList.add('type-cursor');
      });
    }
    if (theme === 'theme-agri') {
      list.querySelectorAll('.pres-no').forEach(function (n) {
        n.classList.add('grow-leaf');
      });
    }
    if (theme === 'theme-lang') {
      var hero = document.querySelector('.seminar-hero');
      if (hero && !hero.querySelector('.wave-bars')) {
        var waves = document.createElement('div');
        waves.className = 'wave-bars';
        for (var i = 0; i < 12; i++) {
          var s = document.createElement('span');
          s.style.animationDelay = (i * 0.08) + 's';
          waves.appendChild(s);
        }
        var tag = hero.querySelector('.tagline');
        if (tag) tag.after(waves);
      }
    }
    if (theme === 'theme-moral') {
      list.classList.add('dense');
      var hero = document.querySelector('.seminar-hero');
      if (hero && !hero.querySelector('.balance-mark')) {
        var m = document.createElement('div');
        m.className = 'balance-mark';
        hero.appendChild(m);
      }
    }
    if (theme === 'theme-intl') {
      var hero = document.querySelector('.seminar-hero');
      if (hero && !hero.querySelector('.globe-ring')) {
        var g = document.createElement('div');
        g.className = 'globe-ring';
        hero.appendChild(g);
      }
    }

    if (theme === 'theme-chem') {
      var hero = document.querySelector('.seminar-hero');
      if (hero && !hero.querySelector('.bubble-layer')) {
        var layer = document.createElement('div');
        layer.className = 'bubble-layer';
        for (var b = 0; b < 8; b++) {
          var bub = document.createElement('span');
          bub.className = 'bubble';
          bub.style.left = (10 + b * 11) + '%';
          bub.style.width = bub.style.height = (8 + (b % 4) * 4) + 'px';
          bub.style.animationDuration = (3 + (b % 5)) + 's';
          bub.style.animationDelay = (b * 0.4) + 's';
          layer.appendChild(bub);
        }
        hero.style.position = 'relative';
        hero.appendChild(layer);
      }
    }
    if (theme === 'theme-event') {
      list.querySelectorAll('.pres-card').forEach(function (card, i) {
        card.style.transitionDelay = (i * 0.06) + 's';
      });
    }

    if (theme === 'theme-media') {
      list.querySelectorAll('.pres-card').forEach(function (card) {
        var sig = document.createElement('div');
        sig.className = 'signal-line';
        var head = card.querySelector('.pres-head');
        if (head) head.after(sig);
      });
    }
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
      var end = esc(p.end || '');
      var title = esc(p.title || '');
      var form = p.form ? '<span class="pres-badge pres-form">' + esc(p.form) + '</span>' : '';
      var dur = p.duration ? '<span class="pres-badge pres-duration">' + esc(p.duration) + (String(p.duration).indexOf('分') >= 0 || String(p.duration).indexOf('時間') >= 0 ? '' : '分') + '</span>' : '';
      var speakers = esc(p.speakers || '');
      var ov = p.overview ? '<div class="pres-overview">' + esc(p.overview) + '</div>' : '';
      var vn = p.venue_note ? '<div class="venue-note">会場: ' + esc(p.venue_note) + '</div>' : '';
      var timeHtml = '';
      if (start) {
        timeHtml = '<div class="pres-time-block" title="発表時間">' +
          '<span class="pres-meta-label">時間</span>' +
          '<span class="pres-time-row">' +
          '<span class="pres-time">' + start + '</span>' +
          (end ? '<span class="pres-time-sep" aria-hidden="true">–</span><span class="pres-time-end">' + end + '</span>' : '') +
          '</span></div>';
      }
      return '<article class="pres-card">' +
        '<div class="pres-head">' +
        '<div class="pres-no" title="通し番号"><span class="pres-meta-label">No.</span><span class="pres-no-val">' + no + '</span></div>' +
        timeHtml +
        '<div class="pres-badges">' + form + dur + '</div>' +
        '</div>' +
        '<h3 class="pres-title">' + title + '</h3>' +
        (speakers ? '<div class="pres-speakers"><span class="pres-meta-label">発表者</span> ' + speakers + '</div>' : '') +
        vn + ov + '</article>';
    }).join('');
    observeCards();
    themeExtras(data);
  }
  function boot() {
    if (window.SEMINAR_DATA) { render(window.SEMINAR_DATA); return; }
    var key = window.SEMINAR_KEY;
    if (key && window.SEMINARS_ALL && window.SEMINARS_ALL[key]) render(window.SEMINARS_ALL[key]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
