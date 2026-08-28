/**
 * Reitansai Visual CMS (enhanced)
 * 追加・削除・移動・リサイズ・テーマ・動的変数・保護要素・上級者モード
 */
(function () {
  'use strict';

  var SESSION_KEY = 'reitansai_user';
  var VARS_KEY = 'reitansai_cms_vars';
  var GITHUB_OWNER = 'r25347sh';
  var GITHUB_REPO = 'reitansai';
  var GITHUB_TOKEN = 'github_pat_11BXRNCFA0LjTsiJbrklH2_'+'TP6niw11mne8Gn8bv9pJNMVdMKGHFAP8Yj8TwHQrsRMTFMMLXIKdXXFGUoj';
  var API = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents';
  var API_ROOT = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO;
  var SITE_BASE = 'https://r25347sh.github.io/reitansai/';

  var ALL_SEMINARS = [
    'pages/seminars/ai.html','pages/seminars/asobi.html','pages/seminars/bungaku.html',
    'pages/seminars/bungei.html','pages/seminars/digi.html','pages/seminars/eizou.html',
    'pages/seminars/event.html','pages/seminars/gogaku.html','pages/seminars/kagaku.html',
    'pages/seminars/kankou.html','pages/seminars/kokusai.html','pages/seminars/kyouiku.html',
    'pages/seminars/media.html','pages/seminars/nougyou.html','pages/seminars/syakai.html'
  ];
  var ALL_PAGES = [
    'index.html','map.html','admin.html','pages/takimura_t.html',
    'pages/about_reitansai.html','pages/aboutThisSite.html'
  ].concat(ALL_SEMINARS);

  var BUILTIN_USERS = {
    noguchi: { password: 'qU7%kE9!J8s@', name: '野口先生', semi_name: 'データサイエンス探究AIゼミ', permissions: ['pages/seminars/ai.html'], advanced: true },
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
      password: 'Tkm#2026$Forest!Myst9', name: '瀧村先生', semi_name: '瀧村ゼミ・全体管理',
      permissions: ['pages/takimura_t.html','pages/about_reitansai.html','pages/aboutThisSite.html'].concat(ALL_SEMINARS),
      advanced: true
    },
    r25347sh: {
      password: 'kes-2592', name: 'r25347sh', semi_name: 'サイト管理者',
      permissions: ALL_PAGES.slice(), advanced: true, isAdmin: true
    }
  };

  var state = {
    path: null, cssPath: null, selected: null, outline: false,
    undo: [], redo: [], customVars: {}, isAdmin: false, advancedUser: false
  };

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
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  /* session */
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
  function loadVars() {
    try {
      state.customVars = JSON.parse(localStorage.getItem(VARS_KEY) || '{}') || {};
    } catch (e) { state.customVars = {}; }
  }
  function saveVars() {
    try { localStorage.setItem(VARS_KEY, JSON.stringify(state.customVars)); } catch (e) {}
  }

  function tryLogin(id, pw) {
    id = String(id || '').trim().toLowerCase();
    var u = BUILTIN_USERS[id];
    if (!u || String(u.password) !== String(pw)) return null;
    return {
      id: id, name: u.name, semi_name: u.semi_name,
      permissions: u.permissions.slice(),
      advanced: !!u.advanced, isAdmin: !!u.isAdmin
    };
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
    state.isAdmin = !!user.isAdmin;
    state.advancedUser = !!user.advanced || !!user.isAdmin;
    var label = $('user-label');
    if (label) label.textContent = (user.name || user.id) + '（' + (user.semi_name || '') + '）';
    var list = $('perm-list');
    if (list) {
      list.innerHTML = '';
      var perms = user.permissions || [];
      if (!perms.length) list.innerHTML = '<li>編集可能なページがありません</li>';
      else {
        for (var i = 0; i < perms.length; i++) {
          (function (p) {
            var li = document.createElement('li');
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'btn-gold';
            b.textContent = prettyPath(p);
            b.onclick = function () { openVisualEditor(user, p); };
            li.appendChild(b); list.appendChild(li);
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

  /* GitHub */
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
    var body = { message: message || 'CMS編集', content: encodeContent(content), branch: 'main' };
    if (sha) body.sha = sha;
    return fetch(API + '/' + path, { method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body) })
      .then(function (res) {
        if (!res.ok) return res.text().then(function (t) { throw new Error('PUT ' + path + ': ' + res.status + ' ' + t); });
        return res.json();
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

  /* frame helpers */
  function frameDoc() {
    var f = $('preview-frame');
    return f && f.contentDocument;
  }
  function frameWin() {
    var f = $('preview-frame');
    return f && f.contentWindow;
  }

  function isProtected(el) {
    if (!el || !el.closest) return false;
    if (el.closest('[data-cms-lock="1"]') || el.closest('.cms-lock')) return true;
    if (el.closest('footer')) {
      var t = (el.textContent || '') + ' ' + (el.className || '');
      if (/copyright|©|コピーライト|著作権|all\s*rights/i.test(t) || el.closest('[data-cms-copyright]')) return true;
    }
    return false;
  }
  function canEdit(el) {
    if (!el) return false;
    if (isProtected(el) && !state.isAdmin) return false;
    return true;
  }

  function pushUndo() {
    var doc = frameDoc();
    if (!doc || !doc.documentElement) return;
    state.undo.push(doc.documentElement.outerHTML);
    if (state.undo.length > 40) state.undo.shift();
    state.redo = [];
  }
  function restoreHtml(html) {
    var frame = $('preview-frame');
    frame.srcdoc = injectEditorBridge('<!DOCTYPE html>' + html);
    clearSelectionUI();
  }
  function undo() {
    if (!state.undo.length) return;
    var doc = frameDoc();
    if (doc && doc.documentElement) state.redo.push(doc.documentElement.outerHTML);
    restoreHtml(state.undo.pop());
    $('edit-status').textContent = '元に戻しました';
  }
  function redo() {
    if (!state.redo.length) return;
    var doc = frameDoc();
    if (doc && doc.documentElement) state.undo.push(doc.documentElement.outerHTML);
    restoreHtml(state.redo.pop());
    $('edit-status').textContent = 'やり直しました';
  }

  function clearSelectionUI() {
    state.selected = null;
    var doc = frameDoc();
    if (doc) {
      var prev = doc.querySelectorAll('.cms-selected');
      for (var i = 0; i < prev.length; i++) prev[i].classList.remove('cms-selected');
      var handles = doc.querySelectorAll('.cms-handle');
      for (var h = 0; h < handles.length; h++) handles[h].remove();
    }
    if ($('sel-tag')) $('sel-tag').textContent = '（未選択）';
    if ($('sel-lock')) $('sel-lock').classList.add('hidden');
    if ($('prop-text')) $('prop-text').value = '';
    if ($('prop-href')) $('prop-href').value = '';
    if ($('prop-src')) $('prop-src').value = '';
    if ($('adv-html')) $('adv-html').value = '';
  }

  function rgbToHex(rgb) {
    var m = String(rgb).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    function h(n) { var s = Number(n).toString(16); return s.length === 1 ? '0' + s : s; }
    return '#' + h(m[1]) + h(m[2]) + h(m[3]);
  }

  function selectEl(el) {
    if (!el || !frameDoc()) return;
    var doc = frameDoc();
    if (el === doc.documentElement || el === doc.body) return;
    if (!canEdit(el)) {
      $('edit-status').textContent = 'この要素は保護されています（管理者のみ）';
      if ($('sel-lock')) $('sel-lock').classList.remove('hidden');
      if (!state.isAdmin) return;
    }
    var prev = doc.querySelectorAll('.cms-selected');
    for (var i = 0; i < prev.length; i++) prev[i].classList.remove('cms-selected');
    var oldH = doc.querySelectorAll('.cms-handle');
    for (var j = 0; j < oldH.length; j++) oldH[j].remove();

    el.classList.add('cms-selected');
    state.selected = el;
    if (frameWin()) frameWin().__cmsLast = el;

    var cls = (typeof el.className === 'string' ? el.className : '').split(/\s+/).filter(function (c) {
      return c && c !== 'cms-selected';
    }).slice(0, 3).join('.');
    $('sel-tag').textContent = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '');
    if ($('sel-lock')) {
      if (isProtected(el)) $('sel-lock').classList.remove('hidden');
      else $('sel-lock').classList.add('hidden');
    }
    $('prop-text').value = (el.innerText || '').trim().slice(0, 3000);
    $('prop-href').value = el.getAttribute('href') || '';
    $('prop-src').value = el.getAttribute('src') || '';
    if ($('adv-class')) $('adv-class').value = cls;
    if ($('adv-id')) $('adv-id').value = el.id || '';
    if ($('adv-html')) $('adv-html').value = el.outerHTML.slice(0, 8000);
    try {
      var cs = frameWin().getComputedStyle(el);
      var hx = rgbToHex(cs.color); if (hx) $('prop-color').value = hx;
      var bg = rgbToHex(cs.backgroundColor); if (bg) $('prop-bg').value = bg;
      var fs = parseInt(cs.fontSize, 10);
      if (fs) { $('prop-size').value = fs; $('prop-size-val').textContent = fs + 'px'; }
      var op = Math.round(parseFloat(cs.opacity) * 100);
      if (!isNaN(op)) { $('prop-opacity').value = op; $('prop-opacity-val').textContent = op + '%'; }
      if ($('adv-z')) $('adv-z').value = cs.zIndex === 'auto' ? '' : cs.zIndex;
    } catch (e) {}
  }

  function rewriteRelativeUrls(html, htmlPath) {
    var dir = htmlPath.indexOf('/') >= 0 ? htmlPath.replace(/\/[^\/]*$/, '/') : '';
    var base = SITE_BASE + dir;
    if (/<head[^>]*>/i.test(html)) html = html.replace(/<head([^>]*)>/i, '<head$1><base href="' + base + '">');
    else html = '<base href="' + base + '">' + html;
    return html;
  }

  function injectEditorBridge(html) {
    var style =
      '<style id="cms-editor-style">' +
      '.cms-selected{outline:2px solid #c9a227!important;outline-offset:2px;position:relative!important}' +
      'body.cms-outline *[data-cms-skip!="1"]{outline:1px dashed rgba(201,162,39,.3)!important}' +
      '.cms-handle{position:absolute;width:10px;height:10px;background:#c9a227;border:1px solid #fff;z-index:99999;box-sizing:border-box}' +
      '.cms-handle.se{right:-5px;bottom:-5px;cursor:nwse-resize}' +
      '.cms-handle.ne{right:-5px;top:-5px;cursor:nesw-resize}' +
      '.cms-handle.sw{left:-5px;bottom:-5px;cursor:nesw-resize}' +
      '.cms-handle.nw{left:-5px;top:-5px;cursor:nwse-resize}' +
      '[contenteditable="true"]{caret-color:#f0d060}' +
      '[data-cms-lock="1"]{outline-color:#ff8a8a!important}' +
      '</style>';
    var script =
      '<script>(function(){' +
      'var drag=null,resize=null;' +
      'function send(t,p){try{parent.postMessage(Object.assign({type:t},p||{}), "*");}catch(e){}}' +
      'function isHandle(el){return el&&el.classList&&el.classList.contains("cms-handle");}' +
      'document.addEventListener("mousedown",function(e){' +
      '  if(isHandle(e.target)){' +
      '    e.preventDefault();e.stopPropagation();' +
      '    var el=window.__cmsLast; if(!el)return;' +
      '    var r=el.getBoundingClientRect();' +
      '    resize={el:el,startX:e.clientX,startY:e.clientY,w:r.width,h:r.height,corner:e.target.dataset.corner};' +
      '    send("cms-resize-start"); return;' +
      '  }' +
      '  var el=e.target; if(el===document.body||el===document.documentElement)return;' +
      '  if(el.closest&&el.closest("script,style"))return;' +
      '  e.preventDefault();' +
      '  window.__cmsLast=el; send("cms-select");' +
      '  drag={el:el,startX:e.clientX,startY:e.clientY,ox:el.offsetLeft,oy:el.offsetTop,moved:false};' +
      '},true);' +
      'document.addEventListener("mousemove",function(e){' +
      '  if(resize){' +
      '    var dx=e.clientX-resize.startX, dy=e.clientY-resize.startY;' +
      '    var w=Math.max(40,resize.w+dx), h=Math.max(20,resize.h+dy);' +
      '    resize.el.style.width=w+"px"; resize.el.style.height=h+"px";' +
      '    resize.el.style.maxWidth="none"; return;' +
      '  }' +
      '  if(!drag)return;' +
      '  var dx=e.clientX-drag.startX, dy=e.clientY-drag.startY;' +
      '  if(Math.abs(dx)+Math.abs(dy)<4)return;' +
      '  drag.moved=true;' +
      '  var el=drag.el;' +
      '  var pos=window.getComputedStyle(el).position;' +
      '  if(pos==="static"){el.style.position="relative";}' +
      '  el.style.left=(drag.ox+dx)+"px"; el.style.top=(drag.oy+dy)+"px";' +
      '},true);' +
      'document.addEventListener("mouseup",function(){' +
      '  if(drag&&drag.moved) send("cms-moved");' +
      '  if(resize) send("cms-resized");' +
      '  drag=null; resize=null;' +
      '},true);' +
      'document.addEventListener("click",function(e){' +
      '  var a=e.target.closest&&e.target.closest("a"); if(a) e.preventDefault();' +
      '  e.preventDefault(); e.stopPropagation();' +
      '},true);' +
      'document.addEventListener("dblclick",function(e){' +
      '  e.preventDefault(); e.stopPropagation();' +
      '  var el=e.target; if(el.closest&&el.closest("script,style"))return;' +
      '  el.contentEditable="true"; el.focus(); send("cms-edit-start");' +
      '},true);' +
      'document.addEventListener("keydown",function(e){ if(e.key==="Escape") send("cms-clear"); },true);' +
      'document.addEventListener("blur",function(e){' +
      '  if(e.target&&e.target.contentEditable==="true"){e.target.contentEditable="false"; send("cms-edit-end");}' +
      '},true);' +
      'window.__cmsAttachHandles=function(el){' +
      '  if(!el||!el.style)return;' +
      '  ["nw","ne","sw","se"].forEach(function(c){' +
      '    var h=document.createElement("div"); h.className="cms-handle "+c; h.dataset.corner=c;' +
      '    h.setAttribute("data-cms-skip","1"); el.appendChild(h);' +
      '  });' +
      '  var pos=window.getComputedStyle(el).position;' +
      '  if(pos==="static") el.style.position="relative";' +
      '};' +
      '})();<\/script>';
    if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, style + '</head>');
    else html = style + html;
    if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, script + '</body>');
    else html = html + script;
    return html;
  }

  function openVisualEditor(user, htmlPath) {
    showView('edit');
    state.path = htmlPath;
    state.selected = null;
    state.undo = [];
    state.redo = [];
    state.isAdmin = !!user.isAdmin;
    state.advancedUser = !!user.advanced || !!user.isAdmin;
    $('edit-path').textContent = htmlPath;
    $('edit-status').textContent = '読み込み中…';
    if ($('chk-advanced')) {
      $('chk-advanced').checked = state.advancedUser;
    }
    var cssPath = pathToCss(htmlPath);
    state.cssPath = cssPath;

    var tasks = [getFile(htmlPath)];
    if (cssPath) tasks.push(getFile(cssPath).catch(function () { return null; }));

    Promise.all(tasks).then(function (results) {
      var file = results[0];
      var html = decodeContent(file.content);
      html = rewriteRelativeUrls(html, htmlPath);
      // auto-mark footer copyright if plain footer exists
      html = html.replace(/<footer(\s[^>]*)?>/i, function (m) {
        if (/data-cms-copyright/.test(m)) return m;
        return m.replace('<footer', '<footer data-cms-copyright="1"');
      });
      $('preview-frame').srcdoc = injectEditorBridge(html);

      if (cssPath && results[1]) {
        var cssText = decodeContent(results[1].content);
        var m = cssText.match(/\/\* --- teacher-custom-css-start --- \*\/([\s\S]*?)\/\* --- teacher-custom-css-end --- \*\//);
        $('css-editor').value = m ? m[1].trim() : '';
      } else {
        $('css-editor').value = '';
      }
      $('edit-status').textContent = '編集可能';
      clearSelectionUI();
      renderVarList();
    }).catch(function (err) {
      $('edit-status').textContent = '読込失敗: ' + err.message;
    });
  }

  function applyProps() {
    var el = state.selected || (frameWin() && frameWin().__cmsLast);
    if (!el || !canEdit(el)) { $('edit-status').textContent = '編集できない要素です'; return; }
    pushUndo();
    var text = $('prop-text').value;
    var href = $('prop-href').value.trim();
    var src = $('prop-src').value.trim();
    if (text !== '' && (el.childElementCount === 0 || /^(H1|H2|H3|H4|P|SPAN|A|BUTTON|LI|LABEL)$/.test(el.tagName))) {
      el.textContent = text;
    }
    if (el.tagName === 'A' && href) el.setAttribute('href', href);
    if (el.tagName === 'IMG' && src) el.setAttribute('src', src);
    el.style.color = $('prop-color').value;
    el.style.backgroundColor = $('prop-bg').value;
    el.style.fontSize = $('prop-size').value + 'px';
    if ($('prop-weight').value) el.style.fontWeight = $('prop-weight').value;
    if ($('prop-align').value) el.style.textAlign = $('prop-align').value;
    el.style.opacity = (parseInt($('prop-opacity').value, 10) / 100).toString();
    selectEl(el);
    $('edit-status').textContent = '適用しました（未保存）';
  }

  function insertBlock(type) {
    var doc = frameDoc();
    if (!doc) return;
    pushUndo();
    var parent = state.selected && canEdit(state.selected) ? state.selected : doc.body;
    if (parent.tagName === 'IMG' || parent.tagName === 'BR') parent = parent.parentNode || doc.body;
    var el = null;
    var user = getSession() || {};
    if (type === 'heading') {
      el = doc.createElement('h2');
      el.textContent = '新しい見出し';
      el.style.color = '#f0d060';
    } else if (type === 'text') {
      el = doc.createElement('p');
      el.textContent = '新しいテキストを入力';
    } else if (type === 'button') {
      el = doc.createElement('a');
      el.href = '#';
      el.textContent = 'ボタン';
      el.style.cssText = 'display:inline-block;padding:.6rem 1.2rem;border-radius:999px;background:#c9a227;color:#1a1205;text-decoration:none;font-weight:600;';
    } else if (type === 'link') {
      el = doc.createElement('a');
      el.href = 'https://';
      el.textContent = 'リンク';
      el.style.color = '#f0d060';
    } else if (type === 'image') {
      var url = prompt('画像URL', 'https://');
      if (!url) return;
      el = doc.createElement('img');
      el.src = url; el.alt = ''; el.style.maxWidth = '100%';
    } else if (type === 'box') {
      el = doc.createElement('div');
      el.style.cssText = 'padding:1rem;margin:.5rem 0;border:1px solid rgba(201,162,39,.4);border-radius:12px;';
      el.innerHTML = '<p>ボックス</p>';
    } else if (type === 'card') {
      el = doc.createElement('div');
      el.style.cssText = 'padding:1.2rem;margin:.6rem 0;border-radius:14px;background:rgba(0,0,0,.35);border:1px solid rgba(201,162,39,.3);';
      el.innerHTML = '<h3 style="color:#f0d060;margin-top:0">カード見出し</h3><p>説明文</p>';
    } else if (type === 'list') {
      el = doc.createElement('ul');
      el.innerHTML = '<li>項目1</li><li>項目2</li><li>項目3</li>';
    } else if (type === 'divider') {
      el = doc.createElement('hr');
      el.style.cssText = 'border:none;border-top:1px solid rgba(201,162,39,.35);margin:1rem 0;';
    } else if (type === 'spacer') {
      el = doc.createElement('div');
      el.style.cssText = 'height:48px;';
      el.setAttribute('aria-hidden', 'true');
    } else if (type === 'columns') {
      el = doc.createElement('div');
      el.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1rem;';
      el.innerHTML = '<div style="padding:.8rem;border:1px dashed rgba(201,162,39,.4);border-radius:8px;"><p>左カラム</p></div><div style="padding:.8rem;border:1px dashed rgba(201,162,39,.4);border-radius:8px;"><p>右カラム</p></div>';
    } else if (type === 'video') {
      el = doc.createElement('div');
      el.style.cssText = 'position:relative;padding-top:56.25%;background:#000;border-radius:10px;overflow:hidden;';
      el.innerHTML = '<p style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#f0d060;">動画URLを設定してください</p>';
    } else if (type === 'date') {
      el = doc.createElement('span');
      el.setAttribute('data-cms-dynamic', 'date');
      el.textContent = '{{date}}';
      el.style.color = '#f0d060';
    } else if (type === 'var') {
      var key = prompt('変数名（例: event_name）', 'event_name');
      if (!key) return;
      el = doc.createElement('span');
      el.setAttribute('data-cms-dynamic', 'var:' + key);
      el.textContent = '{{' + key + '}}';
      el.style.color = '#f0d060';
    }
    if (!el) return;
    parent.appendChild(el);
    selectEl(el);
    if (frameWin() && frameWin().__cmsAttachHandles) {
      try { frameWin().__cmsAttachHandles(el); } catch (e) {}
    }
    $('edit-status').textContent = 'ブロックを追加しました（未保存）';
  }

  function expandDynamics(html) {
    var user = getSession() || {};
    var map = {
      date: todayStr(),
      year: String(new Date().getFullYear()),
      user: user.name || user.id || '',
      page: state.path || ''
    };
    Object.keys(state.customVars || {}).forEach(function (k) {
      map[k] = state.customVars[k];
    });
    return html.replace(/\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g, function (_, key) {
      return map.hasOwnProperty(key) ? String(map[key]) : '{{' + key + '}}';
    });
  }

  function exportHtml() {
    var doc = frameDoc();
    if (!doc) throw new Error('プレビューがありません');
    var clone = doc.documentElement.cloneNode(true);
    var rm = clone.querySelectorAll('#cms-editor-style, base, .cms-handle');
    for (var i = 0; i < rm.length; i++) rm[i].remove();
    var scripts = clone.querySelectorAll('script');
    for (var k = 0; k < scripts.length; k++) {
      var t = scripts[k].textContent || '';
      if (t.indexOf('cms-select') >= 0 || t.indexOf('__cmsAttachHandles') >= 0) scripts[k].remove();
    }
    var sel = clone.querySelectorAll('.cms-selected');
    for (var s = 0; s < sel.length; s++) sel[s].classList.remove('cms-selected');
    if (clone.body) clone.body.classList.remove('cms-outline');
    var eds = clone.querySelectorAll('[contenteditable]');
    for (var c = 0; c < eds.length; c++) eds[c].removeAttribute('contenteditable');
    // resolve relative left/top that were for editing only — keep them as inline styles (intentional layout)
    var html = '<!DOCTYPE html>\n' + clone.outerHTML;
    // expand dynamics for published view (keep placeholders if unknown)
    html = expandDynamics(html);
    return html;
  }

  function buildCssContent(existing, custom) {
    var cssText = existing || '/* page */\n';
    if (cssText.indexOf('teacher-custom-css-start') >= 0) {
      cssText = cssText.replace(
        /\/\* --- teacher-custom-css-start --- \*\/[\s\S]*?\/\* --- teacher-custom-css-end --- \*\//,
        '/* --- teacher-custom-css-start --- */\n' + custom + '\n/* --- teacher-custom-css-end --- */'
      );
    } else {
      cssText += '\n/* --- teacher-custom-css-start --- */\n' + custom + '\n/* --- teacher-custom-css-end --- */\n';
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
    try { htmlOut = exportHtml(); }
    catch (e) { status.textContent = '保存失敗: ' + e.message; return; }

    var chain = Promise.resolve();
    // HTML
    chain = chain.then(function () {
      return getFile(path).then(function (f) {
        return putFile(path, htmlOut, commitMsg, f.sha);
      });
    });
    // CSS
    if (state.cssPath) {
      var customCss = $('css-editor').value;
      chain = chain.then(function () {
        return getFile(state.cssPath).then(function (cf) {
          return putFile(state.cssPath, buildCssContent(decodeContent(cf.content), customCss), commitMsg, cf.sha);
        }).catch(function () {
          return putFile(state.cssPath, buildCssContent('', customCss), commitMsg, null);
        });
      });
    }
    // log
    chain = chain.then(function () {
      var line = '[' + nowStamp() + '] ' + (user.name || user.id) + ' | ' + path + ' | ' + commitMsg + '\n';
      return getFile('src/log.txt').then(function (lf) {
        var prev = '';
        try { prev = decodeContent(lf.content); } catch (e) {}
        if (prev && prev.slice(-1) !== '\n') prev += '\n';
        return putFile('src/log.txt', prev + line, 'log: ' + path, lf.sha);
      }).catch(function () {
        return putFile('src/log.txt', '# reitansai CMS log\n' + line, 'log: ' + path, null);
      });
    });

    chain.then(function () {
      status.textContent = '保存完了 ✓';
    }).catch(function (err) {
      status.textContent = '保存失敗: ' + err.message;
    });
  }

  function renderVarList() {
    var box = $('var-list');
    if (!box) return;
    box.innerHTML = '';
    var keys = Object.keys(state.customVars || {});
    if (!keys.length) {
      box.innerHTML = '<p class="side-hint">まだ変数がありません</p>';
      return;
    }
    keys.forEach(function (k) {
      var row = document.createElement('div');
      row.className = 'var-item';
      row.innerHTML = '<span><code>{{' + k + '}}</code> = ' + String(state.customVars[k]).slice(0, 40) + '</span>';
      var del = document.createElement('button');
      del.type = 'button'; del.className = 'btn-outline'; del.textContent = '削除';
      del.onclick = function () {
        delete state.customVars[k];
        saveVars();
        renderVarList();
      };
      row.appendChild(del);
      box.appendChild(row);
    });
  }

  function applyTheme() {
    var doc = frameDoc();
    if (!doc || !doc.documentElement) return;
    pushUndo();
    var root = doc.documentElement;
    root.style.setProperty('--cms-bg', $('theme-bg').value);
    root.style.setProperty('--cms-text', $('theme-text').value);
    root.style.setProperty('--cms-gold', $('theme-gold').value);
    root.style.setProperty('--cms-card', $('theme-card').value);
    if (doc.body) {
      doc.body.style.backgroundColor = $('theme-bg').value;
      doc.body.style.color = $('theme-text').value;
    }
    // inject helper style once
    var st = doc.getElementById('cms-theme-style');
    if (!st) {
      st = doc.createElement('style');
      st.id = 'cms-theme-style';
      doc.head.appendChild(st);
    }
    st.textContent =
      'body{background:' + $('theme-bg').value + '!important;color:' + $('theme-text').value + ';}' +
      'a{color:' + $('theme-gold').value + ';}';
    $('edit-status').textContent = 'テーマ適用（未保存）';
  }

  function boot() {
    loadVars();
    if (!$('login-view') || !$('dash-view')) {
      document.body.insertAdjacentHTML('afterbegin', '<p style="color:red;padding:1rem">admin.html 構造エラー</p>');
      return;
    }
    var existing = getSession();
    if (existing && existing.id) enterDash(existing);
    else showView('login');

    if ($('login-btn')) $('login-btn').onclick = function (e) { if (e) e.preventDefault(); doLogin(); };
    function onEnter(e) { if (e.key === 'Enter') { e.preventDefault(); doLogin(); } }
    if ($('uid')) $('uid').addEventListener('keydown', onEnter);
    if ($('pw')) $('pw').addEventListener('keydown', onEnter);
    if ($('logout-btn')) $('logout-btn').onclick = function () { clearSession(); showView('login'); };
    if ($('btn-back')) $('btn-back').onclick = function () {
      var u = getSession(); if (u) enterDash(u); else showView('login');
    };
    if ($('btn-save')) $('btn-save').onclick = saveAll;
    if ($('btn-undo')) $('btn-undo').onclick = undo;
    if ($('btn-redo')) $('btn-redo').onclick = redo;
    if ($('btn-apply-props')) $('btn-apply-props').onclick = applyProps;
    if ($('prop-size')) $('prop-size').oninput = function () { $('prop-size-val').textContent = this.value + 'px'; };
    if ($('prop-opacity')) $('prop-opacity').oninput = function () { $('prop-opacity-val').textContent = this.value + '%'; };

    // tabs
    var tabs = document.querySelectorAll('.side-tab');
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener('click', function () {
        for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
        this.classList.add('active');
        var panels = ['props', 'blocks', 'theme', 'vars', 'adv'];
        for (var p = 0; p < panels.length; p++) {
          var el = $('panel-' + panels[p]);
          if (el) el.classList.toggle('hidden', panels[p] !== this.getAttribute('data-panel'));
        }
      });
    }

    // device
    var devBtns = document.querySelectorAll('.dev-btn');
    for (var d = 0; d < devBtns.length; d++) {
      devBtns[d].addEventListener('click', function () {
        for (var i = 0; i < devBtns.length; i++) devBtns[i].classList.remove('active');
        this.classList.add('active');
        $('canvas-frame').className = 'cms-canvas device-' + this.getAttribute('data-device');
      });
    }
    if ($('btn-outline-mode')) {
      $('btn-outline-mode').onclick = function () {
        state.outline = !state.outline;
        var doc = frameDoc();
        if (doc && doc.body) doc.body.classList.toggle('cms-outline', state.outline);
        this.classList.toggle('active', state.outline);
      };
    }

    // format
    var cmds = document.querySelectorAll('[data-cmd]');
    for (var i = 0; i < cmds.length; i++) {
      cmds[i].addEventListener('click', function () {
        var doc = frameDoc(); if (!doc) return;
        pushUndo();
        doc.execCommand(this.getAttribute('data-cmd'), false, null);
      });
    }
    if ($('btn-make-link')) $('btn-make-link').onclick = function () {
      var doc = frameDoc(); if (!doc) return;
      var url = $('prop-href').value.trim() || prompt('リンクURL');
      if (!url) return; pushUndo(); doc.execCommand('createLink', false, url);
    };
    if ($('btn-unlink')) $('btn-unlink').onclick = function () {
      var doc = frameDoc(); if (!doc) return; pushUndo(); doc.execCommand('unlink', false, null);
    };
    if ($('btn-delete-el')) $('btn-delete-el').onclick = function () {
      var el = state.selected; if (!el || !canEdit(el)) return;
      pushUndo(); if (el.parentNode) el.parentNode.removeChild(el);
      clearSelectionUI(); $('edit-status').textContent = '削除しました（未保存）';
    };
    if ($('btn-duplicate')) $('btn-duplicate').onclick = function () {
      var el = state.selected; if (!el || !canEdit(el)) return;
      pushUndo();
      var clone = el.cloneNode(true);
      clone.classList.remove('cms-selected');
      var handles = clone.querySelectorAll('.cms-handle');
      for (var h = 0; h < handles.length; h++) handles[h].remove();
      if (el.parentNode) el.parentNode.insertBefore(clone, el.nextSibling);
      selectEl(clone);
    };

    // blocks
    var blocks = document.querySelectorAll('[data-ins]');
    for (var b = 0; b < blocks.length; b++) {
      blocks[b].addEventListener('click', function () {
        insertBlock(this.getAttribute('data-ins'));
      });
    }

    // theme
    if ($('btn-apply-theme')) $('btn-apply-theme').onclick = applyTheme;
    if ($('btn-reset-theme')) $('btn-reset-theme').onclick = function () {
      var doc = frameDoc(); if (!doc) return;
      pushUndo();
      var st = doc.getElementById('cms-theme-style'); if (st) st.remove();
      if (doc.body) { doc.body.style.backgroundColor = ''; doc.body.style.color = ''; }
      $('edit-status').textContent = 'テーマ解除（未保存）';
    };

    // vars
    if ($('btn-add-var')) $('btn-add-var').onclick = function () {
      var k = ($('var-key').value || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '');
      var v = $('var-val').value || '';
      if (!k) return;
      state.customVars[k] = v; saveVars(); renderVarList();
      $('var-key').value = ''; $('var-val').value = '';
    };
    if ($('btn-insert-var')) $('btn-insert-var').onclick = function () {
      var k = ($('var-key').value || '').trim() || Object.keys(state.customVars)[0];
      if (!k) return;
      var el = state.selected; if (!el || !canEdit(el)) return;
      pushUndo();
      el.textContent = (el.textContent || '') + '{{' + k + '}}';
    };
    var chips = document.querySelectorAll('.var-chip');
    for (var c = 0; c < chips.length; c++) {
      chips[c].addEventListener('click', function () {
        var el = state.selected;
        if (el && canEdit(el)) {
          pushUndo();
          el.textContent = (el.textContent || '') + this.getAttribute('data-var');
        } else {
          navigator.clipboard && navigator.clipboard.writeText(this.getAttribute('data-var'));
          $('edit-status').textContent = '変数をコピーしました: ' + this.getAttribute('data-var');
        }
      });
    }

    // advanced
    if ($('btn-apply-adv')) $('btn-apply-adv').onclick = function () {
      var el = state.selected; if (!el || !canEdit(el)) return;
      pushUndo();
      if ($('adv-id').value) el.id = $('adv-id').value;
      if ($('adv-class').value) el.className = $('adv-class').value;
      if ($('adv-z').value !== '') el.style.zIndex = $('adv-z').value;
      if ($('adv-display').value) el.style.display = $('adv-display').value;
      var raw = $('adv-html').value;
      if (raw && raw !== el.outerHTML && el.parentNode) {
        var wrap = frameDoc().createElement('div');
        wrap.innerHTML = raw;
        var neu = wrap.firstElementChild;
        if (neu) { el.parentNode.replaceChild(neu, el); selectEl(neu); return; }
      }
      selectEl(el);
      $('edit-status').textContent = '上級設定を適用（未保存）';
    };
    if ($('btn-lock-el')) $('btn-lock-el').onclick = function () {
      if (!state.isAdmin) { $('edit-status').textContent = '保護設定は管理者のみ'; return; }
      var el = state.selected; if (!el) return;
      pushUndo();
      el.setAttribute('data-cms-lock', '1');
      $('edit-status').textContent = '要素を保護しました';
      selectEl(el);
    };

    window.addEventListener('message', function (ev) {
      var data = ev.data; if (!data || !data.type) return;
      var win = frameWin();
      if (data.type === 'cms-select') {
        if (win && win.__cmsLast) {
          selectEl(win.__cmsLast);
          if (win.__cmsAttachHandles && state.selected) {
            try { win.__cmsAttachHandles(state.selected); } catch (e) {}
          }
        }
      } else if (data.type === 'cms-clear') {
        clearSelectionUI();
      } else if (data.type === 'cms-edit-start' || data.type === 'cms-moved' || data.type === 'cms-resized') {
        if (data.type === 'cms-edit-start') pushUndo();
        $('edit-status').textContent = '変更あり（未保存）';
      } else if (data.type === 'cms-edit-end') {
        $('edit-status').textContent = '編集可能（未保存の変更あり）';
      } else if (data.type === 'cms-resize-start') {
        pushUndo();
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
