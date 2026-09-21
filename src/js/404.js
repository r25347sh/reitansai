(function () {
  'use strict';
  var el = document.getElementById('error-code');
  if (!el) return;
  var n = 0;
  var target = 404;
  var step = function () {
    n += Math.ceil((target - n) / 6) || 1;
    if (n >= target) {
      el.textContent = '404';
      return;
    }
    el.textContent = String(n);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
})();
