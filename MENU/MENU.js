/**
 * Radial Menu — quiet, simple
 * Long-press / triple-tap · Esc to close
 */
(function () {
  var inSeminars = /\/seminars\//.test(location.pathname);
  var root = inSeminars ? "../" : "";
  var DATA = [
    { label: "ホーム", icon: "🏛", url: root + "index.html" },
    { label: "ゼミ一覧", icon: "🌳", items: [
      { label: "遊びの探究", icon: "🎮", url: root + "seminars/asobi-tankyu.html" },
      { label: "データAI", icon: "🤖", url: root + "seminars/data-science-ai.html" },
      { label: "デジタル", icon: "💻", url: root + "seminars/digital-content.html" },
      { label: "イベント", icon: "🎉", url: root + "seminars/event-planning.html" },
      { label: "文芸創作", icon: "✍️", url: root + "seminars/creative-writing.html" },
      { label: "映像編集", icon: "🎬", url: root + "seminars/video-editing.html" },
      { label: "メディア", icon: "📡", url: root + "seminars/media.html" },
      { label: "化学", icon: "🧪", url: root + "seminars/chemistry.html" },
      { label: "国際地域", icon: "🌍", url: root + "seminars/international-area.html" },
      { label: "教育", icon: "📖", url: root + "seminars/education.html" },
      { label: "文学", icon: "📕", url: root + "seminars/literature.html" },
      { label: "社会", icon: "🏛", url: root + "seminars/sociology.html" },
      { label: "観光", icon: "🗾", url: root + "seminars/tourism.html" },
      { label: "語学", icon: "🗣", url: root + "seminars/language.html" },
      { label: "農業", icon: "🌾", url: root + "seminars/agriculture.html" }
    ]}
  ];
  var LONG = 360, TRIPLE = 300, MOVE = 8;
  var CAPS = [6, 10, 14], RADII = [115, 185, 255];
  var menuEl, itemsC, orbitsC, coreBtn, canvas, ctx, backdrop;
  var timer, startX, startY, isOpen = false, stack = [];
  var taps = 0, tapTimer;

  function go(url) { close(); setTimeout(function () { location.href = url; }, 150); }

  function burst() {
    if (!canvas || !ctx) return;
    canvas.width = canvas.height = 600;
    var cx = 300, cy = 300, r1 = 8, a1 = 1, r2 = 4, a2 = 0.8;
    var cols = ["hsl(145,30%,40%)", "hsl(40,35%,50%)", "hsl(150,25%,45%)"];
    var ps = Array.from({ length: 24 }, function (_, i) {
      var a = (i / 24) * Math.PI * 2, s = Math.random() * 5 + 2.5;
      return { x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: Math.random() * 2.5 + 1, color: cols[i % 3], alpha: 1 };
    });
    (function draw() {
      ctx.clearRect(0, 0, 600, 600);
      if (a1 > 0) { ctx.beginPath(); ctx.arc(cx, cy, r1, 0, Math.PI * 2); ctx.strokeStyle = "rgba(53,107,74," + a1 + ")"; ctx.lineWidth = 2.5; ctx.stroke(); r1 += 7; a1 -= 0.05; }
      if (a2 > 0) { ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI * 2); ctx.strokeStyle = "rgba(168,146,90," + a2 + ")"; ctx.lineWidth = 2; ctx.stroke(); r2 += 5.5; a2 -= 0.04; }
      var alive = false;
      ps.forEach(function (p) {
        if (p.alpha > 0) { alive = true; p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.alpha -= 0.035;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.alpha); ctx.fill(); ctx.globalAlpha = 1; }
      });
      if (a1 > 0 || a2 > 0 || alive) requestAnimationFrame(draw);
    })();
  }

  function layout(items) {
    var out = [], left = items.length, idx = 0;
    for (var s = 0; s < CAPS.length && left > 0; s++) {
      var n = Math.min(left, CAPS[s]), R = RADII[s];
      for (var i = 0; i < n; i++) {
        var ang = (i / n) * 2 * Math.PI - Math.PI / 2;
        out.push({ item: items[idx++], x: Math.round(Math.cos(ang) * R), y: Math.round(Math.sin(ang) * R), shell: s });
      }
      left -= n;
    }
    return out;
  }

  function render(items) {
    itemsC.querySelectorAll(".rm-item").forEach(function (el) {
      el.classList.remove("rendered"); setTimeout(function () { el.remove(); }, 180);
    });
    orbitsC.innerHTML = "";
    var L = layout(items), shells = {};
    L.forEach(function (d, index) {
      shells[d.shell] = 1;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rm-item" + (d.item.items ? " has-sub" : "");
      btn.setAttribute("data-label", d.item.label);
      btn.setAttribute("aria-label", d.item.label);
      btn.innerHTML = d.item.icon;
      btn.style.setProperty("--x", d.x + "px");
      btn.style.setProperty("--y", d.y + "px");
      btn.style.transitionDelay = index * 0.02 + "s";
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (d.item.items && d.item.items.length) { stack.push(items); render(d.item.items); burst(); }
        else if (d.item.url) go(d.item.url);
      });
      itemsC.appendChild(btn);
      requestAnimationFrame(function () { setTimeout(function () { btn.classList.add("rendered"); }, 10); });
    });
    Object.keys(shells).forEach(function (s) {
      s = +s; var o = document.createElement("div"); o.className = "rm-shell-orbit";
      var d = RADII[s] * 2; o.style.width = o.style.height = d + "px";
      o.style.marginTop = o.style.marginLeft = -RADII[s] + "px"; orbitsC.appendChild(o);
    });
    if (stack.length) coreBtn.classList.add("visible"); else coreBtn.classList.remove("visible");
  }

  function createDOM() {
    menuEl = document.createElement("div");
    menuEl.className = "radial-menu-wrapper";
    menuEl.setAttribute("role", "dialog");
    menuEl.setAttribute("aria-label", "メニュー");
    backdrop = document.createElement("div"); backdrop.className = "rm-backdrop";
    backdrop.addEventListener("click", close); menuEl.appendChild(backdrop);
    canvas = document.createElement("canvas"); canvas.className = "rm-canvas-layer";
    ctx = canvas.getContext("2d"); menuEl.appendChild(canvas);
    orbitsC = document.createElement("div"); menuEl.appendChild(orbitsC);
    itemsC = document.createElement("div"); menuEl.appendChild(itemsC);
    coreBtn = document.createElement("button"); coreBtn.type = "button";
    coreBtn.className = "rm-core-btn"; coreBtn.innerHTML = "←";
    coreBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (stack.length) { render(stack.pop()); burst(); } else close();
    });
    menuEl.appendChild(coreBtn);
    document.body.appendChild(menuEl);
  }

  function open(x, y) {
    var m = 180;
    menuEl.style.left = Math.max(m, Math.min(x, window.innerWidth - m)) + "px";
    menuEl.style.top = Math.max(m, Math.min(y, window.innerHeight - m)) + "px";
    menuEl.classList.add("active"); isOpen = true; stack = []; render(DATA); burst();
  }
  function close() {
    if (!menuEl) return;
    menuEl.classList.remove("active");
    itemsC.querySelectorAll(".rm-item").forEach(function (el) { el.classList.remove("rendered"); });
    coreBtn.classList.remove("visible"); isOpen = false;
  }

  function init() {
    document.addEventListener("keydown", function (e) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (stack.length) { render(stack.pop()); burst(); } else close();
      }
    });
    document.addEventListener("pointerdown", function (e) {
      if (isOpen && menuEl.contains(e.target) && !e.target.classList.contains("rm-backdrop")) return;
      if (isOpen && !menuEl.contains(e.target)) { close(); return; }
      startX = e.clientX; startY = e.clientY; taps++;
      clearTimeout(tapTimer);
      if (taps === 3) { clearTimeout(timer); timer = null; taps = 0; open(startX, startY); return; }
      tapTimer = setTimeout(function () { taps = 0; }, TRIPLE);
      clearTimeout(timer);
      timer = setTimeout(function () { taps = 0; open(startX, startY); }, LONG);
    });
    document.addEventListener("pointermove", function (e) {
      if (!timer || isOpen) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE) { clearTimeout(timer); timer = null; }
    });
    document.addEventListener("pointerup", function () {
      if (timer && !isOpen) { clearTimeout(timer); timer = null; }
    });
    document.addEventListener("contextmenu", function (e) { if (isOpen) e.preventDefault(); });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", function () { createDOM(); init(); });
  else { createDOM(); init(); }
})();
