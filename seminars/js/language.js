(function () {
  var cards = [{ ja: '探究', en: 'inquiry' }, { ja: '森', en: 'forest' }, { ja: '言葉', en: 'language' }, { ja: '麗澤', en: 'Reitaku' }];
  var i = 0, side = 'ja';
  var text = document.getElementById('lang-card-text');
  var btn = document.getElementById('lang-flip');
  function show() { if (text) text.textContent = side === 'ja' ? cards[i].ja : cards[i].en; }
  show();
  if (btn) btn.addEventListener('click', function () {
    if (side === 'ja') side = 'en';
    else { side = 'ja'; i = (i + 1) % cards.length; }
    show();
  });
})();
