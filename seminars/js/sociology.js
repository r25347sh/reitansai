(function () {
  var c = document.getElementById('soc-canvas');
  if (!c || !c.getContext) return;
  var ctx = c.getContext('2d');
  var nodes = [];
  for (var i = 0; i < 12; i++) nodes.push({ x: 40 + Math.random() * 520, y: 30 + Math.random() * 120, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6 });
  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = 'rgba(106,72,160,0.25)';
    for (var i = 0; i < nodes.length; i++) for (var j = i + 1; j < nodes.length; j++) {
      var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
      if (dx * dx + dy * dy < 12000) { ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke(); }
    }
    nodes.forEach(function (n) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 10 || n.x > 590) n.vx *= -1;
      if (n.y < 10 || n.y > 170) n.vy *= -1;
      ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, Math.PI * 2); ctx.fillStyle = '#6a48a0'; ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
  c.addEventListener('click', function (e) {
    var r = c.getBoundingClientRect();
    nodes.push({ x: e.clientX - r.left, y: e.clientY - r.top, vx: 0, vy: 0 });
  });
})();
