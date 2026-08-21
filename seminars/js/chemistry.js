(function () {
  var known = { h2o: '水 — 生命の溶媒', co2: '二酸化炭素', nacl: '塩化ナトリウム（塩）', o2: '酸素', c6h12o6: 'グルコース', reitansai: '未記載の化合物…反応開始！' };
  var input = document.getElementById('chem-formula');
  var out = document.getElementById('chem-result');
  var bubbles = document.getElementById('chem-bubbles');
  function pop() {
    if (!bubbles) return;
    for (var i = 0; i < 8; i++) {
      var b = document.createElement('span');
      b.className = 'bubble';
      b.style.left = Math.random() * 100 + '%';
      b.style.animationDuration = 1 + Math.random() * 1.5 + 's';
      bubbles.appendChild(b);
      setTimeout(function (el) { return function () { el.remove(); }; }(b), 2000);
    }
  }
  if (input) input.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var k = input.value.trim().toLowerCase().replace(/\s/g, '');
    if (known[k]) {
      out.textContent = known[k];
      pop();
      if (k === 'reitansai') document.body.classList.add('chem-react');
    } else {
      out.textContent = '未知の組成…（ヒント: H2O）';
    }
  });
})();
