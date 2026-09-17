/*! Reitansai CMS config */
(function (g) {
  var SEMINARS = [
    { key: 'doutoku', label: '道徳', htmlPath: 'pages/seminars/doutoku.html' },
    { key: 'ai', label: 'AI', htmlPath: 'pages/seminars/ai.html' },
    { key: 'kyouiku', label: '教育', htmlPath: 'pages/seminars/kyouiku.html' },
    { key: 'kokusai', label: '国際', htmlPath: 'pages/seminars/kokusai.html' },
    { key: 'bungei', label: '文芸', htmlPath: 'pages/seminars/bungei.html' },
    { key: 'kagaku', label: '化学', htmlPath: 'pages/seminars/kagaku.html' },
    { key: 'bungaku', label: '文学', htmlPath: 'pages/seminars/bungaku.html' },
    { key: 'media', label: 'メディア', htmlPath: 'pages/seminars/media.html' },
    { key: 'syakai', label: '社会', htmlPath: 'pages/seminars/syakai.html' },
    { key: 'nougyou', label: '農業', htmlPath: 'pages/seminars/nougyou.html' },
    { key: 'kankou', label: '観光', htmlPath: 'pages/seminars/kankou.html' },
    { key: 'gogaku', label: '語学', htmlPath: 'pages/seminars/gogaku.html' },
    { key: 'asobi', label: '遊び', htmlPath: 'pages/seminars/asobi.html' },
    { key: 'eizou', label: '映像', htmlPath: 'pages/seminars/eizou.html' },
    { key: 'digi', label: 'デジタル', htmlPath: 'pages/seminars/digi.html' },
    { key: 'event', label: 'イベント', htmlPath: 'pages/seminars/event.html' }
  ];
  g.ASOBI_CMS = {
    OWNER: 'r25347sh',
    REPO: 'reitansai',
    BACKUP_REPO: 'reitansai_backup',
    SESSION_KEY: 'reitansai_cms_user',
    LEGACY_SESSION_KEY: 'reitansai_user',
    SITE: 'https://r25347sh.github.io/reitansai/',
    RAW: 'https://raw.githubusercontent.com/r25347sh/reitansai/main/',
    API: 'https://api.github.com/repos/r25347sh/reitansai/contents',
    BACKUP_API: 'https://api.github.com/repos/r25347sh/reitansai_backup/contents',
    USERS_URL: 'src/users.json',
    PAGES: { login: 'login.html', select: 'select.html', editor: 'editor.html' },
    SEMINARS: SEMINARS,
    GROUPS: SEMINARS,
    CLASSES: [],
    groupByKey: function (k) {
      for (var i = 0; i < SEMINARS.length; i++) if (SEMINARS[i].key === k) return SEMINARS[i];
      return null;
    },
    groupByPath: function (path) {
      for (var i = 0; i < SEMINARS.length; i++) if (SEMINARS[i].htmlPath === path) return SEMINARS[i];
      return null;
    }
  };
})(typeof window !== 'undefined' ? window : this);
