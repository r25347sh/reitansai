(function () {
  'use strict';
  // Subtle pulse on 404 code when weather is storm/rain
  function tick() {
    var code = document.querySelector('.error-code');
    if (!code) return;
    var w = document.documentElement.dataset.weather || '';
    code.classList.toggle('is-glitch', w === 'storm' || w === 'rain-heavy');
  }
  setInterval(tick, 5000);
  tick();
})();
