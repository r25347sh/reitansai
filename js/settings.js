/**
 * js/settings.js - 麗探祭 テーマ設定 UI
 */
(function () {
  "use strict";
  var STORAGE_THEME = "reitansai_selectedTheme";
  var STORAGE_FONT = "reitansai_selectedFont";
  var STORAGE_EXTRA = "reitansai_designExtras";
  var BASE = "/reitansai";

  document.addEventListener("DOMContentLoaded", async function () {
    var themeSelect = document.getElementById("theme-select");
    var fontSelect = document.getElementById("font-select");
    var saveBtn = document.getElementById("save-btn");
    var resetBtn = document.getElementById("reset-btn");
    var saveMessage = document.getElementById("save-message");
    var previewMain = document.getElementById("preview-main");
    var previewBalance = document.getElementById("preview-balance");
    var fontPreviewText = document.getElementById("font-preview-text");
    var optCompact = document.getElementById("opt-compact");
    var optContrast = document.getElementById("opt-contrast");
    var optMotion = document.getElementById("opt-motion");
    var optRadius = document.getElementById("opt-radius");
    var allThemes = [];
    var allFonts = [];

    try {
      var res = await fetch(BASE + "/json/themecolor.json?v=" + Date.now());
      if (!res.ok) throw new Error("JSON load failed");
      var data = await res.json();
      allThemes = data.themes || [];
      allFonts = data.fonts || [];

      themeSelect.innerHTML = "";
      allThemes.forEach(function (t) {
        var opt = document.createElement("option");
        opt.value = t.name;
        opt.textContent = t.name;
        themeSelect.appendChild(opt);
      });
      fontSelect.innerHTML = "";
      allFonts.forEach(function (f) {
        var opt = document.createElement("option");
        opt.value = f.name;
        opt.textContent = f.name;
        fontSelect.appendChild(opt);
      });

      var savedTheme = localStorage.getItem(STORAGE_THEME) || allThemes[0].name;
      var savedFont = localStorage.getItem(STORAGE_FONT) || (allFonts[0] && allFonts[0].name);
      themeSelect.value = savedTheme;
      fontSelect.value = savedFont;

      try {
        var extra = JSON.parse(localStorage.getItem(STORAGE_EXTRA) || "{}");
        optCompact.checked = !!extra.compactMode;
        optContrast.checked = !!extra.highContrast;
        optMotion.checked = !!extra.reducedMotion;
        if (extra.cardRadius != null) optRadius.value = extra.cardRadius;
      } catch (e) {}

      updateThemePreview(savedTheme);
      updateFontPreview(savedFont);
      themeSelect.addEventListener("change", function (e) {
        updateThemePreview(e.target.value);
        liveApplyTheme(e.target.value);
      });
      fontSelect.addEventListener("change", function (e) {
        updateFontPreview(e.target.value);
        liveApplyFont(e.target.value);
      });
      optRadius.addEventListener("input", function () {
        document.documentElement.style.setProperty("--radius", optRadius.value + "px");
      });
    } catch (err) {
      console.error(err);
      themeSelect.innerHTML = "<option>テーマを読み込めません</option>";
    }

    function updateThemePreview(name) {
      var t = allThemes.find(function (x) { return x.name === name; });
      if (!t) return;
      previewMain.style.backgroundColor = t.maincolor;
      previewBalance.style.backgroundColor = t.balancecolor;
    }
    function updateFontPreview(name) {
      var f = allFonts.find(function (x) { return x.name === name; });
      if (f) fontPreviewText.style.fontFamily = f.fontFamily;
    }
    function liveApplyTheme(name) {
      var t = allThemes.find(function (x) { return x.name === name; });
      if (!t) return;
      var root = document.documentElement;
      root.style.setProperty("--main-color", t.maincolor);
      root.style.setProperty("--balance-color", t.balancecolor);
      root.style.setProperty("--variation-color", t.variationcolor);
      root.style.setProperty("--accent-color", t.accentcolor);
      root.style.setProperty("--page-bg", t.accentcolor);
      root.style.setProperty("--gold", t.maincolor);
    }
    function liveApplyFont(name) {
      var f = allFonts.find(function (x) { return x.name === name; });
      if (!f) return;
      document.documentElement.style.setProperty("--font-family", f.fontFamily);
      document.body.style.fontFamily = f.fontFamily;
    }

    saveBtn.addEventListener("click", function () {
      localStorage.setItem(STORAGE_THEME, themeSelect.value);
      localStorage.setItem(STORAGE_FONT, fontSelect.value);
      localStorage.setItem(STORAGE_EXTRA, JSON.stringify({
        compactMode: optCompact.checked,
        highContrast: optContrast.checked,
        reducedMotion: optMotion.checked,
        cardRadius: Number(optRadius.value)
      }));
      saveMessage.textContent = "✨ 設定を保存しました！";
      saveMessage.style.opacity = "1";
      setTimeout(function () {
        saveMessage.style.opacity = "0";
        location.reload();
      }, 1600);
    });
    resetBtn.addEventListener("click", function () {
      if (!confirm("設定をデフォルトにリセットしますか？")) return;
      localStorage.removeItem(STORAGE_THEME);
      localStorage.removeItem(STORAGE_FONT);
      localStorage.removeItem(STORAGE_EXTRA);
      location.reload();
    });
  });
})();
