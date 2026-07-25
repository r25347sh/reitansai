// js/load-css.js - 非同期・順序保証・重複防止 完全対応版
(function () {
  'use strict';

  const base = '/reitansai';
  const cacheBuster = 'v=' + Date.now();

  // 1. 全ページ共通CSSの動的読み込み
  const baseCssFiles = [
    `${base}/gesture/pen.css`,
    `${base}/MENU/MENU.css`
  ];

  baseCssFiles.forEach(cssPath => {
    const isAlreadyLoaded = document.querySelector(`link[href*="${cssPath}"]`);
    if (!isAlreadyLoaded) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${cssPath}?${cacheBuster}`;
      document.head.appendChild(link);
    }
  });

  // 2. JavaScriptの依存関係順序ロード
  const jsFiles = [
    `${base}/gesture/gesture.js`, // ① 認識エンジン
    `${base}/gesture/pen.js`,     // ② 描画エンジン
    `${base}/gesture/action.js`,  // ③ アクション実行部
    `${base}/MENU/MENU.js`        // ④ ラジアルメニュー
  ];

  function loadScriptsSequentially(index) {
    if (index >= jsFiles.length) {
      console.log('%c✨ 麗探祭システム全モジュール正常ロード完了: ' + window.location.pathname, 'color:#E8B923; font-weight:bold;');
      return;
    }

    const jsPath = jsFiles[index];
    const isAlreadyLoaded = document.querySelector(`script[src*="${jsPath}"]`);

    if (isAlreadyLoaded) {
      loadScriptsSequentially(index + 1);
    } else {
      const script = document.createElement('script');
      script.src = `${jsPath}?${cacheBuster}`;
      script.onload = () => loadScriptsSequentially(index + 1);
      script.onerror = () => {
        console.error(`❌ ファイルの読み込みに失敗しました: ${jsPath}`);
        loadScriptsSequentially(index + 1);
      };
      document.head.appendChild(script);
    }
  }

  loadScriptsSequentially(0);
})();
