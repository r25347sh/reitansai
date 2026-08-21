(function () {
  var head = document.getElementById('vid-playhead');
  var tc = document.getElementById('vid-timecode');
  var play = document.getElementById('vid-play');
  var playing = false, pos = 8, raf;
  function fmt(f) {
    var s = Math.floor(f / 24), m = Math.floor(s / 60), h = Math.floor(m / 60);
    return [h, m % 60, s % 60, Math.floor(f % 24)].map(function (n) {
      return String(n).padStart(2, '0');
    }).join(':');
  }
  function tick() {
    if (!playing) return;
    pos += 0.15;
    if (pos > 92) pos = 8;
    if (head) head.style.left = pos + '%';
    if (tc) tc.textContent = fmt(pos * 12);
    raf = requestAnimationFrame(tick);
  }
  if (play) play.addEventListener('click', function () {
    playing = !playing;
    play.textContent = playing ? '❚❚' : '▶';
    if (playing) tick(); else cancelAnimationFrame(raf);
  });
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
      e.preventDefault();
      if (play) play.click();
    }
    if (e.key === 'k') {
      document.body.classList.add('vid-cut');
      setTimeout(function () { document.body.classList.remove('vid-cut'); }, 120);
    }
  });
})();
