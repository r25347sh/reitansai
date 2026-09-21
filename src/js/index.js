/**
 * Home page — subtle entrance animations
 */
(function () {
  'use strict';
  const cards = document.querySelectorAll('.card-grid .card');
  if (!cards.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en, i) => {
      if (en.isIntersecting) {
        en.target.style.transitionDelay = (i % 8) * 0.04 + 's';
        en.target.classList.add('in-view');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  cards.forEach((c) => {
    c.style.opacity = '0';
    c.style.transform = 'translateY(18px)';
    c.style.transition = 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.34,1.2,0.64,1)';
    io.observe(c);
  });

  // style for in-view
  const style = document.createElement('style');
  style.textContent = '.card.in-view{opacity:1!important;transform:translateY(0)!important}';
  document.head.appendChild(style);
})();
