(function () {
  var btn = document.getElementById('evt-stamp');
  var ticket = document.getElementById('evt-ticket');
  function confetti() {
    for (var i = 0; i < 30; i++) {
      var el = document.createElement('span');
      el.className = 'evt-confetti';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.background = ['#e03030', '#f0c040', '#2080e0', '#20a040'][i % 4];
      el.style.animationDelay = Math.random() * 0.5 + 's';
      document.body.appendChild(el);
      setTimeout(function (e) { return function () { e.remove(); }; }(el), 2500);
    }
  }
  if (btn) btn.addEventListener('click', function () {
    if (ticket) ticket.classList.add('evt-stamped');
    confetti();
    btn.textContent = '入場済';
    btn.disabled = true;
  });
})();
