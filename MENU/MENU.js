/**
 * Radial Menu — Sacred Forest University (high-spec)
 */
(function () {
  var inSeminars = /\/seminars\//.test(location.pathname);
  var root = inSeminars ? "../" : "";
  var DATA = [
    { label: "ホーム", icon: "🏛", url: root + "index.html", keywords: "home ホーム" },
    { label: "ゼミ一覧", icon: "🌳", keywords: "ゼミ seminar", items: [
      { label: "遊びの探究", icon: "🎮", url: root + "seminars/asobi-tankyu.html", keywords: "遊び" },
      { label: "データAI", icon: "🤖", url: root + "seminars/data-science-ai.html", keywords: "データ AI" },
      { label: "デジタル", icon: "💻", url: root + "seminars/digital-content.html", keywords: "デジタル" },
      { label: "イベント", icon: "🎉", url: root + "seminars/event-planning.html", keywords: "イベント" },
      { label: "文芸創作", icon: "✍️", url: root + "seminars/creative-writing.html", keywords: "文芸" },
      { label: "映像編集", icon: "🎬", url: root + "seminars/video-editing.html", keywords: "映像" },
      { label: "メディア", icon: "📡", url: root + "seminars/media.html", keywords: "メディア" },
      { label: "化学", icon: "🧪", url: root + "seminars/chemistry.html", keywords: "化学" },
      { label: "国際地域", icon: "🌍", url: root + "seminars/international-area.html", keywords: "国際" },
      { label: "教育", icon: "📖", url: root + "seminars/education.html", keywords: "教育" },
      { label: "文学", icon: "📕", url: root + "seminars/literature.html", keywords: "文学" },
      { label: "社会", icon: "🏛", url: root + "seminars/sociology.html", keywords: "社会" },
      { label: "観光", icon: "🗾", url: root + "seminars/tourism.html", keywords: "観光" },
      { label: "語学", icon: "🗣", url: root + "seminars/language.html", keywords: "語学" },
      { label: "農業", icon: "🌾", url: root + "seminars/agriculture.html", keywords: "農業" }
    ]},
    { label: "操作", icon: "⚙️", keywords: "操作 help", items: [
      { label: "このメニュー", icon: "ℹ️", action: function () {
        alert("【麗探祭メニュー】\n・長押し / トリプルタップで開く\n・検索で絞り込み\n・Esc 閉じる / 矢印で選択 / Enter 決定");
      }, keywords: "ヘルプ" },
      { label: "トップへ", icon: "↑", action: function () { window.scrollTo({ top: 0, behavior: "smooth" }); }, keywords: "スクロール" }
    ]}
  ];
  var LONG = 360, TRIPLE = 300, MOVE = 8;
  var CAPS = [6, 10, 14], RADII = [120, 190, 260];
  var menuEl, itemsC, orbitsC, coreBtn, canvas, ctx, searchInput, backdrop;
  var timer, startX, startY, isOpen = false, stack = [], focusIdx = -1;
  var taps = 0, tapTimer;

  function go(url) { close(); setTimeout(function () { location.href = url; }, 160); }

  function burst() {
    if (!canvas || !ctx) return;
    canvas.width = canvas.height = 640;
    var cx = 320, cy = 320, r1 = 8, a1 = 1, r2 = 4, a2 = 0.85;
    var cols = ["hsl(142,45%,42%)", "hsl(130,40%,55%)", "hsl(45,55%,58%)", "hsl(155,35%,48%)"];
    var ps = Array.from({ length: 36 }, function (_, i) {
      var a = (i / 36) * Math.PI * 2 + Math.random() * 0.2, s = Math.random() * 6.5 + 3;
      return { x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: Math.random() * 3 + 1.2, color: cols[i % 4], alpha: 1 };
    });
    (function draw() {
      ctx.clearRect(0, 0, 640, 640);
      if (a1 > 0) { ctx.beginPath(); ctx.arc(cx, cy, r1, 0, Math.PI * 2); ctx.strokeStyle = "rgba(61,122,85," + a1 + ")"; ctx.lineWidth = 3; ctx.stroke(); r1 += 7.5; a1 -= 0.045; }
      if (a2 > 0) { ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI * 2); ctx.strokeStyle = "rgba(196,163,90," + a2 + ")"; ctx.lineWidth = 2.2; ctx.stroke(); r2 += 6; a2 -= 0.036; }
      var alive = false;
      ps.forEach(function (p) {
        if (p.alpha > 0) { alive = true; p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.alpha -= 0.03;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.alpha); ctx.fill(); ctx.globalAlpha = 1; }
      });
      if (a1 > 0 || a2 > 0 || alive) requestAnimationFrame(draw); else ctx.clearRect(0, 0, 640, 640);
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

  function visibleBtns() {
    return Array.prototype.slice.call(itemsC.querySelectorAll(".rm-item.rendered:not(.rm-hidden-by-search)"));
  }
  function setFocus(i) {
    var b = visibleBtns(); b.forEach(function (x) { x.classList.remove("rm-focused"); });
    if (!b.length) { focusIdx = -1; return; }
    focusIdx = ((i % b.length) + b.length) % b.length;
    b[focusIdx].classList.add("rm-focused");
    try { b[focusIdx].focus({ preventScroll: true }); } catch (e) {}
  }
  function filter(q) {
    q = (q || "").trim().toLowerCase();
    itemsC.querySelectorAll(".rm-item").forEach(function (btn) {
      if (!q || (btn.getAttribute("data-search") || "").toLowerCase().indexOf(q) !== -1)
        btn.classList.remove("rm-hidden-by-search");
      else btn.classList.add("rm-hidden-by-search");
    });
    focusIdx = -1; setFocus(0);
  }

  function render(items) {
    focusIdx = -1;
    itemsC.querySelectorAll(".rm-item").forEach(function (el) {
      el.classList.remove("rendered"); setTimeout(function () { el.remove(); }, 200);
    });
    orbitsC.innerHTML = "";
    var L = layout(items), shells = {};
    L.forEach(function (d, index) {
      shells[d.shell] = 1;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rm-item" + (d.item.items ? " has-sub" : "");
      btn.setAttribute("data-label", d.item.label);
      btn.setAttribute("data-search", [d.item.label, d.item.keywords || ""].join(" "));
      btn.setAttribute("aria-label", d.item.label);
      btn.innerHTML = d.item.icon;
      btn.style.setProperty("--x", d.x + "px");
      btn.style.setProperty("--y", d.y + "px");
      btn.style.transitionDelay = index * 0.022 + "s";
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (d.item.items && d.item.items.length) {
          stack.push(items); if (searchInput) searchInput.value = "";
          render(d.item.items); burst();
        } else if (d.item.url) go(d.item.url);
        else if (typeof d.item.action === "function") { d.item.action(); close(); }
      });
      itemsC.appendChild(btn);
      requestAnimationFrame(function () { setTimeout(function () { btn.classList.add("rendered"); }, 12); });
    });
    Object.keys(shells).forEach(function (s) {
      s = +s; var o = document.createElement("div"); o.className = "rm-shell-orbit";
      var d = RADII[s] * 2; o.style.width = o.style.height = d + "px";
      o.style.marginTop = o.style.marginLeft = -RADII[s] + "px"; orbitsC.appendChild(o);
    });
    if (stack.length) { coreBtn.classList.add("visible"); coreBtn.setAttribute("aria-label", "戻る"); }
    else coreBtn.classList.remove("visible");
    if (searchInput) { searchInput.value = ""; setTimeout(function () { try { searchInput.focus({ preventScroll: true }); } catch (e) {} }, 80); }
  }

  function createDOM() {
    menuEl = document.createElement("div");
    menuEl.className = "radial-menu-wrapper";
    menuEl.setAttribute("role", "dialog");
    menuEl.setAttribute("aria-label", "ナビゲーションメニュー");
    backdrop = document.createElement("div"); backdrop.className = "rm-backdrop";
    backdrop.addEventListener("click", close); menuEl.appendChild(backdrop);
    canvas = document.createElement("canvas"); canvas.className = "rm-canvas-layer";
    ctx = canvas.getContext("2d"); menuEl.appendChild(canvas);
    orbitsC = document.createElement("div"); menuEl.appendChild(orbitsC);
    itemsC = document.createElement("div"); menuEl.appendChild(itemsC);
    var sw = document.createElement("div"); sw.className = "rm-search-wrap";
    var si = document.createElement("span"); si.className = "rm-search-icon"; si.textContent = "🔍";
    searchInput = document.createElement("input"); searchInput.type = "search";
    searchInput.className = "rm-search-input"; searchInput.placeholder = "ゼミを検索…";
    searchInput.setAttribute("aria-label", "メニュー内検索");
    searchInput.addEventListener("input", function () { filter(searchInput.value); });
    searchInput.addEventListener("click", function (e) { e.stopPropagation(); });
    sw.appendChild(si); sw.appendChild(searchInput); menuEl.appendChild(sw);
    coreBtn = document.createElement("button"); coreBtn.type = "button"; coreBtn.className = "rm-core-btn"; coreBtn.innerHTML = "←";
    coreBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (stack.length) { var p = stack.pop(); if (searchInput) searchInput.value = ""; render(p); burst(); }
      else close();
    });
    menuEl.appendChild(coreBtn);
    var hint = document.createElement("div"); hint.className = "rm-hint";
    hint.textContent = "Esc 閉じる · ←→ 選択 · Enter 決定"; menuEl.appendChild(hint);
    document.body.appendChild(menuEl);
  }

  function open(x, y) {
    var m = 200;
    menuEl.style.left = Math.max(m, Math.min(x, window.innerWidth - m)) + "px";
    menuEl.style.top = Math.max(m, Math.min(y, window.innerHeight - m)) + "px";
    menuEl.classList.add("active"); isOpen = true; stack = []; render(DATA); burst();
  }
  function close() {
    if (!menuEl) return;
    menuEl.classList.remove("active");
    itemsC.querySelectorAll(".rm-item").forEach(function (el) { el.classList.remove("rendered"); });
    coreBtn.classList.remove("visible"); isOpen = false; focusIdx = -1;
    if (searchInput) searchInput.value = "";
  }

  function onKey(e) {
    if (!isOpen) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (stack.length) { var p = stack.pop(); if (searchInput) searchInput.value = ""; render(p); burst(); }
      else close(); return;
    }
    if (e.key === "Backspace" && document.activeElement !== searchInput) {
      e.preventDefault();
      if (stack.length) { var q = stack.pop(); if (searchInput) searchInput.value = ""; render(q); burst(); }
      return;
    }
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); setFocus(focusIdx + 1); return; }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault(); setFocus(focusIdx <= 0 ? visibleBtns().length - 1 : focusIdx - 1); return;
    }
    if (e.key === "Enter" && document.activeElement !== searchInput) {
      e.preventDefault();
      var b = visibleBtns(); if (focusIdx >= 0 && b[focusIdx]) b[focusIdx].click();
    }
  }

  function init() {
    document.addEventListener("keydown", onKey);
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
