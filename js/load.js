// js/load-css.js - 非同期・順序保証・重複防止 完全対応版
(function() {
  'use strict';

  const base = '/reitansai';
  // キャッシュ対策（毎ミリ秒変わると重複チェックが壊れるため、リロード時固定）
  const cacheBuster = 'v=' + Date.now();

  // 1. 全ページ共通CSSの動的読み込み
  const baseCssFiles = [
    `${base}/gesture/pen.css`,
    `${base}/MENU/MENU.css`
  ];

  baseCssFiles.forEach(cssPath => {
    // クエリを除いた純粋なパスで重複チェック
    const isAlreadyLoaded = document.querySelector(`link[href*="${cssPath}"]`);
    if (!isAlreadyLoaded) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${cssPath}?${cacheBuster}`;
      document.head.appendChild(link);
    }
  });

  // 2. JavaScriptの依存関係順序ロード（順番を絶対保証）
  const jsFiles = [
    `${base}/gesture/gesture.js`, // ① 基盤
    `${base}/gesture/pen.js`,     // ② 描画エンジン
    `${base}/gesture/action.js`,  // ③ アクション（①と②に依存）
    `${base}/MENU/MENU.js`        // ④ メニュー（②に依存）
  ];

  // 1つずつ順番にロードを完了させてから次を読み込む再帰関数
  function loadScriptsSequentially(index) {
    if (index >= jsFiles.length) {
      console.log('%c✅ All scripts sequentially loaded for: ' + window.location.pathname, 'color:#00ff88');
      return;
    }

    const jsPath = jsFiles[index];
    const isAlreadyLoaded = document.querySelector(`script[src*="${jsPath}"]`);

    if (isAlreadyLoaded) {
      // 既に読み込み済みの場合はスキップして次へ
      loadScriptsSequentially(index + 1);
    } else {
      const script = document.createElement('script');
      script.src = `${jsPath}?${cacheBuster}`;

      // 読み込み完了を待ってから次のスクリプトをロード
      script.onload = () => loadScriptsSequentially(index + 1);
      script.onerror = () => {
        console.error(`❌ Failed to load script: ${jsPath}`);
        loadScriptsSequentially(index + 1); // エラーが起きても止まらず次へ
      };

      document.head.appendChild(script);
    }
  }

  // 順序保障ロード開始
  loadScriptsSequentially(0);

})();
