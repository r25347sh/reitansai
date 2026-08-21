/**
 * Page-specific hidden easter eggs (no hints on screen)
 */
(function () {
  function pathKey() {
    var p = location.pathname || "";
    if (/\/seminars\/([^/]+)\.html/.test(p)) return RegExp.$1.replace(/\.html$/, "");
    if (/index\.html?$/.test(p) || p.endsWith("/") || p === "") return "home";
    return "home";
  }

  function toast(msg, emoji) {
    if (document.getElementById("ee-toast")) return;
    var t = document.createElement("div");
    t.id = "ee-toast";
    t.setAttribute("role", "status");
    t.textContent = (emoji ? emoji + "  " : "") + msg;
    t.style.cssText =
      "position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(16px);" +
      "background:rgba(26,48,36,0.94);color:#f3efe6;padding:12px 20px;border-radius:12px;" +
      "font-size:0.88rem;letter-spacing:0.03em;z-index:10000000;opacity:0;" +
      "box-shadow:0 12px 32px rgba(0,0,0,0.25);border:1px solid rgba(168,146,90,0.35);" +
      "transition:opacity .35s ease,transform .35s ease;pointer-events:none;font-family:inherit;max-width:90vw;text-align:center";
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      t.style.opacity = "1";
      t.style.transform = "translateX(-50%) translateY(0)";
    });
    setTimeout(function () {
      t.style.opacity = "0";
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
    }, 3400);
  }

  function rain(chars, n) {
    for (var i = 0; i < (n || 12); i++) {
      (function () {
        var el = document.createElement("span");
        el.textContent = chars[Math.floor(Math.random() * chars.length)];
        el.style.cssText =
          "position:fixed;z-index:9999998;pointer-events:none;font-size:" +
          (12 + Math.random() * 16) +
          "px;left:" +
          Math.random() * 100 +
          "vw;top:-24px;opacity:1;transition:transform 2.6s linear,opacity 2.6s ease";
        document.body.appendChild(el);
        requestAnimationFrame(function () {
          el.style.transform =
            "translateY(" + (window.innerHeight + 40) + "px) rotate(" + Math.random() * 360 + "deg)";
          el.style.opacity = "0";
        });
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2800);
      })();
    }
  }

  var key = pathKey();
  var typeBuf = "";
  var clicks = 0;
  var clickTimer = null;

  if (key === "home") {
    var konami = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    var ki = 0;
    document.addEventListener("keydown", function (e) {
      if (e.key === konami[ki]) {
        ki++;
        if (ki === konami.length) {
          ki = 0;
          toast("森の奥で、何かが輝いた…", "🏛");
          rain(["🍃","🌿","✨"], 16);
        }
      } else ki = e.key === konami[0] ? 1 : 0;
    });
    document.addEventListener("DOMContentLoaded", function () {
      var m = document.querySelector(".site-brand-mark");
      if (!m) return;
      m.addEventListener("click", function () {
        clicks++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(function () { clicks = 0; }, 800);
        if (clicks >= 7) {
          clicks = 0;
          toast("七度の気配に、森が応えた。", "🌳");
          rain(["🍃","🍂"], 14);
        }
      });
    });
    return;
  }

  var eggs = {
    "asobi-tankyu": { type: "asobi", msg: "遊びの中に、本気がある。", emoji: "🎮", rain: ["🎲","🎯","✨","🧩"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "data-science-ai": { type: "data", msg: "相関は因果ではない。でも面白い。", emoji: "🤖", rain: ["0","1","Σ","∞"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "digital-content": { type: "digital", msg: "ピクセルの向こうに物語がある。", emoji: "💻", rain: ["◆","◇","■","□"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "event-planning": { type: "event", msg: "最高のイベントは、余白から生まれる。", emoji: "🎉", rain: ["🎊","🎈","✨","⭐"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "creative-writing": { type: "write", msg: "一行目は、いつも深夜に書かれる。", emoji: "✍️", rain: ["✎","※","…","〰"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "video-editing": { type: "video", msg: "カットの間に、呼吸がある。", emoji: "🎬", rain: ["▶","■","●","◆"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "media": { type: "media", msg: "沈黙もまた、メッセージだ。", emoji: "📡", rain: ["〰","≈","◉","◎"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "chemistry": { type: "chem", msg: "反応は、予期せぬところで起きる。", emoji: "🧪", rain: ["⚗","✦","∘","∙"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "international-area": { type: "world", msg: "境界線の向こうも、同じ空だ。", emoji: "🌍", rain: ["✈","🌐","★","·"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "education": { type: "edu", msg: "教えることは、二度学ぶこと。", emoji: "📖", rain: ["📚","✦","·","°"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "literature": { type: "lit", msg: "読まれない行にこそ、真実がある。", emoji: "📕", rain: ["※","†","¶","…"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "sociology": { type: "soc", msg: "個人は、関係の束である。", emoji: "🏛", rain: ["●","○","◉","·"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "tourism": { type: "tour", msg: "旅は、日常を異邦にする技術だ。", emoji: "🗾", rain: ["✈","✦","·","◎"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "language": { type: "lang", msg: "言葉は、世界の形を変える。", emoji: "🗣", rain: ["あ","A","字","α"], clickSel: "#seminar-icon", clicksNeed: 5 },
    "agriculture": { type: "agri", msg: "種は、未来への最も静かな投資だ。", emoji: "🌾", rain: ["🌱","🍃","✦","·"], clickSel: "#seminar-icon", clicksNeed: 5 }
  };

  var egg = eggs[key];
  if (!egg) return;

  document.addEventListener("keydown", function (e) {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    typeBuf = (typeBuf + e.key.toLowerCase()).slice(-egg.type.length);
    if (typeBuf === egg.type) {
      typeBuf = "";
      toast(egg.msg, egg.emoji);
      rain(egg.rain, 14);
    }
  });

  function bindClick() {
    var el = document.querySelector(egg.clickSel);
    if (!el) return;
    el.addEventListener("click", function () {
      clicks++;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(function () { clicks = 0; }, 900);
      if (clicks >= egg.clicksNeed) {
        clicks = 0;
        toast(egg.msg, egg.emoji);
        rain(egg.rain, 14);
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bindClick();
      setTimeout(bindClick, 1500);
    });
  } else {
    bindClick();
    setTimeout(bindClick, 1500);
  }
})();
