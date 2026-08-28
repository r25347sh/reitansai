/**
 * Reitansai Visual CMS
 * - 実サイト見た目でインライン編集
 * - HTML / CSS / log を可能ならまとめて扱う
 */
(function () {
  'use strict';

  var SESSION_KEY = 'reitansai_user';
  var GITHUB_OWNER = 'r25347sh';
  var GITHUB_REPO = 'reitansai';
  var GITHUB_TOKEN = 'github_pat_11BXRNCFA0LjTsiJbrklH2_'+'TP6niw11mne8Gn8bv9pJNMVdMKGHFAP8Yj8TwHQrsRMTFMMLXIKdXXFGUoj';
  var API =
    'https://api.github.com/repos/' +
    GITHUB_OWNER +
    '/' +
    GITHUB_REPO +
    '/contents';
  var SITE_BASE = 'https://r25347sh.github.io/reitansai/';
  var API_ROOT = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO;

  var ALL_SEMINARS = [
    'pages/seminars/ai.html',
    'pages/seminars/asobi.html',
    'pages/seminars/bungaku.html',
    'pages/seminars/bungei.html',
    'pages/seminars/digi.html',
    'pages/seminars/eizou.html',
    'pages/seminars/event.html',
    'pages/seminars/gogaku.html',
    'pages/seminars/kagaku.html',
    'pages/seminars/kankou.html',
    'pages/seminars/kokusai.html',
    'pages/seminars/kyouiku.html',
    'pages/seminars/media.html',
    'pages/seminars/nougyou.html',
    'pages/seminars/syakai.html'
  ];
  var ALL_PAGES = [
    'index.html',
    'map.html',
    'admin.html',
    'pages/takimura_t.html',
    'pages/about_reitansai.html',
    'pages/aboutThisSite.html'
  ].concat(ALL_SEMINARS);

  var BUILTIN_USERS = {
    noguchi: { password: 'qU7%kE9!J8s@', name: '野口先生', semi_name: 'データサイエンス探究AIゼミ', permissions: ['pages/seminars/ai.html'] },
    akimoto: { password: 'uP6*ezCL9c3K', name: '秋元先生', semi_name: '教育ゼミ', permissions: ['pages/seminars/kyouiku.html'] },
    kondo: { password: 'tU5@nnVXMNNV', name: '近藤先生', semi_name: '国際地域研究ゼミ', permissions: ['pages/seminars/kokusai.html'] },
    kato: { password: 'eW1%yabeDYwe', name: '加藤先生', semi_name: '文芸小説創作ゼミ', permissions: ['pages/seminars/bungei.html'] },
    hirai: { password: 'qG4!Lu8hwq46', name: '平井先生', semi_name: '化学ゼミ', permissions: ['pages/seminars/kagaku.html'] },
    takeuchi: { password: 'eS8!h&INcndP', name: '竹内先生', semi_name: '文学ゼミ', permissions: ['pages/seminars/bungaku.html'] },
    sasaki: { password: 'nV2!H8eHgFf^', name: '佐々木先生', semi_name: 'メディアゼミ', permissions: ['pages/seminars/media.html'] },
    sudou: { password: 'sF0@Hk2hLahp', name: '須藤先生', semi_name: '社会ゼミ', permissions: ['pages/seminars/syakai.html'] },
    shimokawa: { password: 'lQ4%mGnScp3#', name: '下川先生', semi_name: '農業ゼミ', permissions: ['pages/seminars/nougyou.html'] },
    shibahara: { password: 'bC1&$&XMKxVD', name: '芝原先生', semi_name: '観光ゼミ', permissions: ['pages/seminars/kankou.html'] },
    matsuya: { password: 'wV4#DvjlWCnp', name: '松谷先生', semi_name: '語学ゼミ', permissions: ['pages/seminars/gogaku.html'] },
    matsumaru: { password: 'aS5@P@#vVy$5', name: '松丸先生', semi_name: '遊びの探究ゼミ', permissions: ['pages/seminars/asobi.html'] },
    mieta01: { password: 'xA7*GOYzR@3Y', name: 'ミエタアカウント０１', semi_name: '映像編集ゼミ', permissions: ['pages/seminars/eizou.html'] },
    mieta02: { password: 'iD0*M5pLBV3*', name: 'ミエタアカウント０２', semi_name: 'デジタルコンテンツ制作ゼミ', permissions: ['pages/seminars/digi.html'] },
    mieta03: { password: 'iZ0^NdIkDuf2', name: 'ミエタアカウント０３', semi_name: 'イベント企画ゼミ', permissions: ['pages/seminars/event.html'] },
    takimura: {
      password: 'Tkm#2026$Forest!Myst9',
      name: '瀧村先生',
      semi_name: '瀧村ゼミ・全体管理',
      permissions: ['pages/takimura_t.html', 'pages/about_reitansai.html', 'pages/aboutThisSite.html'].concat(ALL_SEMINARS)
    },
    r25347sh: {
      password: 'kes-2592',
      name: 'r25347sh',
      semi_name: 'サイト管理者',
      permissions: ALL_PAGES.slice()
    }
  };

  /* ---------- state ---------- */
  var state = {
    path: null,
    htmlSha: null,
    cssPath: null,
    cssSha: null,
    selected: null,
    outline: false,
    undo: []
  };

  /* ---------- utils ---------- */
  function $(id) { return document.getElementById(id); }
  function setVisible(el, on) {
    if (!el) return;
    if (on) { el.classList.remove('hidden'); el.style.display = ''; }
    else { el.classList.add('hidden'); el.style.display = 'none'; }
  }
  function showView(name) {
    setVisible($('login-view'), name === 'login');
    setVisible($('dash-view'), name === 'dash');
    setVisible($('edit-view'), name === 'edit');
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function nowStamp() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  /* ---------- session / auth ---------- */
  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function setSession(u) {
    var s = JSON.stringify(u);
    try { localStorage.setItem(SESSION_KEY, s); } catch (e) {}
    try { sessionStorage.setItem(SESSION_KEY, s); } catch (e) {}
  }
  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }
  function tryLogin(id, pw) {
    id = String(id || '').trim().toLowerCase();
    var u = BUILTIN_USERS[id];
    if (!u) return null;
    if (String(u.password) !== String(pw)) return null;
    return { id: id, name: u.name, semi_name: u.semi_name, permissions: u.permissions.slice() };
  }
  function doLogin() {
    var errEl = $('login-error'), st = $('login-status');
    if (errEl) errEl.textContent = '';
    var id = ($('uid') && $('uid').value.trim()) || '';
    var pw = ($('pw') && $('pw').value) || '';
    if (st) st.textContent = '認証中…';
    var session = tryLogin(id, pw);
    if (!session) {
      if (errEl) errEl.textContent = 'ID またはパスワードが違います（id="' + id + '"）';
      if (st) st.textContent = '';
      return;
    }
    setSession(session);
    if (st) st.textContent = 'ログイン成功';
    enterDash(session);
  }

  function enterDash(user) {
    var label = $('user-label');
    var list = $('perm-list');
    if (label) label.textContent = (user.name || user.id) + '（' + (user.semi_name || '') + '）';
    if (list) {
      list.innerHTML = '';
      var perms = user.permissions || [];
      if (!perms.length) {
        list.innerHTML = '<li>編集可能なページがありません</li>';
      } else {
        for (var i = 0; i < perms.length; i++) {
          (function (p) {
            var li = document.createElement('li');
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn-gold';
            b.textContent = prettyPath(p);
            b.onclick = function () { openVisualEditor(user, p); };
            li.appendChild(b);
            list.appendChild(li);
          })(perms[i]);
        }
      }
    }
    showView('dash');
  }

  function prettyPath(p) {
    if (p === 'index.html') return '🏠 トップページ';
    if (p === 'map.html') return '🗺 マップ';
    if (p.indexOf('pages/seminars/') === 0) return '📚 ' + p.replace('pages/seminars/', '').replace('.html', '');
    return p;
  }

  /* ---------- GitHub ---------- */
  function ghHeaders() {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + GITHUB_TOKEN,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
  }
  function decodeContent(c) {
    return decodeURIComponent(escape(atob(String(c).replace(/\n/g, ''))));
  }
  function encodeContent(text) {
    return btoa(unescape(encodeURIComponent(text)));
  }
  function getFile(path) {
    return fetch(API + '/' + path + '?ref=main', { headers: ghHeaders() }).then(function (res) {
      if (!res.ok) throw new Error('GET ' + path + ': ' + res.status);
      return res.json();
    });
  }
  function putFile(path, content, message, sha) {
    var body = {
      message: message || 'CMS編集',
      content: encodeContent(content),
      branch: 'main'
    };
    if (sha) body.sha = sha;
    return fetch(API + '/' + path, {
      method: 'PUT',
      headers: ghHeaders(),
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok)
        return res.text().then(function (t) {
          throw new Error('PUT ' + path + ': ' + res.status + ' ' + t);
        });
      return res.json();
    });
  }

  /** 複数ファイルを1コミットにまとめる（workflow キャンセル対策） */
  function commitFiles(files, message) {
    var headers = ghHeaders();
    function gh(url, opts) {
      opts = opts || {};
      return fetch(url, {
        method: opts.method || 'GET',
        headers: headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined
      }).then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) {
            throw new Error((opts.method || 'GET') + ' ' + url.replace(API_ROOT, '') + ': ' + res.status + ' ' + t);
          });
        }
        return res.status === 204 ? null : res.json();
      });
    }
    return gh(API_ROOT + '/git/ref/heads/main').then(function (ref) {
      var baseCommitSha = ref.object.sha;
      return gh(API_ROOT + '/git/commits/' + baseCommitSha).then(function (commit) {
        var baseTreeSha = commit.tree.sha;
        return Promise.all(
          files.map(function (f) {
            return gh(API_ROOT + '/git/blobs', {
              method: 'POST',
              body: { content: encodeContent(f.content), encoding: 'base64' }
            }).then(function (blob) {
              return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha };
            });
          })
        ).then(function (treeItems) {
          return gh(API_ROOT + '/git/trees', {
            method: 'POST',
            body: { base_tree: baseTreeSha, tree: treeItems }
          }).then(function (newTree) {
            return gh(API_ROOT + '/git/commits', {
              method: 'POST',
              body: {
                message: message || 'CMS編集',
                tree: newTree.sha,
                parents: [baseCommitSha]
              }
            }).then(function (newCommit) {
              return gh(API_ROOT + '/git/refs/heads/main', {
                method: 'PATCH',
                body: { sha: newCommit.sha }
              }).then(function () { return newCommit; });
            });
          });
        });
      });
    });
  }

  function pathToCss(htmlPath) {
    if (htmlPath.indexOf('pages/seminars/') === 0)
      return htmlPath.replace('pages/seminars/', 'src/css/pages/seminars/').replace('.html', '.css');
    if (htmlPath.indexOf('pages/') === 0)
      return htmlPath.replace('pages/', 'src/css/pages/').replace('.html', '.css');
    if (htmlPath === 'index.html') return 'src/css/pages/index.css';
    if (htmlPath === 'map.html') return 'src/css/pages/map.css';
    return null;
  }

  /* ---------- Visual editor core ---------- */
  function frameDoc() {
    var f = $('preview-frame');
    return f && f.contentDocument;
  }

  function pushUndo() {
    var doc = frameDoc();
    if (!doc || !doc.documentElement) return;
    state.undo.push(doc.documentElement.outerHTML);
    if (state.undo.length > 30) state.undo.shift();
  }

  function undo() {
    if (!state.undo.length) return;
    var html = state.undo.pop();
    var frame = $('preview-frame');
    var doc = frameDoc();
    if (!doc) return;
    // re-inject by rewriting srcdoc with editor bridge
    var rebuilt = injectEditorBridge('<!DOCTYPE html>' + html);
    frame.srcdoc = rebuilt;
    clearSelection();
    $('edit-status').textContent = '元に戻しました';
  }

  function clearSelection() {
    state.selected = null;
    var doc = frameDoc();
    if (doc) {
      var prev = doc.querySelectorAll('.cms-selected');
      for (var i = 0; i < prev.length; i++) prev[i].classList.remove('cms-selected');
    }
    $('sel-tag').textContent = '（未選択）';
    $('prop-text').value = '';
    $('prop-href').value = '';
    $('prop-src').value = '';
  }

  function selectEl(el) {
    if (!el || el === frameDoc().documentElement || el === frameDoc().body) return;
    var doc = frameDoc();
    var prev = doc.querySelectorAll('.cms-selected');
    for (var i = 0; i < prev.length; i++) prev[i].classList.remove('cms-selected');
    el.classList.add('cms-selected');
    state.selected = el;
    $('sel-tag').textContent = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).filter(function (c) { return c && c !== 'cms-selected'; }).slice(0, 2).join('.') : '');
    $('prop-text').value = (el.innerText || '').trim().slice(0, 2000);
    $('prop-href').value = el.getAttribute('href') || '';
    $('prop-src').value = el.getAttribute('src') || '';
    try {
      var cs = frameDoc().defaultView.getComputedStyle(el);
      if (cs.color) $('prop-color').value = rgbToHex(cs.color) || '#f0d060';
      if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        var bg = rgbToHex(cs.backgroundColor);
        if (bg) $('prop-bg').value = bg;
      }
      var fs = parseInt(cs.fontSize, 10);
      if (fs) { $('prop-size').value = fs; $('prop-size-val').textContent = fs + 'px'; }
    } catch (e) {}
  }

  function rgbToHex(rgb) {
    var m = String(rgb).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    function h(n) { var s = Number(n).toString(16); return s.length === 1 ? '0' + s : s; }
    return '#' + h(m[1]) + h(m[2]) + h(m[3]);
  }

  function rewriteRelativeUrls(html, htmlPath) {
    // base for relative resolution
    var dir = htmlPath.indexOf('/') >= 0 ? htmlPath.replace(/\/[^\/]*$/, '/') : '';
    var base = SITE_BASE + dir;
    // inject <base>
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, '<head$1><base href="' + base + '">');
    } else {
      html = '<base href="' + base + '">' + html;
    }
    return html;
  }

  function injectEditorBridge(html) {
    var style =
      '<style id="cms-editor-style">' +
      '.cms-selected{outline:2px solid #c9a227!important;outline-offset:2px;cursor:pointer!important}' +
      'body.cms-outline *{outline:1px dashed rgba(201,162,39,.35)!important}' +
      '[contenteditable="true"]{caret-color:#f0d060}' +
      '</style>';
    var script =
      '<script>(function(){' +
      'function send(t,p){parent.postMessage(Object.assign({type:t},p||{}), "*");}' +
      'document.addEventListener("click",function(e){' +
      '  var a=e.target.closest("a"); if(a){e.preventDefault();}' +
      '  e.preventDefault(); e.stopPropagation();' +
      '  var el=e.target; if(el===document.body||el===document.documentElement)return;' +
      '  send("cms-select",{tag:el.tagName});' +
      '  el.__cmsPick=true; window.__cmsLast=el;' +
      '},true);' +
      'document.addEventListener("dblclick",function(e){' +
      '  e.preventDefault(); e.stopPropagation();' +
      '  var el=e.target; if(el.closest("script,style"))return;' +
      '  el.contentEditable="true"; el.focus();' +
      '  send("cms-edit-start");' +
      '},true);' +
      'document.addEventListener("keydown",function(e){' +
      '  if(e.key==="Escape"){send("cms-clear");}' +
      '},true);' +
      'document.addEventListener("blur",function(e){' +
      '  if(e.target&&e.target.contentEditable==="true"){e.target.contentEditable="false"; send("cms-edit-end");}' +
      '},true);' +
      'window.__cmsGetSelected=function(){return window.__cmsLast||null;};' +
      '})();<\/script>';

    if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, style + '</head>');
    else html = style + html;
    if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, script + '</body>');
    else html = html + script;
    return html;
  }

  function stripEditorArtifacts(html) {
    html = html.replace(/<base[^>]*>/gi, '');
    html = html.replace(/<style id="cms-editor-style"[\s\S]*?<\/style>/gi, '');
    html = html.replace(/<script>\(function\(\)\{function send\(t,p\)\{parent\.postMessage[\s\S]*?<\/script>/gi, '');
    html = html.replace(/\s*class="cms-selected"/g, '');
    html = html.replace(/\s*cms-selected/g, '');
    html = html.replace(/\s*contenteditable="true"/gi, '');
    html = html.replace(/\s*contenteditable="false"/gi, '');
    html = html.replace(/\s*class="cms-outline"/g, '');
    return html;
  }

  function openVisualEditor(user, htmlPath) {
    showView('edit');
    state.path = htmlPath;
    state.selected = null;
    state.undo = [];
    $('edit-path').textContent = htmlPath;
    $('edit-status').textContent = '読み込み中…';
    var cssPath = pathToCss(htmlPath);
    state.cssPath = cssPath;

    var tasks = [getFile(htmlPath)];
    if (cssPath) tasks.push(getFile(cssPath).catch(function () { return null; }));

    Promise.all(tasks)
      .then(function (results) {
        var file = results[0];
        state.htmlSha = file.sha;
        var html = decodeContent(file.content);
        html = rewriteRelativeUrls(html, htmlPath);
        html = injectEditorBridge(html);
        $('preview-frame').srcdoc = html;

        if (cssPath && results[1]) {
          state.cssSha = results[1].sha;
          var cssText = decodeContent(results[1].content);
          var m = cssText.match(
            /\/\* --- teacher-custom-css-start --- \*\/([\s\S]*?)\/\* --- teacher-custom-css-end --- \*\//
          );
          $('css-editor').value = m ? m[1].trim() : '';
        } else {
          state.cssSha = null;
          $('css-editor').value = '';
        }
        $('edit-status').textContent = '編集可能 · クリックで選択';
        clearSelection();
      })
      .catch(function (err) {
        $('edit-status').textContent = '読込失敗: ' + err.message;
      });
  }

  function applyProps() {
    var doc = frameDoc();
    if (!doc) return;
    var el = state.selected || (doc.defaultView && doc.defaultView.__cmsLast);
    if (!el) { $('edit-status').textContent = '要素を選択してください'; return; }
    pushUndo();
    var text = $('prop-text').value;
    var href = $('prop-href').value.trim();
    var src = $('prop-src').value.trim();
    var color = $('prop-color').value;
    var bg = $('prop-bg').value;
    var size = $('prop-size').value;
    var weight = $('prop-weight').value;
    var align = $('prop-align').value;

    if (text !== '' && el.childElementCount === 0) {
      el.textContent = text;
    } else if (text !== '' && (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'P' || el.tagName === 'SPAN' || el.tagName === 'A' || el.tagName === 'BUTTON')) {
      el.textContent = text;
    }
    if (el.tagName === 'A' || el.tagName === 'LINK') {
      if (href) el.setAttribute('href', href);
    } else if (href) {
      // wrap or set data
      el.setAttribute('data-cms-href', href);
    }
    if (el.tagName === 'IMG' && src) el.setAttribute('src', src);
    if (color) el.style.color = color;
    if (bg) el.style.backgroundColor = bg;
    if (size) el.style.fontSize = size + 'px';
    if (weight) el.style.fontWeight = weight;
    if (align) el.style.textAlign = align;
    selectEl(el);
    $('edit-status').textContent = '適用しました（未保存）';
  }

  function exportHtml() {
    var doc = frameDoc();
    if (!doc) throw new Error('プレビューがありません');
    // clone
    var clone = doc.documentElement.cloneNode(true);
    // remove editor artifacts from clone
    var styles = clone.querySelectorAll('#cms-editor-style');
    for (var i = 0; i < styles.length; i++) styles[i].remove();
    var bases = clone.querySelectorAll('base');
    for (var j = 0; j < bases.length; j++) bases[j].remove();
    var scripts = clone.querySelectorAll('script');
    for (var k = 0; k < scripts.length; k++) {
      var t = scripts[k].textContent || '';
      if (t.indexOf('cms-select') >= 0 || t.indexOf('__cmsGetSelected') >= 0) scripts[k].remove();
    }
    var sel = clone.querySelectorAll('.cms-selected');
    for (var s = 0; s < sel.length; s++) sel[s].classList.remove('cms-selected');
    clone.classList.remove('cms-outline');
    if (clone.body) clone.body.classList.remove('cms-outline');
    var all = clone.querySelectorAll('[contenteditable]');
    for (var c = 0; c < all.length; c++) all[c].removeAttribute('contenteditable');
    return '<!DOCTYPE html>\n' + clone.outerHTML;
  }

  function buildCssContent(existingOrEmpty, custom) {
    var cssText = existingOrEmpty || '/* page */\n';
    if (cssText.indexOf('teacher-custom-css-start') >= 0) {
      cssText = cssText.replace(
        /\/\* --- teacher-custom-css-start --- \*\/[\s\S]*?\/\* --- teacher-custom-css-end --- \*\//,
        '/* --- teacher-custom-css-start --- */\n' + custom + '\n/* --- teacher-custom-css-end --- */'
      );
    } else {
      cssText +=
        '\n/* --- teacher-custom-css-start --- */\n' +
        custom +
        '\n/* --- teacher-custom-css-end --- */\n';
    }
    return cssText;
  }

  function saveAll() {
    var user = getSession();
    var path = state.path;
    var status = $('edit-status');
    var commitMsg = ($('commit-msg') && $('commit-msg').value.trim()) || ('CMS: ' + path);
    if (!path || !user) return;
    status.textContent = '保存中…';

    var htmlOut;
    try {
      htmlOut = exportHtml();
    } catch (e) {
      status.textContent = '保存失敗: ' + e.message;
      return;
    }

    var files = [{ path: path, content: htmlOut }];
    var customCss = $('css-editor').value;
    var cssPath = state.cssPath;

    var prep = Promise.resolve();
    if (cssPath) {
      prep = getFile(cssPath)
        .then(function (cf) {
          var cssText = buildCssContent(decodeContent(cf.content), customCss);
          files.push({ path: cssPath, content: cssText });
        })
        .catch(function () {
          files.push({ path: cssPath, content: buildCssContent('', customCss) });
        });
    }

    prep
      .then(function () {
        // log line
        var line =
          '[' + nowStamp() + '] ' + ((user && (user.name || user.id)) || 'unknown') + ' | ' + path + ' | ' + commitMsg + '\n';
        return getFile('src/log.txt')
          .then(function (lf) {
            var prev = '';
            try { prev = decodeContent(lf.content); } catch (e) {}
            if (prev && prev.charAt(prev.length - 1) !== '\n') prev += '\n';
            files.push({ path: 'src/log.txt', content: prev + line });
          })
          .catch(function () {
            files.push({
              path: 'src/log.txt',
              content: '# reitansai CMS change log\n# format: [YYYY-MM-DD HH:MM] user | path | message\n' + line
            });
          });
      })
      .then(function () {
        return commitFiles(files, commitMsg);
      })
      .then(function () {
        status.textContent = '保存完了 ✓（1コミット）';
        // refresh shas lightly
        return getFile(path).then(function (f) {
          state.htmlSha = f.sha;
        });
      })
      .catch(function (err) {
        status.textContent = '保存失敗: ' + err.message;
      });
  }

  /* ---------- boot ---------- */
  function boot() {
    if (!$('login-view') || !$('dash-view')) {
      document.body.insertAdjacentHTML('afterbegin', '<p style="color:red;padding:1rem">admin.html 構造エラー</p>');
      return;
    }

    var existing = getSession();
    if (existing && existing.id) enterDash(existing);
    else showView('login');

    var loginBtn = $('login-btn');
    if (loginBtn) {
      loginBtn.onclick = function (e) {
        if (e) e.preventDefault();
        doLogin();
      };
    }
    function onEnter(e) {
      if (e.key === 'Enter') { e.preventDefault(); doLogin(); }
    }
    if ($('uid')) $('uid').addEventListener('keydown', onEnter);
    if ($('pw')) $('pw').addEventListener('keydown', onEnter);

    if ($('logout-btn')) {
      $('logout-btn').onclick = function () {
        clearSession();
        showView('login');
      };
    }
    if ($('btn-back')) {
      $('btn-back').onclick = function () {
        var u = getSession();
        if (u) enterDash(u);
        else showView('login');
      };
    }
    if ($('btn-save')) $('btn-save').onclick = saveAll;
    if ($('btn-undo')) $('btn-undo').onclick = undo;
    if ($('btn-apply-props')) $('btn-apply-props').onclick = applyProps;
    if ($('prop-size')) {
      $('prop-size').oninput = function () {
        $('prop-size-val').textContent = this.value + 'px';
      };
    }

    // device toggle
    var devBtns = document.querySelectorAll('.dev-btn');
    for (var d = 0; d < devBtns.length; d++) {
      devBtns[d].addEventListener('click', function () {
        for (var i = 0; i < devBtns.length; i++) devBtns[i].classList.remove('active');
        this.classList.add('active');
        var frame = $('canvas-frame');
        frame.className = 'cms-canvas device-' + this.getAttribute('data-device');
      });
    }

    if ($('btn-outline-mode')) {
      $('btn-outline-mode').onclick = function () {
        state.outline = !state.outline;
        var doc = frameDoc();
        if (doc && doc.body) {
          if (state.outline) doc.body.classList.add('cms-outline');
          else doc.body.classList.remove('cms-outline');
        }
        this.classList.toggle('active', state.outline);
      };
    }

    // format commands inside iframe
    var cmds = document.querySelectorAll('[data-cmd]');
    for (var i = 0; i < cmds.length; i++) {
      cmds[i].addEventListener('click', function () {
        var doc = frameDoc();
        if (!doc) return;
        pushUndo();
        doc.execCommand(this.getAttribute('data-cmd'), false, null);
      });
    }

    if ($('btn-make-link')) {
      $('btn-make-link').onclick = function () {
        var doc = frameDoc();
        if (!doc) return;
        var url = $('prop-href').value.trim() || prompt('リンクURL');
        if (!url) return;
        pushUndo();
        doc.execCommand('createLink', false, url);
      };
    }
    if ($('btn-unlink')) {
      $('btn-unlink').onclick = function () {
        var doc = frameDoc();
        if (!doc) return;
        pushUndo();
        doc.execCommand('unlink', false, null);
      };
    }
    if ($('btn-delete-el')) {
      $('btn-delete-el').onclick = function () {
        var el = state.selected;
        if (!el) return;
        pushUndo();
        if (el.parentNode) el.parentNode.removeChild(el);
        clearSelection();
        $('edit-status').textContent = '要素を削除しました（未保存）';
      };
    }

    if ($('btn-ins-text')) {
      $('btn-ins-text').onclick = function () {
        var doc = frameDoc();
        if (!doc || !doc.body) return;
        pushUndo();
        var p = doc.createElement('p');
        p.textContent = '新しいテキスト';
        p.style.color = '#f0d060';
        (state.selected || doc.body).appendChild(p);
        selectEl(p);
      };
    }
    if ($('btn-ins-image')) {
      $('btn-ins-image').onclick = function () {
        var url = prompt('画像URL');
        if (!url) return;
        var doc = frameDoc();
        if (!doc) return;
        pushUndo();
        var img = doc.createElement('img');
        img.src = url;
        img.alt = '';
        img.style.maxWidth = '100%';
        (state.selected || doc.body).appendChild(img);
        selectEl(img);
      };
    }
    if ($('btn-ins-link')) {
      $('btn-ins-link').onclick = function () {
        var url = prompt('リンクURL', 'https://');
        if (!url) return;
        var text = prompt('表示テキスト', 'リンク');
        var doc = frameDoc();
        if (!doc) return;
        pushUndo();
        var a = doc.createElement('a');
        a.href = url;
        a.textContent = text || url;
        (state.selected || doc.body).appendChild(a);
        selectEl(a);
      };
    }
    if ($('btn-ins-box')) {
      $('btn-ins-box').onclick = function () {
        var doc = frameDoc();
        if (!doc) return;
        pushUndo();
        var box = doc.createElement('div');
        box.style.padding = '1rem';
        box.style.border = '1px solid rgba(201,162,39,.4)';
        box.style.borderRadius = '12px';
        box.style.margin = '0.5rem 0';
        box.innerHTML = '<p>新しいボックス</p>';
        (state.selected || doc.body).appendChild(box);
        selectEl(box);
      };
    }

    // messages from iframe
    window.addEventListener('message', function (ev) {
      var data = ev.data;
      if (!data || !data.type) return;
      if (data.type === 'cms-select') {
        var doc = frameDoc();
        if (!doc || !doc.defaultView) return;
        var el = doc.defaultView.__cmsLast;
        if (el) selectEl(el);
      } else if (data.type === 'cms-clear') {
        clearSelection();
      } else if (data.type === 'cms-edit-start') {
        pushUndo();
        $('edit-status').textContent = '文字編集中…';
      } else if (data.type === 'cms-edit-end') {
        $('edit-status').textContent = '編集可能（未保存の変更あり）';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
