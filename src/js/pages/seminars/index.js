/**
 * seminars/index — filter + staggered entrance
 */
(function () {
  'use strict';

  const grid = document.getElementById('seminar-grid');
  const cards = grid ? Array.from(grid.querySelectorAll('.seminar-card')) : [];
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Filter logic
  const mediaVenues = ['メディアセンター'];
  const externalTeachers = ['ミエタ'];

  function applyFilter(key) {
    cards.forEach((card) => {
      const count = parseInt(card.dataset.count || '0', 10);
      const text = card.textContent || '';
      let show = true;
      if (key === 'many') show = count >= 8;
      else if (key === 'media') show = mediaVenues.some((v) => text.includes(v));
      else if (key === 'external') show = externalTeachers.some((t) => text.includes(t));
      card.classList.toggle('is-hidden', !show);
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      applyFilter(btn.dataset.filter || 'all');
    });
  });

  // Intersection observer for entrance
  if (cards.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

    cards.forEach((c, i) => {
      c.style.transitionDelay = (i % 6) * 0.05 + 's';
      io.observe(c);
    });
  }
})();
