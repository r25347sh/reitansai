(function () {
  var quotes = ['言葉は、世界の影を拾う。','読まれぬ行に、真実は潜む。','ページをめくるたび、自分が少し変わる。','沈黙もまた、一編の詩である。'];
  var i = 0;
  var ep = document.getElementById('lit-epigraph');
  function show() {
    if (ep) {
      ep.style.opacity = '0';
      setTimeout(function () {
        ep.textContent = '「' + quotes[i % quotes.length] + '」';
        ep.style.opacity = '1';
      }, 200);
    }
  }
  show();
  var next = document.getElementById('lit-next');
  var prev = document.getElementById('lit-prev');
  if (next) next.addEventListener('click', function () {
    i++; show();
    var s = document.querySelector('.lit-spread');
    if (s) { s.classList.add('lit-flip'); setTimeout(function () { s.classList.remove('lit-flip'); }, 500); }
  });
  if (prev) prev.addEventListener('click', function () { i = Math.max(0, i - 1); show(); });
  var buf = '';
  document.addEventListener('keydown', function (e) {
    if (e.key.length === 1) {
      buf = (buf + e.key.toLowerCase()).slice(-4);
      if (buf === 'book') {
        document.body.classList.add('lit-night');
        if (ep) ep.textContent = '「夜の書架が、あなたを待っている。」';
      }
    }
  });
})();
