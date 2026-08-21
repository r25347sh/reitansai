(function () {
  var code = document.getElementById('dig-code');
  var snippets = ['const dream = () => create(pixel);\nrender(dream());','glitch(0.2).then(story => publish(story));','// TODO: make something that feels alive'];
  var i = 0;
  if (code) setInterval(function () {
    i = (i + 1) % snippets.length;
    code.textContent = snippets[i];
    code.classList.add('dig-flash');
    setTimeout(function () { code.classList.remove('dig-flash'); }, 300);
  }, 4000);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'g') {
      document.body.classList.add('dig-glitch');
      setTimeout(function () { document.body.classList.remove('dig-glitch'); }, 600);
    }
  });
})();
