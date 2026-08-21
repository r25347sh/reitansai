(function () {
  var bar = document.getElementById('agri-bar');
  var plant = document.getElementById('agri-plant');
  function update() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    if (bar) bar.style.width = Math.min(100, p * 100) + '%';
    if (plant) plant.style.transform = 'scale(' + (0.7 + p * 0.5) + ')';
    if (p > 0.92) document.body.classList.add('agri-bloom');
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
  if (plant) plant.addEventListener('click', function () {
    document.body.classList.add('agri-water');
    setTimeout(function () { document.body.classList.remove('agri-water'); }, 1000);
  });
})();
