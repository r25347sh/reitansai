// js/load-css.js - Ajax・GitHub Pages完全対応決定版
(function() {
  'use strict';

  const base = '/reitansai';
  // キャッシュを強制突破するためのランダムな数字を自動生成
  const cacheBuster = 'v=' + new Date().getTime();

  // 1. 全ページ共通の基本CSS
  const baseCssFiles = [
    `${base}/gesture/pen.css?${cacheBuster}`,
    `${base}/MENU/MENU.css?${cacheBuster}`
  ];

  baseCssFiles.forEach(url => {
    // 既に同じ共通CSSが入っていればスキップ（二重読み込み防止）
    if (document.querySelector(`link[href^="${url.split('?')}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link); // 確実に効かせるため後ろに追加
  });

  // 2. JavaScriptのロード（リスト管理・重複防止）
  const jsFiles = [
    `${base}/gesture/pen.js?${cacheBuster}`,
    `${base}/gesture/gesture.js?${cacheBuster}`,
    `${base}/gesture/action.js?${cacheBuster}`,
    `${base}/MENU/MENU.js?${cacheBuster}` // 【追加】MENU.jsをリストに組み込み
  ];

  jsFiles.forEach(url => {
    const cleanUrl = url.split('?'); // 重複チェック用にクエリを取り除く
    if (!document.querySelector(`script[src^="${cleanUrl}"]`)) {
      const script = document.createElement('script');
      script.src = url;
      script.async = false;
      document.head.appendChild(script);
    }
  });

  console.log('%c✅ Load-css re-executed for path: ' + window.location.pathname, 'color:#00ff88');
})();
