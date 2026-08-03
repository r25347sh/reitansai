/**
 * js/setThemeColor.js
 * 麗探祭 テーマ・フォント自動適用（localStorage）
 */
(function () {
  "use strict";

  const STORAGE_THEME = "reitansai_selectedTheme";
  const STORAGE_FONT = "reitansai_selectedFont";
  const STORAGE_EXTRA = "reitansai_designExtras";

  const fallbackTheme = {
    name: "麗澤ゴールド (Reitaku Gold)",
    maincolor: "#E8B923",
    balancecolor: "#22A06B",
    variationcolor: "#FFFFFF",
    accentcolor: "#0A2F1F"
  };

  const savedThemeName = localStorage.getItem(STORAGE_THEME) || fallbackTheme.name;
  const savedFontName = localStorage.getItem(STORAGE_FONT) || "Noto Sans JP - モダン標準";

  function applyTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty("--main-color", theme.maincolor);
    root.style.setProperty("--balance-color", theme.balancecolor);
    root.style.setProperty("--variation-color", theme.variationcolor);
    root.style.setProperty("--accent-color", theme.accentcolor);
    root.style.setProperty("--page-bg", theme.accentcolor);
    root.style.setProperty("--gold", theme.maincolor);
    root.style.setProperty("--card-t-color", theme.maincolor);
    root.style.setProperty("--card-f-color", theme.variationcolor);
    root.style.setProperty("--card-bg-color", theme.balancecolor);
  }

  function applyFont(fonts) {
    const saved = fonts.find(function (f) { return f.name === savedFontName; });
    const family = saved ? saved.fontFamily : "'Noto Sans JP', sans-serif";
    document.documentElement.style.setProperty("--font-family", family);
    if (document.body) document.body.style.fontFamily = family;
  }

  function applyExtras() {
    try {
      var raw = localStorage.getItem(STORAGE_EXTRA);
      if (!raw) return;
      var extra = JSON.parse(raw);
      var root = document.documentElement;
      if (extra.cardRadius != null) root.style.setProperty("--radius", extra.cardRadius + "px");
      if (extra.reducedMotion) root.style.setProperty("--rm-elastic-ease", "ease");
      if (extra.compactMode) root.classList.add("compact-mode");
      if (extra.highContrast) root.classList.add("high-contrast");
    } catch (e) {}
  }

  applyTheme(fallbackTheme);
  applyExtras();

  var base = "/reitansai";
  fetch(base + "/json/themecolor.json?v=" + Date.now())
    .then(function (r) {
      if (!r.ok) throw new Error("themecolor.json load failed");
      return r.json();
    })
    .then(function (data) {
      var themes = data.themes || [];
      var target = themes.find(function (t) { return t.name === savedThemeName; }) || themes[0] || fallbackTheme;
      applyTheme(target);
      applyFont(data.fonts || []);
      applyExtras();
    })
    .catch(function (err) {
      console.warn("[reitansai] theme fallback:", err);
      applyTheme(fallbackTheme);
      document.documentElement.style.setProperty("--font-family", "'Noto Sans JP', sans-serif");
    });
})();
