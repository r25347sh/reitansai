/* 壊れてるかも */
(function () {
  const bg = document.getElementById('home-bg') || document.querySelector('.page-home .bg-fixed');
  if (!bg) return;
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      bg.style.transform = 'translate3d(0, ' + (window.scrollY * 0.15) + 'px, 0)';
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
