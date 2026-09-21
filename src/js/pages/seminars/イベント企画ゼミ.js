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
  const colors = ['var(--rt-accent)', '#ffd166', '#ff6b6b', '#4cc9f0'];
  for (let i = 0; i < 18; i++) {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;width:8px;height:8px;border-radius:2px;pointer-events:none;z-index:9999;opacity:0.9;';
    d.style.background = colors[i % colors.length];
    d.style.left = Math.random() * 100 + 'vw';
    d.style.top = '-10px';
    d.style.transition = 'transform 2.5s ease-out, opacity 2.5s ease-out';
    document.body.appendChild(d);
    requestAnimationFrame(() => {
      d.style.transform = 'translate(' + (Math.random()*80-40) + 'px,' + (window.innerHeight*0.6+Math.random()*200) + 'px) rotate(' + (Math.random()*360) + 'deg)';
      d.style.opacity = '0';
    });
    setTimeout(() => d.remove(), 2800);
  }
})();
