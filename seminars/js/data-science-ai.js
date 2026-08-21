(function () {
  var log = document.getElementById('ds-log');
  var input = document.getElementById('ds-cmd');
  if (!log || !input) return;
  function line(t, cls) {
    var d = document.createElement('div');
    d.className = cls || '';
    d.textContent = t;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }
  line('lab session started. type help', 'ds-muted');
  input.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var cmd = input.value.trim().toLowerCase();
    input.value = '';
    line('> ' + cmd);
    if (cmd === 'help') line('commands: help, whoami, train, clear, matrix');
    else if (cmd === 'whoami') line('researcher@reitansai');
    else if (cmd === 'train') {
      line('epoch 1/3 loss=0.42');
      setTimeout(function () { line('epoch 2/3 loss=0.21'); }, 400);
      setTimeout(function () { line('epoch 3/3 loss=0.08 · done', 'ds-ok'); }, 800);
    }
    else if (cmd === 'clear') log.innerHTML = '';
    else if (cmd === 'matrix') {
      line('01001101 01000001 01010100 01010010 01001001 01011000');
      document.body.classList.add('ds-matrix');
      setTimeout(function () { document.body.classList.remove('ds-matrix'); }, 2000);
    }
    else if (cmd === '') line('');
    else line('command not found: ' + cmd, 'ds-err');
  });
})();
