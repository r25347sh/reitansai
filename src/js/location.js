/**
 * Campus map interaction — location.js
 */
(function () {
  const INFO = {
    'main-hall': '本館 — 総合受付・講堂',
    library: '図書館 — 深夜まで開館する森の知の宝庫',
    lab: '実験棟 — 化学・AI・デジタル制作ラボ',
    festival: '祭会場 — 麗探祭メインステージ'
  };
  const infoEl = document.getElementById('map-info');
  if (!infoEl) return;
  document.querySelectorAll('[data-loc]').forEach(function (el) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', function () {
      var key = el.getAttribute('data-loc');
      infoEl.textContent = INFO[key] || key;
    });
  });
})();
