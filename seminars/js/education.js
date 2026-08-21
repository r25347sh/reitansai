(function () {
  var board = document.getElementById('edu-chalk');
  if (!board) return;
  board.addEventListener('click', function (e) {
    var d = document.createElement('span');
    d.className = 'chalk-dust';
    d.style.left = e.offsetX + 'px';
    d.style.top = e.offsetY + 'px';
    board.appendChild(d);
    setTimeout(function () { d.remove(); }, 800);
  });
  var taps = 0, t;
  board.addEventListener('click', function () {
    taps++; clearTimeout(t); t = setTimeout(function () { taps = 0; }, 600);
    if (taps >= 5) {
      var note = document.createElement('p');
      note.className = 'edu-secret';
      note.textContent = '黒板の裏に、誰かの宿題が残っていた。';
      board.appendChild(note);
    }
  });
})();
