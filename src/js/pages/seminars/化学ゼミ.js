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
  const hero = document.querySelector('.seminar-hero');
  if (hero) {
    for (let i = 0; i < 8; i++) {
      const b = document.createElement('div');
      b.className = 'bubble';
      const size = 10 + Math.random() * 22;
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      b.style.left = (10 + Math.random() * 80) + '%';
      b.style.bottom = (5 + Math.random() * 30) + '%';
      b.style.animationDelay = (Math.random() * 4) + 's';
      b.style.animationDuration = (4 + Math.random() * 4) + 's';
      hero.appendChild(b);
    }
  }
})();
