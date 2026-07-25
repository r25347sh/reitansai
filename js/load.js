(function() {
  // 読み込みたい外部ファイルのリスト
  const resources = {
    css: [
      '/reitansai/MENU/MENU.css',
      '/reitansai/gesture/pen.css'
    ],
    js: [
      '/reitansai/MENU/MENU.js',
      '/reitansai/gesture/pen.js',
      '/reitansai/gesture/action.js',
      '/reitansai/gesture/gesture.js'
      ]
  };

  // CSSの自動読み込み
  resources.css.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  });

  // JavaScriptの自動読み込み
  resources.js.forEach(url => {
    const script = document.createElement('script');
    script.src = url;
    script.defer = true; // 読み込み順序や実行タイミングの制御
    document.body.appendChild(script);
  });
})();
