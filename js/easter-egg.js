/**
 * Hidden easter eggs — no on-screen hints
 * - Konami code
 * - Logo / brand mark 7 clicks
 * - Type "reitaku" anywhere
 */
(function () {
  var KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  var kIdx = 0;
  var typeBuf = "";
  var brandClicks = 0;
  var brandTimer = null;

  function celebrate(msg) {
    if (document.getElementById("ee-toast")) return;
    var t = document.createElement("div");
    t.id = "ee-toast";
    t.setAttribute("role", "status");
    t.textContent = msg;
    t.style.cssText = [
      "position:fixed","left:50%","bottom:28px","transform:translateX(-50%) translateY(20px)",
      "background:rgba(26,48,36,0.92)","color:#f3efe6","padding:12px 20px","border-radius:12px",
      "font-size:0.88rem","letter-spacing:0.04em","z-index:10000000","opacity:0",
      "box-shadow:0 12px 32px rgba(0,0,0,0.25)","border:1px solid rgba(168,146,90,0.35)",
      "transition:opacity 0.35s ease, transform 0.35s ease","pointer-events:none","font-family:inherit"
    ].join(";");
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      t.style.opacity = "1";
      t.style.transform = "translateX(-50%) translateY(0)";
    });
    for (var i = 0; i < 14; i++) spawnLeaf();
    setTimeout(function () {
      t.style.opacity = "0";
      t.style.transform = "translateX(-50%) translateY(12px)";
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
    }, 3200);
  }

  function spawnLeaf() {
    var el = document.createElement("span");
    el.textContent = ["🍃","🌿","✨","🍂"][Math.floor(Math.random() * 4)];
    el.style.cssText = [
      "position:fixed","z-index:9999999","pointer-events:none","font-size:" + (14 + Math.random() * 14) + "px",
      "left:" + (Math.random() * 100) + "vw","top:-20px",
      "transition:transform 2.8s linear, opacity 2.8s ease","opacity:1"
    ].join(";");
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      el.style.transform = "translateY(" + (window.innerHeight + 40) + "px) rotate(" + (Math.random() * 360) + "deg)";
      el.style.opacity = "0";
    });
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3000);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === KONAMI[kIdx]) {
      kIdx++;
      if (kIdx === KONAMI.length) {
        kIdx = 0;
        celebrate("森の奥で、何かが輝いた…");
      }
    } else {
      kIdx = e.key === KONAMI[0] ? 1 : 0;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      typeBuf = (typeBuf + e.key.toLowerCase()).slice(-7);
      if (typeBuf === "reitaku") {
        typeBuf = "";
        celebrate("麗澤の探究、ここにあり。");
      }
    }
  });

  function bindBrand() {
    var marks = document.querySelectorAll(".site-brand-mark, .site-title a, #seminar-icon");
    for (var i = 0; i < marks.length; i++) {
      marks[i].addEventListener("click", function () {
        brandClicks++;
        clearTimeout(brandTimer);
        brandTimer = setTimeout(function () { brandClicks = 0; }, 900);
        if (brandClicks >= 7) {
          brandClicks = 0;
          celebrate("七度の気配に、森が応えた。");
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindBrand);
  } else {
    bindBrand();
  }
  setTimeout(bindBrand, 1200);
})();
