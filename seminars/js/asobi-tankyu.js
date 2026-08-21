(function () {
  function toast(m) {
    var t = document.createElement('div');
    t.textContent = m;
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#6b2808;color:#fff;padding:10px 18px;border-radius:999px;z-index:99999;font-size:0.9rem';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  }
  document.querySelectorAll('.toy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var toy = btn.getAttribute('data-toy');
      if (toy === 'dice') {
        var n = 1 + Math.floor(Math.random() * 6);
        toast('サイコロ → ' + n + (n === 6 ? '！やったね' : ''));
        btn.style.transform = 'rotate(' + (360 * n) + 'deg)';
      } else if (toy === 'ball') {
        btn.classList.add('toy-bounce');
        toast('ボールが跳ねた');
        setTimeout(function () { btn.classList.remove('toy-bounce'); }, 600);
      } else {
        toast('ジョーカー登場');
        btn.textContent = Math.random() > 0.5 ? '🃏' : '🂡';
      }
    });
  });
  var c = 0, tm;
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.asobi-mascot')) return;
    c++; clearTimeout(tm); tm = setTimeout(function () { c = 0; }, 500);
    if (c >= 3) { c = 0; toast('かくれんぼ発見！'); document.body.classList.toggle('asobi-party'); }
  });
})();
