(function () {
  var lines = ['雨の匂いが、原稿用紙に染みる。','一人称の「私」が、今日は少し遠い。','結末は、まだ空白のまま置いておく。'];
  var el = document.getElementById('cw-typewriter');
  var li = 0, ci = 0;
  function type() {
    if (!el) return;
    if (li >= lines.length) return;
    var line = lines[li];
    if (ci <= line.length) {
      el.textContent = lines.slice(0, li).join('\n') + (li ? '\n' : '') + line.slice(0, ci) + '▌';
      ci++; setTimeout(type, 40 + Math.random() * 40);
    } else { li++; ci = 0; setTimeout(type, 600); }
  }
  setTimeout(type, 800);
  var buf = '';
  document.addEventListener('keydown', function (e) {
    if (e.key.length === 1) {
      buf = (buf + e.key.toLowerCase()).slice(-5);
      if (buf === 'write') {
        el.textContent = '—— 秘密の一節が、インクから浮かび上がった。';
        document.body.classList.add('cw-reveal');
      }
    }
  });
})();
