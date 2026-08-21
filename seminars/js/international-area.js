(function () {
  var needle = document.getElementById('int-needle');
  var ang = 0;
  if (needle) setInterval(function () {
    ang += 2 + Math.random() * 4;
    needle.style.transform = 'rotate(' + ang + 'deg)';
  }, 80);
  document.addEventListener('keydown', function (e) {
    if (e.key.toLowerCase() === 'n') {
      ang = 0;
      if (needle) needle.style.transform = 'rotate(0deg)';
      document.body.classList.add('int-north');
      setTimeout(function () { document.body.classList.remove('int-north'); }, 1500);
    }
  });
})();
