(function () {
  'use strict';
  var items = document.querySelectorAll('.sm-list li');
  if (!items.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('in-view');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.1 });
  items.forEach(function (el, i) {
    el.style.transitionDelay = (i % 8) * 0.04 + 's';
    io.observe(el);
  });
})();
