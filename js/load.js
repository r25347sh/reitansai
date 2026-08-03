/**
 * js/load.js
 * 麗探祭 共通ローダー（CSS / JS 順序保証・重複防止）
 */
(function () {
  "use strict";

  const base = "/reitansai";
  const cacheBuster = "v=" + Date.now();

  function alreadyHas(selector) {
    return !!document.querySelector(selector);
  }

  function injectCss(href) {
    const bare = href.split("?")[0];
    if (alreadyHas('link[href*="' + bare + '"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function injectScript(src, onload) {
    const bare = src.split("?")[0];
    if (alreadyHas('script[src*="' + bare + '"]')) {
      if (onload) onload();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = onload || null;
    script.onerror = function () {
      console.error("❌ load failed:", src);
      if (onload) onload();
    };
    document.head.appendChild(script);
  }

  const commonCss = [
    base + "/css/base.css",
    base + "/css/style.css",
    base + "/MENU/MENU.css"
  ];
  commonCss.forEach(function (p) {
    injectCss(p + "?" + cacheBuster);
  });

  const path = window.location.pathname;
  let pageCss = "";

  if (path.endsWith("/") || path.endsWith("index.html") || path === base || path === base + "/") {
    pageCss = base + "/css/index.css";
  } else if (path.includes("settings")) {
    pageCss = base + "/css/settings.css";
  } else if (path.includes("takimura")) {
    pageCss = base + "/css/takimura_t.css";
  } else if (path.includes("event.html")) {
    pageCss = base + "/css/event.css";
  } else if (path.includes("aboutsite")) {
    pageCss = base + "/css/aboutsite.css";
  } else if (path.includes("/zemi/")) {
    const name = path.split("/").pop().replace(".html", "");
    pageCss = base + "/css/zemi/" + name + ".css";
  }

  if (pageCss) injectCss(pageCss + "?" + cacheBuster);

  const jsQueue = [
    base + "/js/setThemeColor.js",
    base + "/js/auva.js",
    base + "/MENU/MENU.js"
  ];

  function loadNext(i) {
    if (i >= jsQueue.length) {
      console.log(
        "%c✨ 麗探祭システムロード完了: " + path,
        "color:#E8B923;font-weight:bold;"
      );
      return;
    }
    injectScript(jsQueue[i] + "?" + cacheBuster, function () {
      loadNext(i + 1);
    });
  }

  loadNext(0);
})();
