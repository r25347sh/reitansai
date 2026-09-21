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
  const emoji = document.querySelector('.hero-emoji');
  if (emoji) emoji.classList.add('grow-leaf');
})();
