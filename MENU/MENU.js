/**
 * Radial Menu — fixed open/close, image icons, triple-tap
 */
(function () {
  var inSeminars = /\/seminars\//.test(location.pathname);
  var root = inSeminars ? "../" : "";

  var ICON = {
    "asobi-tankyu": root + "public/images/seminars/Asobi%20seminar%20logo.svg",
    "data-science-ai": root + "public/images/seminars/data-science-ai.svg",
    "digital-content": root + "public/images/seminars/digital-content.svg",
    "event-planning": root + "public/images/seminars/event-planning.svg",
    "creative-writing": root + "public/images/seminars/creative-writing.svg",
    "video-editing": root + "public/images/seminars/video-editing.svg",
    "media": root + "public/images/seminars/media.svg",
    "chemistry": root + "public/images/seminars/chemistry.svg",
    "international-area": root + "public/images/seminars/international-area.svg",
    "education": root + "public/images/seminars/education.svg",
    "literature": root + "public/images/seminars/literature.svg",
    "sociology": root + "public/images/seminars/sociology.svg",
    "tourism": root + "public/images/seminars/tourism.svg",
    "language": root + "public/images/seminars/language.svg",
    "agriculture": root + "public/images/seminars/agriculture.svg"
  };

  function seminarItems() {
    return [
      { label: "遊びの探究", iconImg: ICON["asobi-tankyu"], url: root + "seminars/asobi-tankyu.html" },
      { label: "データAI", iconImg: ICON["data-science-ai"], url: root + "seminars/data-science-ai.html" },
      { label: "デジタル", iconImg: ICON["digital-content"], url: root + "seminars/digital-content.html" },
      { label: "イベント", iconImg: ICON["event-planning"], url: root + "seminars/event-planning.html" },
      { label: "文芸創作", iconImg: ICON["creative-writing"], url: root + "seminars/creative-writing.html" },
      { label: "映像編集", iconImg: ICON["video-editing"], url: root + "seminars/video-editing.html" },
      { label: "メディア", iconImg: ICON["media"], url: root + "seminars/media.html" },
      { label: "化学", iconImg: ICON["chemistry"], url: root + "seminars/chemistry.html" },
      { label: "国際地域", iconImg: ICON["international-area"], url: root + "seminars/international-area.html" },
      { label: "教育", iconImg: ICON["education"], url: root + "seminars/education.html" },
      { label: "文学", iconImg: ICON["literature"], url: root + "seminars/literature.html" },
      { label: "社会", iconImg: ICON["sociology"], url: root + "seminars/sociology.html" },
      { label: "観光", iconImg: ICON["tourism"], url: root + "seminars/tourism.html" },
      { label: "語学", iconImg: ICON["language"], url: root + "seminars/language.html" },
      { label: "農業", iconImg: ICON["agriculture"], url: root + "seminars/agriculture.html" }
    ];
  }

  var DATA = [
    { label: "ホーム", icon: "🏛", url: root + "index.html" },
    { label: "ゼミ一覧", icon: "🌳", items: seminarItems() }
  ];

  var LONG_MS = 420;
  var TRIPLE_GAP_MS = 420;
  var MOVE_PX = 10;
  var COOLDOWN_MS = 480;
  var CAPS = [6, 10, 14];
  var RADII = [118, 188, 258];

  var menuEl, itemsC, orbitsC, coreBtn, canvas, ctx, backdrop;
  var pressTimer = null;
  var startX = 0, startY = 0;
  var isOpen = false;
  var stack = [];
  var tapCount = 0;
  var tapResetTimer = null;
  var suppressUntil = 0;
  var activePointerId = null;

  function now() { return Date.now(); }
  function canOpen() { return now() >= suppressUntil && !isOpen; }

  function go(url) {
    closeMenu(true);
    setTimeout(function () { location.href = url; }, 140);
  }

  function burst() {
    if (!canvas || !ctx) return;
    canvas.width = canvas.height = 600;
    var cx = 300, cy = 300, r1 = 6, a1 = 1, r2 = 3, a2 = 0.75;
    var cols = ["hsl(145,28%,38%)", "hsl(40,32%,48%)", "hsl(155,22%,42%)"];
    var ps = [];
    for (var i = 0; i < 20; i++) {
      var a = (i / 20) * Math.PI * 2;
      var s = Math.random() * 4.5 + 2;
      ps.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: Math.random() * 2.2 + 1, color: cols[i % 3], alpha: 1 });
    }
    (function draw() {
      ctx.clearRect(0, 0, 600, 600);
      if (a1 > 0) {
        ctx.beginPath(); ctx.arc(cx, cy, r1, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(53,107,74," + a1 + ")"; ctx.lineWidth = 2.2; ctx.stroke();
        r1 += 6.5; a1 -= 0.05;
      }
      if (a2 > 0) {
        ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(168,146,90," + a2 + ")"; ctx.lineWidth = 1.8; ctx.stroke();
        r2 += 5; a2 -= 0.04;
      }
      var alive = false;
      for (var j = 0; j < ps.length; j++) {
        var p = ps[j];
        if (p.alpha <= 0) continue;
        alive = true;
        p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.alpha -= 0.038;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.alpha); ctx.fill(); ctx.globalAlpha = 1;
      }
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

  function itemContent(item) {
    if (item.iconImg) {
      return '<img class="rm-icon-img" src="' + item.iconImg + '" alt="" draggable="false">';
    }
    return item.icon || "•";
  }

  function render(items) {
    var old = itemsC.querySelectorAll(".rm-item");
    for (var i = 0; i < old.length; i++) {
      (function (el) {
        el.classList.remove("rendered");
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 160);
      })(old[i]);
    }
    orbitsC.innerHTML = "";
    var L = layout(items);
    var shells = {};
    L.forEach(function (d, index) {
      shells[d.shell] = 1;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rm-item" + (d.item.items ? " has-sub" : "") + (d.item.iconImg ? " has-img" : "");
      btn.setAttribute("data-label", d.item.label);
      btn.setAttribute("aria-label", d.item.label);
      btn.innerHTML = itemContent(d.item);
      btn.style.setProperty("--x", d.x + "px");
      btn.style.setProperty("--y", d.y + "px");
      btn.style.transitionDelay = index * 0.018 + "s";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (d.item.items && d.item.items.length) {
          stack.push(items);
          render(d.item.items);
          burst();
        } else if (d.item.url) {
          go(d.item.url);
        }
      });
      itemsC.appendChild(btn);
      requestAnimationFrame(function () {
        setTimeout(function () { btn.classList.add("rendered"); }, 8);
      });
    });
    Object.keys(shells).forEach(function (s) {
      s = +s;
      var o = document.createElement("div");
      o.className = "rm-shell-orbit";
      var d = RADII[s] * 2;
      o.style.width = o.style.height = d + "px";
      o.style.marginTop = o.style.marginLeft = -RADII[s] + "px";
      orbitsC.appendChild(o);
    });
    if (stack.length) coreBtn.classList.add("visible");
    else coreBtn.classList.remove("visible");
  }

  function createDOM() {
    menuEl = document.createElement("div");
    menuEl.className = "radial-menu-wrapper";
    menuEl.setAttribute("role", "dialog");
    menuEl.setAttribute("aria-label", "メニュー");

    backdrop = document.createElement("div");
    backdrop.className = "rm-backdrop";
    backdrop.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeMenu(true);
    });
    menuEl.appendChild(backdrop);

    canvas = document.createElement("canvas");
    canvas.className = "rm-canvas-layer";
    ctx = canvas.getContext("2d");
    menuEl.appendChild(canvas);

    orbitsC = document.createElement("div");
    menuEl.appendChild(orbitsC);

    itemsC = document.createElement("div");
    menuEl.appendChild(itemsC);

    coreBtn = document.createElement("button");
    coreBtn.type = "button";
    coreBtn.className = "rm-core-btn";
    coreBtn.innerHTML = "←";
    coreBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (stack.length) {
        render(stack.pop());
        burst();
      } else {
        closeMenu(true);
      }
    });
    menuEl.appendChild(coreBtn);

    document.body.appendChild(menuEl);
  }

  function openMenu(x, y) {
    if (!canOpen()) return;
    clearPressTimer();
    var m = 190;
    menuEl.style.left = Math.max(m, Math.min(x, window.innerWidth - m)) + "px";
    menuEl.style.top = Math.max(m, Math.min(y, window.innerHeight - m)) + "px";
    menuEl.classList.add("active");
    isOpen = true;
    stack = [];
    render(DATA);
    burst();
  }

  function closeMenu(withCooldown) {
    if (!menuEl) return;
    menuEl.classList.remove("active");
    var old = itemsC.querySelectorAll(".rm-item");
    for (var i = 0; i < old.length; i++) old[i].classList.remove("rendered");
    coreBtn.classList.remove("visible");
    isOpen = false;
    stack = [];
    clearPressTimer();
    tapCount = 0;
    if (withCooldown) suppressUntil = now() + COOLDOWN_MS;
  }

  function clearPressTimer() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (isOpen) {
      if (menuEl.contains(e.target)) {
        clearPressTimer();
        return;
      }
      closeMenu(true);
      return;
    }

    if (!canOpen()) return;

    activePointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;

    tapCount += 1;
    clearTimeout(tapResetTimer);
    if (tapCount >= 3) {
      clearPressTimer();
      tapCount = 0;
      openMenu(startX, startY);
      return;
    }
    tapResetTimer = setTimeout(function () { tapCount = 0; }, TRIPLE_GAP_MS);

    clearPressTimer();
    pressTimer = setTimeout(function () {
      pressTimer = null;
      tapCount = 0;
      openMenu(startX, startY);
    }, LONG_MS);
  }

  function onPointerMove(e) {
    if (!pressTimer || isOpen) return;
    if (activePointerId != null && e.pointerId !== activePointerId) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_PX) {
      clearPressTimer();
    }
  }

  function onPointerUp(e) {
    if (activePointerId != null && e.pointerId !== activePointerId) return;
    if (pressTimer && !isOpen) {
      clearPressTimer();
    }
    activePointerId = null;
  }

  function init() {
    document.addEventListener("keydown", function (e) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (stack.length) {
          render(stack.pop());
          burst();
        } else {
          closeMenu(true);
        }
      }
    });

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerUp, true);
    document.addEventListener("contextmenu", function (e) {
      if (isOpen) e.preventDefault();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      createDOM();
      init();
    });
  } else {
    createDOM();
    init();
  }
})();
