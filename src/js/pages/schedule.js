/**
 * schedule page — timeline reveal + subtle table polish
 */
(function () {
  'use strict';

  const items = document.querySelectorAll('.tl-item');
  if (items.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -30px 0px' });

    items.forEach((el, i) => {
      el.style.transitionDelay = (i * 0.07) + 's';
      io.observe(el);
    });
  }

  // Optional: highlight current phase if today is event day (for future use)
  // For now just ensure table rows animate lightly on load
  const rows = document.querySelectorAll('.venue-table tbody tr');
  rows.forEach((row, i) => {
    row.style.opacity = '0';
    row.style.transform = 'translateY(8px)';
    row.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    setTimeout(() => {
      row.style.opacity = '1';
      row.style.transform = 'translateY(0)';
    }, 120 + i * 35);
  });
})();
