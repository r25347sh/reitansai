(function () {
  'use strict';
  const cards = document.querySelectorAll('.pres-card');
  if (cards.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });
    cards.forEach((c, i) => {
      c.style.transitionDelay = (i % 10) * 0.04 + 's';
      io.observe(c);
    });
  }
  cards.forEach((c) => {
    const bar = document.createElement('div');
    bar.className = 'data-bar';
    const span = document.createElement('span');
    const w = 40 + Math.random() * 55;
    bar.appendChild(span);
    c.appendChild(bar);
    const obs = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting) {
          span.style.width = w + '%';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    obs.observe(c);
  });
})();
