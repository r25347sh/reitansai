(function () {
  var dial = document.getElementById('media-dial');
  var freq = document.getElementById('media-freq');
  var vu = document.getElementById('media-vu');
  function setF(v) {
    if (freq) freq.textContent = Number(v).toFixed(1) + ' FM';
    if (Math.abs(v - 88) < 0.15) {
      document.body.classList.add('media-tuned');
      if (freq) freq.textContent = '88.0 FM · 麗探祭ラジオ';
    } else document.body.classList.remove('media-tuned');
  }
  if (dial) {
    dial.addEventListener('input', function () { setF(dial.value); });
    setF(dial.value);
  }
  setInterval(function () {
    if (!vu) return;
    vu.querySelectorAll('span').forEach(function (s) {
      s.style.height = 20 + Math.random() * 80 + '%';
    });
  }, 120);
})();
