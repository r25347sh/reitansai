(function () {
  var route = document.getElementById('tour-route');
  var step = 0;
  if (route) route.addEventListener('click', function () {
    step = (step + 1) % 3;
    route.querySelectorAll('.tour-dot').forEach(function (d, i) { d.classList.toggle('active', i <= step); });
    if (step === 2) {
      document.body.classList.add('tour-arrived');
      setTimeout(function () { document.body.classList.remove('tour-arrived'); }, 2000);
    }
  });
  var pol = document.getElementById('tour-polaroids');
  if (pol) pol.addEventListener('click', function () { pol.classList.toggle('tour-shuffle'); });
})();
