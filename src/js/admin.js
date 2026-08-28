/**
 * Reitansai CMS — full rewrite
 * 高速: iframe に親から直接バインド（postMessage 最小）
 * 右クリックメニュー / 複数選択 / 自動配置 / 素材 / 共同編集プレゼンス
 */
(function () {
  'use strict';

  var OWNER = 'r25347sh';
  var REPO = 'reitansai';
  var TOKEN = 'github_pat_11BXRNCFA0LjTsiJbrklH2_'+'TP6niw11mne8Gn8bv9pJNMVdMKGHFAP8Yj8TwHQrsRMTFMMLXIKdXXFGUoj';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents';
  var SITE = 'https://r25347sh.github.io/reitansai/';
  var SESSION = 'reitansai_user';
  var VARS = 'reitansai_cms_vars';
  var PRESENCE_PATH = 'src/cms/presence.json';

  var SEMINARS = [
    'ai','asobi','bungaku','bungei','digi','eizou','event','gogaku',
    'kagaku','kankou','kokusai','kyouiku','media','nougyou','syakai'
  ].map(function (s) { return 'pages/seminars/' + s + '.html'; });
  var ALL = ['index.html','map.html','admin.html','pages/takimura_t.html','pages/about_reitansai.html','pages/aboutThisSite.html'].concat(SEMINARS);

  var USERS = {
    noguchi: { password: 'qU7%kE9!J8s@', name: '野口先生', semi_name: 'AIゼミ', permissions: ['pages/seminars/ai.html'], advanced: true },
    akimoto: { password: 'uP6*ezCL9c3K', name: '秋元先生', semi_name: '教育ゼミ', permissions: ['pages/seminars/kyouiku.html'] },
    kondo: { password: 'tU5@nnVXMNNV', name: '近藤先生', semi_name: '国際地域', permissions: ['pages/seminars/kokusai.html'] },
    kato: { password: 'eW1%yabeDYwe', name: '加藤先生', semi_name: '文芸', permissions: ['pages/seminars/bungei.html'] },
    hirai: { password: 'qG4!Lu8hwq46', name: '平井先生', semi_name: '化学', permissions: ['pages/seminars/kagaku.html'] },
    takeuchi: { password: 'eS8!h&INcndP', name: '竹内先生', semi_name: '文学', permissions: ['pages/seminars/bungaku.html'] },
    sasaki: { password: 'nV2!H8eHgFf^', name: '佐々木先生', semi_name: 'メディア', permissions: ['pages/seminars/media.html'] },
    sudou: { password: 'sF0@Hk2hLahp', name: '須藤先生', semi_name: '社会', permissions: ['pages/seminars/syakai.html'] },
    shimokawa: { password: 'lQ4%mGnScp3#', name: '下川先生', semi_name: '農業', permissions: ['pages/seminars/nougyou.html'] },
    shibahara: { password: 'bC1&$&XMKxVD', name: '芝原先生', semi_name: '観光', permissions: ['pages/seminars/kankou.html'] },
    matsuya: { password: 'wV4#DvjlWCnp', name: '松谷先生', semi_name: '語学', permissions: ['pages/seminars/gogaku.html'] },
    matsumaru: { password: 'aS5@P@#vVy$5', name: '松丸先生', semi_name: '遊び', permissions: ['pages/seminars/asobi.html'] },
    mieta01: { password: 'xA7*GOYzR@3Y', name: 'ミエタ01', semi_name: '映像', permissions: ['pages/seminars/eizou.html'] },
    mieta02: { password: 'iD0*M5pLBV3*', name: 'ミエタ02', semi_name: 'デジタル', permissions: ['pages/seminars/digi.html'] },
    mieta03: { password: 'iZ0^NdIkDuf2', name: 'ミエタ03', semi_name: 'イベント', permissions: ['pages/seminars/event.html'] },
    takimura: { password: 'Tkm#2026$Forest!Myst9', name: '瀧村先生', semi_name: '全体', permissions: ['pages/takimura_t.html','pages/about_reitansai.html','pages/aboutThisSite.html'].concat(SEMINARS), advanced: true },
    r25347sh: { password: 'kes-2592', name: 'r25347sh', semi_name: '管理者', permissions: ALL.slice(), advanced: true, isAdmin: true }
  };

  var state = {
    user: null,
    path: null,
    cssPath: null,
    selected: [],
    undo: [],
    redo: [],
    clipboard: [],
    outline: false,
    regionMode: false,
    vars: {},
    presenceTimer: null,
    dirty: false
  };

  function $(id) { return document.getElementById(id); }
  function show(view) {
    ['view-login','view-dash','view-editor'].forEach(function (id) {
      var el = $(id); if (!el) return;
      el.classList.toggle('hidden', id !== view);
    });
  }
  function status(t) { var s = $('status'); if (s) s.textContent = t; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function nowStamp() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function todayJP() {
    var d = new Date();
    return d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日';
  }

  /* ---------- auth ---------- */
  function getSession() {
    try {
      var r = localStorage.getItem(SESSION) || sessionStorage.getItem(SESSION);
      return r ? JSON.parse(r) : null;
    } catch (e) { return null; }
  }
  function setSession(u) {
    var s = JSON.stringify(u);
    try { localStorage.setItem(SESSION, s); } catch (e) {}
    try { sessionStorage.setItem(SESSION, s); } catch (e) {}
  }
  function clearSession() {
    try { localStorage.removeItem(SESSION); } catch (e) {}
    try { sessionStorage.removeItem(SESSION); } catch (e) {}
  }
  function login() {
    var id = (($('uid') && $('uid').value) || '').trim().toLowerCase();
    var pw = ($('pw') && $('pw').value) || '';
    var u = USERS[id];
    var msg = $('login-msg');
    if (!u || String(u.password) !== String(pw)) {
      if (msg) msg.textContent = 'ID またはパスワードが違います';
      return;
    }
    var session = {
      id: id, name: u.name, semi_name: u.semi_name,
      permissions: u.permissions.slice(),
      advanced: !!u.advanced, isAdmin: !!u.isAdmin
    };
    state.user = session;
    setSession(session);
    openDash();
  }

  /* ---------- github ---------- */
  function headers() {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + TOKEN,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
  }
  function decode(c) { return decodeURIComponent(escape(atob(String(c).replace(/\n/g, '')))); }
  function encode(t) { return btoa(unescape(encodeURIComponent(t))); }
  function getFile(path) {
    return fetch(API + '/' + path + '?ref=main', { headers: headers() }).then(function (r) {
      if (!r.ok) throw new Error('GET ' + path + ' ' + r.status);
      return r.json();
    });
  }
  function putFile(path, content, message, sha) {
    var body = { message: message || 'CMS', content: encode(content), branch: 'main' };
    if (sha) body.sha = sha;
    return fetch(API + '/' + path, { method: 'PUT', headers: headers(), body: JSON.stringify(body) })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error('PUT ' + path + ' ' + r.status + ' ' + t); });
        return r.json();
      });
  }
  function putBinary(path, b64, message, sha) {
    var body = { message: message || 'upload', content: b64, branch: 'main' };
    if (sha) body.sha = sha;
    return fetch(API + '/' + path, { method: 'PUT', headers: headers(), body: JSON.stringify(body) })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error('PUT ' + path + ' ' + r.status + ' ' + t); });
        return r.json();
      });
  }
  function pathToCss(p) {
    if (p.indexOf('pages/seminars/') === 0) return p.replace('pages/seminars/', 'src/css/pages/seminars/').replace('.html', '.css');
    if (p.indexOf('pages/') === 0) return p.replace('pages/', 'src/css/pages/').replace('.html', '.css');
    if (p === 'index.html') return 'src/css/pages/index.css';
    if (p === 'map.html') return 'src/css/pages/map.css';
    return null;
  }
  function filesDir(p) {
    var b = p.replace(/\.html$/i, '');
    if (b.indexOf('pages/') === 0) b = b.slice(6);
    return 'src/files/pages/' + b;
  }
  function extractTitle(html) {
    var m = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return m ? m[1].replace(/\s+/g, ' ').trim() : '';
  }

  /* ---------- frame ---------- */
  function frame() { return $('frame'); }
  function doc() { var f = frame(); return f && f.contentDocument; }
  function win() { var f = frame(); return f && f.contentWindow; }

  function injectChrome(html, pagePath) {
    var dir = pagePath.indexOf('/') >= 0 ? pagePath.replace(/\/[^\/]*$/, '/') : '';
    var base = SITE + dir;
    var style = '<style id="cms-ui">.cms-sel{outline:2px solid #c9a227!important;outline-offset:2px}' +
      '.cms-sel-multi{outline:2px solid #6ec6ff!important;outline-offset:2px}' +
      'body.cms-outline *{outline:1px dashed rgba(201,162,39,.28)!important}' +
      '[data-cms-lock="1"]{outline-color:#ff8d8d!important}' +
      '</style>';
    if (/<head[^>]*>/i.test(html)) html = html.replace(/<head([^>]*)>/i, '<head$1><base href="' + base + '">' + style);
    else html = '<base href="' + base + '">' + style + html;
    html = html.replace(/<footer(\s[^>]*)?>/i, function (m) {
      return /data-cms-copyright/.test(m) ? m : m.replace('<footer', '<footer data-cms-copyright="1"');
    });
    return html;
  }

  function isProtected(el) {
    if (!el || !el.closest) return false;
    if (el.closest('[data-cms-lock="1"]')) return true;
    if (el.closest('[data-cms-copyright]')) return true;
    if (el.closest('footer')) {
      var t = (el.textContent || '');
      if (/©|copyright|コピーライト|著作権|all\s*rights/i.test(t)) return true;
    }
    return false;
  }
  function canEdit(el) {
    if (!el) return false;
    if (isProtected(el) && !(state.user && state.user.isAdmin)) return false;
    return true;
  }
  function cleanEmpty(el) {
    if (!el || !el.querySelectorAll) return;
    var bad = el.querySelectorAll('font:empty, span:empty, b:empty, i:empty, u:empty');
    for (var i = 0; i < bad.length; i++) {
      if (!bad[i].attributes.length) bad[i].remove();
    }
  }

  function clearSelClass() {
    var d = doc(); if (!d) return;
    d.querySelectorAll('.cms-sel,.cms-sel-multi').forEach(function (n) {
      n.classList.remove('cms-sel', 'cms-sel-multi');
    });
  }
  function setSelection(els, multi) {
    clearSelClass();
    state.selected = (els || []).filter(Boolean);
    state.selected.forEach(function (el, i) {
      el.classList.add(state.selected.length > 1 ? 'cms-sel-multi' : 'cms-sel');
    });
    updateStylePanel();
  }
  function updateStylePanel() {
    var el = state.selected[0];
    var info = $('sel-info');
    if (!el) {
      if (info) info.textContent = '未選択';
      return;
    }
    var cls = (el.className || '').toString().split(/\s+/).filter(function (c) {
      return c && c.indexOf('cms-sel') !== 0;
    }).slice(0, 3).join('.');
    if (info) {
      info.textContent = (state.selected.length > 1 ? ('複数 ' + state.selected.length + ' · ') : '') +
        el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '') +
        (isProtected(el) ? ' 🔒' : '');
    }
    if ($('p-text')) $('p-text').value = (el.innerText || '').trim().slice(0, 2500);
    if ($('p-href')) $('p-href').value = el.getAttribute('href') || '';
    if ($('a-class')) $('a-class').value = cls;
    if ($('a-id')) $('a-id').value = el.id || '';
    if ($('a-html')) $('a-html').value = el.outerHTML.slice(0, 10000);
    try {
      var cs = win().getComputedStyle(el);
      var m = String(cs.color).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m && $('p-color')) {
        function h(n){n=+n;var s=n.toString(16);return s.length===1?'0'+s:s;}
        $('p-color').value = '#' + h(m[1])+h(m[2])+h(m[3]);
      }
      var fs = parseInt(cs.fontSize, 10);
      if (fs && $('p-size')) { $('p-size').value = fs; $('p-size-v').textContent = fs; }
    } catch (e) {}
  }

  function snapshot() {
    var d = doc(); if (!d || !d.documentElement) return;
    state.undo.push(d.documentElement.outerHTML);
    if (state.undo.length > 40) state.undo.shift();
    state.redo = [];
    state.dirty = true;
  }
  function restore(html) {
    var f = frame();
    f.onload = function () { bindFrame(); };
    f.srcdoc = injectChrome('<!DOCTYPE html>' + html, state.path || 'index.html');
    state.selected = [];
  }
  function undo() {
    if (!state.undo.length) return;
    var d = doc();
    if (d && d.documentElement) state.redo.push(d.documentElement.outerHTML);
    restore(state.undo.pop());
    status('元に戻しました');
  }
  function redo() {
    if (!state.redo.length) return;
    var d = doc();
    if (d && d.documentElement) state.undo.push(d.documentElement.outerHTML);
    restore(state.redo.pop());
    status('やり直しました');
  }

  function pickTarget(e) {
    var t = e.target;
    if (!t || t === doc().body || t === doc().documentElement) return null;
    if (t.closest && t.closest('#cms-ui')) return null;
    return t;
  }

  function onFrameClick(e) {
    if (state.regionMode) return;
    var t = pickTarget(e);
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      var list = state.selected.slice();
      var i = list.indexOf(t);
      if (i >= 0) list.splice(i, 1); else list.push(t);
      setSelection(list, true);
    } else {
      setSelection([t], false);
    }
  }
  function onFrameContext(e) {
    e.preventDefault();
    e.stopPropagation();
    var t = pickTarget(e);
    if (t && state.selected.indexOf(t) < 0) setSelection([t], false);
    openCtx(e.clientX, e.clientY);
  }
  function onFrameDbl(e) {
    e.preventDefault();
    var t = pickTarget(e);
    if (!t || !canEdit(t)) return;
    snapshot();
    t.contentEditable = 'true';
    t.focus();
  }

  function bindFrame() {
    var d = doc(); if (!d) return;
    d.removeEventListener('click', onFrameClick, true);
    d.removeEventListener('contextmenu', onFrameContext, true);
    d.removeEventListener('dblclick', onFrameDbl, true);
    d.addEventListener('click', onFrameClick, true);
    d.addEventListener('contextmenu', onFrameContext, true);
    d.addEventListener('dblclick', onFrameDbl, true);
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (a) e.preventDefault();
    }, true);
    d.addEventListener('blur', function (e) {
      if (e.target && e.target.contentEditable === 'true') {
        e.target.contentEditable = 'false';
        cleanEmpty(e.target);
        status('文字編集を確定');
      }
    }, true);
    if (state.outline && d.body) d.body.classList.add('cms-outline');
  }

  /* ---------- ctx menu ---------- */
  function openCtx(x, y) {
    var menu = $('ctx'); if (!menu) return;
    menu.classList.remove('hidden');
    var w = menu.offsetWidth, h = menu.offsetHeight;
    menu.style.left = Math.min(x, window.innerWidth - w - 8) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - h - 8) + 'px';
  }
  function closeCtx() { var m = $('ctx'); if (m) m.classList.add('hidden'); }

  function zChange(mode) {
    var el = state.selected[0]; if (!el || !canEdit(el)) return;
    snapshot();
    var z = parseInt(win().getComputedStyle(el).zIndex, 10);
    if (isNaN(z)) z = 0;
    if (mode === 'front') z = 9999;
    else if (mode === 'back') z = 0;
    else if (mode === 'forward') z += 1;
    else if (mode === 'backward') z = Math.max(0, z - 1);
    el.style.position = el.style.position || 'relative';
    el.style.zIndex = String(z);
    status('重なり順を変更');
  }

  function doDelete() {
    if (!state.selected.length) return;
    snapshot();
    state.selected.forEach(function (el) {
      if (canEdit(el) && el.parentNode) el.parentNode.removeChild(el);
    });
    setSelection([], false);
    status('削除');
  }
  function doCopy() {
    state.clipboard = state.selected.filter(canEdit).map(function (el) {
      var c = el.cloneNode(true);
      c.classList.remove('cms-sel', 'cms-sel-multi');
      return c.outerHTML;
    });
    status('コピー (' + state.clipboard.length + ')');
  }
  function doCut() { doCopy(); doDelete(); }
  function doPaste() {
    if (!state.clipboard.length) return;
    var d = doc(); if (!d) return;
    snapshot();
    var parent = (state.selected[0] && state.selected[0].parentNode) || d.body;
    var created = [];
    state.clipboard.forEach(function (html) {
      var wrap = d.createElement('div');
      wrap.innerHTML = html;
      var node = wrap.firstElementChild;
      if (node) { parent.appendChild(node); autoNudge(node); created.push(node); }
    });
    setSelection(created, created.length > 1);
    status('貼り付け');
  }
  function doDup() {
    doCopy(); doPaste();
  }

  function autoNudge(el) {
    if (!el || !el.style) return;
    // soft spacing so new blocks don't stick to previous
    var cs = win().getComputedStyle(el);
    if (cs.display !== 'inline' && !el.style.marginTop) el.style.marginTop = '0.75rem';
  }

  /* ---------- add blocks ---------- */
  function insertNear(node) {
    var d = doc(); if (!d) return;
    snapshot();
    var anchor = state.selected[0];
    var parent = d.body;
    if (anchor && anchor.parentNode) {
      if (anchor.tagName === 'IMG' || anchor.tagName === 'BR') parent = anchor.parentNode;
      else parent = anchor.parentNode;
      parent.insertBefore(node, anchor.nextSibling);
    } else {
      parent.appendChild(node);
    }
    autoNudge(node);
    setSelection([node], false);
    status('追加');
  }
  function addBlock(type) {
    var d = doc(); if (!d) return;
    var el;
    if (type === 'h2') { el = d.createElement('h2'); el.textContent = '新しい見出し'; el.style.color = '#f0d060'; }
    else if (type === 'p') { el = d.createElement('p'); el.textContent = 'テキストを入力'; }
    else if (type === 'btn') {
      el = d.createElement('a'); el.href = '#'; el.textContent = 'ボタン';
      el.style.cssText = 'display:inline-block;padding:.55rem 1.1rem;border-radius:999px;background:#c9a227;color:#1a1205;text-decoration:none;font-weight:700;';
    } else if (type === 'a') { el = d.createElement('a'); el.href = '#'; el.textContent = 'リンク'; el.style.color = '#f0d060'; }
    else if (type === 'img') {
      var url = prompt('画像URL'); if (!url) return;
      el = d.createElement('img'); el.src = url; el.alt = ''; el.style.maxWidth = '100%';
    } else if (type === 'box') {
      el = d.createElement('div');
      el.style.cssText = 'padding:1rem;border:1px solid rgba(201,162,39,.35);border-radius:12px;';
      el.innerHTML = '<p>ボックス</p>';
    } else if (type === 'card') {
      el = d.createElement('div');
      el.style.cssText = 'padding:1.1rem;border-radius:14px;background:rgba(0,0,0,.28);border:1px solid rgba(201,162,39,.28);';
      el.innerHTML = '<h3 style="margin-top:0;color:#f0d060">カード</h3><p>説明</p>';
    } else if (type === 'ul') { el = d.createElement('ul'); el.innerHTML = '<li>項目1</li><li>項目2</li>'; }
    else if (type === 'hr') { el = d.createElement('hr'); el.style.border = 'none'; el.style.borderTop = '1px solid rgba(201,162,39,.3)'; }
    else if (type === 'spacer') { el = d.createElement('div'); el.style.height = '40px'; el.setAttribute('aria-hidden','true'); }
    else if (type === 'cols') {
      el = d.createElement('div');
      el.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1rem;';
      el.setAttribute('data-cms-group', '1');
      el.innerHTML = '<div style="padding:.8rem;border:1px dashed rgba(201,162,39,.35);border-radius:8px"><p>左</p></div><div style="padding:.8rem;border:1px dashed rgba(201,162,39,.35);border-radius:8px"><p>右</p></div>';
    } else if (type === 'date') { el = d.createElement('span'); el.textContent = '{{date}}'; el.style.color = '#f0d060'; }
    if (el) insertNear(el);
  }

  /* ---------- layout ---------- */
  function layoutRow() {
    if (state.selected.length < 2) return status('複数選択してください');
    snapshot();
    var parent = state.selected[0].parentNode;
    var wrap = doc().createElement('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;align-items:stretch;';
    wrap.setAttribute('data-cms-group', '1');
    state.selected.forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
      el.style.flex = '1 1 180px';
      wrap.appendChild(el);
    });
    parent.appendChild(wrap);
    setSelection([wrap], false);
    status('横並び均等');
  }
  function layoutCol() {
    if (state.selected.length < 2) return status('複数選択してください');
    snapshot();
    var parent = state.selected[0].parentNode;
    var wrap = doc().createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;';
    wrap.setAttribute('data-cms-group', '1');
    state.selected.forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
      wrap.appendChild(el);
    });
    parent.appendChild(wrap);
    setSelection([wrap], false);
    status('縦並び均等');
  }
  function layoutFitW() {
    if (!state.selected.length) return;
    snapshot();
    state.selected.forEach(function (el) {
      if (!canEdit(el)) return;
      el.style.width = '100%';
      el.style.maxWidth = '100%';
      el.style.boxSizing = 'border-box';
    });
    status('横幅フィット');
  }
  function layoutGroup() {
    if (state.selected.length < 2) return status('複数選択してください');
    snapshot();
    var parent = state.selected[0].parentNode;
    var wrap = doc().createElement('div');
    wrap.setAttribute('data-cms-group', '1');
    wrap.style.cssText = 'display:grid;gap:10px;';
    state.selected.forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
      wrap.appendChild(el);
    });
    parent.appendChild(wrap);
    setSelection([wrap], false);
    status('グループ化');
  }
  function layoutUngroup() {
    var el = state.selected[0];
    if (!el || el.getAttribute('data-cms-group') !== '1') return status('グループを選択');
    snapshot();
    var parent = el.parentNode;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
    setSelection([], false);
    status('グループ解除');
  }
  function startRegionLayout() {
    state.regionMode = true;
    var mask = $('region-mask');
    mask.classList.remove('hidden');
    mask.innerHTML = '';
    status('範囲をドラッグして指定 → マウスアップで配置');
    var box = null, sx = 0, sy = 0;
    function pos(e) {
      var r = mask.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function onDown(e) {
      var p = pos(e); sx = p.x; sy = p.y;
      box = document.createElement('div');
      box.className = 'region-box';
      box.style.left = sx + 'px'; box.style.top = sy + 'px';
      box.style.width = '0'; box.style.height = '0';
      mask.appendChild(box);
    }
    function onMove(e) {
      if (!box) return;
      var p = pos(e);
      var x = Math.min(sx, p.x), y = Math.min(sy, p.y);
      var w = Math.abs(p.x - sx), h = Math.abs(p.y - sy);
      box.style.left = x + 'px'; box.style.top = y + 'px';
      box.style.width = w + 'px'; box.style.height = h + 'px';
    }
    function onUp() {
      mask.removeEventListener('mousedown', onDown);
      mask.removeEventListener('mousemove', onMove);
      mask.removeEventListener('mouseup', onUp);
      if (!box) { endRegion(); return; }
      var x = parseFloat(box.style.left), y = parseFloat(box.style.top);
      var w = parseFloat(box.style.width), h = parseFloat(box.style.height);
      endRegion();
      applyRegionLayout(x, y, w, h);
    }
    mask.addEventListener('mousedown', onDown);
    mask.addEventListener('mousemove', onMove);
    mask.addEventListener('mouseup', onUp);
  }
  function endRegion() {
    state.regionMode = false;
    var mask = $('region-mask');
    mask.classList.add('hidden');
    mask.innerHTML = '';
  }
  function applyRegionLayout(x, y, w, h) {
    var targets = state.selected.length ? state.selected.slice() : Array.prototype.slice.call(doc().body.children);
    targets = targets.filter(canEdit);
    if (!targets.length || w < 20 || h < 20) return status('範囲または要素が不足');
    snapshot();
    // visual robot: simple responsive grid packing
    var n = targets.length;
    var cols = Math.max(1, Math.round(Math.sqrt(n * (w / Math.max(h, 1)))));
    cols = Math.min(cols, n);
    var gap = 12;
    var cellW = (w - gap * (cols - 1)) / cols;
    var rows = Math.ceil(n / cols);
    var cellH = (h - gap * (rows - 1)) / rows;
    targets.forEach(function (el, i) {
      var c = i % cols, r = Math.floor(i / cols);
      el.style.position = 'relative';
      el.style.boxSizing = 'border-box';
      el.style.width = Math.max(40, cellW) + 'px';
      el.style.maxWidth = '100%';
      el.style.margin = gap / 2 + 'px';
      el.style.padding = el.style.padding || '0.5rem';
    });
    // wrap into grid container for stability
    var parent = targets[0].parentNode || doc().body;
    var wrap = doc().createElement('div');
    wrap.setAttribute('data-cms-group', '1');
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:' + gap + 'px;width:100%;';
    targets.forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
      el.style.width = '';
      el.style.margin = '';
      wrap.appendChild(el);
    });
    parent.appendChild(wrap);
    setSelection([wrap], false);
    status('範囲内に自動配置（' + cols + '列）');
  }

  /* ---------- meta / theme ---------- */
  function applyMeta() {
    var d = doc(); if (!d || !d.head) return;
    snapshot();
    var title = ($('m-title') && $('m-title').value) || '';
    if (d.querySelector('title')) d.querySelector('title').textContent = title;
    else { var t = d.createElement('title'); t.textContent = title; d.head.appendChild(t); }
    if ($('ed-title')) $('ed-title').textContent = title || '—';
    function setName(n, v) {
      var el = d.querySelector('meta[name="' + n + '"]');
      if (!v) { if (el) el.remove(); return; }
      if (!el) { el = d.createElement('meta'); el.setAttribute('name', n); d.head.appendChild(el); }
      el.setAttribute('content', v);
    }
    function setProp(p, v) {
      var el = d.querySelector('meta[property="' + p + '"]');
      if (!v) { if (el) el.remove(); return; }
      if (!el) { el = d.createElement('meta'); el.setAttribute('property', p); d.head.appendChild(el); }
      el.setAttribute('content', v);
    }
    setName('description', ($('m-desc') && $('m-desc').value) || '');
    setName('author', ($('m-author') && $('m-author').value) || '');
    setName('robots', ($('m-robots') && $('m-robots').value) || '');
    setProp('og:title', title);
    setProp('og:image', ($('m-og') && $('m-og').value) || '');
    var fav = ($('m-icon') && $('m-icon').value) || '';
    var icon = d.querySelector('link[rel="icon"]');
    if (!fav) { if (icon) icon.remove(); }
    else {
      if (!icon) { icon = d.createElement('link'); icon.rel = 'icon'; d.head.appendChild(icon); }
      icon.href = fav;
    }
    status('メタ反映');
  }
  function applyTheme() {
    var d = doc(); if (!d) return;
    snapshot();
    var bg = $('t-bg').value, text = $('t-text').value, accent = $('t-accent').value, card = $('t-card').value;
    var st = d.getElementById('cms-theme');
    if (!st) { st = d.createElement('style'); st.id = 'cms-theme'; d.head.appendChild(st); }
    st.textContent =
      ':root{--bg:' + bg + ';--text:' + text + ';--gold:' + accent + ';--card:' + card + ';}' +
      'html,body{background:' + bg + '!important;color:' + text + '!important;}' +
      'a{color:' + accent + ';}' +
      '.card,.seminar-card,section,article{background-color:' + card + ';}';
    if (d.body) {
      d.body.style.setProperty('background', bg, 'important');
      d.body.style.setProperty('color', text, 'important');
    }
    status('テーマ適用');
  }
  function resetTheme() {
    var d = doc(); if (!d) return;
    snapshot();
    var st = d.getElementById('cms-theme'); if (st) st.remove();
    if (d.body) { d.body.style.background = ''; d.body.style.color = ''; }
    status('テーマ解除');
  }

  function expandVars(html) {
    var map = {
      date: todayJP(),
      year: String(new Date().getFullYear()),
      user: (state.user && (state.user.name || state.user.id)) || '',
      page: state.path || ''
    };
    Object.keys(state.vars || {}).forEach(function (k) { map[k] = state.vars[k]; });
    return html.replace(/\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g, function (_, k) {
      return map.hasOwnProperty(k) ? String(map[k]) : '{{' + k + '}}';
    });
  }

  function exportHtml() {
    var d = doc(); if (!d) throw new Error('no doc');
    applyMetaQuiet(d);
    var clone = d.documentElement.cloneNode(true);
    clone.querySelectorAll('#cms-ui,#cms-theme,base').forEach(function (n) { n.remove(); });
    clone.querySelectorAll('.cms-sel,.cms-sel-multi').forEach(function (n) {
      n.classList.remove('cms-sel', 'cms-sel-multi');
    });
    if (clone.body) clone.body.classList.remove('cms-outline');
    clone.querySelectorAll('[contenteditable]').forEach(function (n) { n.removeAttribute('contenteditable'); });
    // strip empty formatting tags
    clone.querySelectorAll('span,b,i,u,font').forEach(function (n) {
      if (!n.textContent && !n.children.length) n.remove();
    });
    return expandVars('<!DOCTYPE html>\n' + clone.outerHTML);
  }
  function applyMetaQuiet(d) {
    // already applied via fields when user presses button; on save re-apply current fields
    if (!$('m-title')) return;
    var title = $('m-title').value || '';
    if (d.querySelector('title')) d.querySelector('title').textContent = title;
  }

  function save() {
    if (!state.path || !state.user) return;
    status('保存中…');
    var htmlOut;
    try { htmlOut = exportHtml(); } catch (e) { status('保存失敗: ' + e.message); return; }
    var msg = ($('commit-msg') && $('commit-msg').value.trim()) || ('CMS: ' + state.path);
    var cssExtra = ($('t-css') && $('t-css').value) || '';

    getFile(state.path).then(function (f) {
      return putFile(state.path, htmlOut, msg, f.sha);
    }).then(function () {
      if (!state.cssPath) return null;
      return getFile(state.cssPath).then(function (cf) {
        var css = decode(cf.content);
        if (css.indexOf('teacher-custom-css-start') >= 0) {
          css = css.replace(/\/\* --- teacher-custom-css-start --- \*\/[\s\S]*?\/\* --- teacher-custom-css-end --- \*\//,
            '/* --- teacher-custom-css-start --- */\n' + cssExtra + '\n/* --- teacher-custom-css-end --- */');
        } else {
          css += '\n/* --- teacher-custom-css-start --- */\n' + cssExtra + '\n/* --- teacher-custom-css-end --- */\n';
        }
        return putFile(state.cssPath, css, msg, cf.sha);
      }).catch(function () {
        return putFile(state.cssPath, '/* page */\n/* --- teacher-custom-css-start --- */\n' + cssExtra + '\n/* --- teacher-custom-css-end --- */\n', msg, null);
      });
    }).then(function () {
      var line = '[' + nowStamp() + '] ' + (state.user.name || state.user.id) + ' | ' + state.path + ' | ' + msg + '\n';
      return getFile('src/log.txt').then(function (lf) {
        var prev = ''; try { prev = decode(lf.content); } catch (e) {}
        if (prev && prev.slice(-1) !== '\n') prev += '\n';
        return putFile('src/log.txt', prev + line, 'log: ' + state.path, lf.sha);
      }).catch(function () {
        return putFile('src/log.txt', '# log\n' + line, 'log', null);
      });
    }).then(function () {
      state.dirty = false;
      status('保存完了 ✓');
      beatPresence(true);
    }).catch(function (err) {
      status('保存失敗: ' + err.message);
    });
  }

  /* ---------- presence (lightweight collab) ---------- */
  function beatPresence(force) {
    if (!state.user) return Promise.resolve();
    var entry = {
      id: state.user.id,
      name: state.user.name || state.user.id,
      path: state.path || '',
      at: Date.now()
    };
    return getFile(PRESENCE_PATH).then(function (f) {
      var list = [];
      try { list = JSON.parse(decode(f.content)); } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
      var now = Date.now();
      list = list.filter(function (x) { return x && x.at && (now - x.at) < 60000 && x.id !== entry.id; });
      list.push(entry);
      return putFile(PRESENCE_PATH, JSON.stringify(list, null, 2), 'presence', f.sha).then(function () {
        renderPresence(list);
      });
    }).catch(function () {
      return putFile(PRESENCE_PATH, JSON.stringify([entry], null, 2), 'presence', null).then(function () {
        renderPresence([entry]);
      });
    }).catch(function () { /* ignore presence failures */ });
  }
  function renderPresence(list) {
    var board = $('presence-board');
    var pills = $('collab-pills');
    var others = (list || []).filter(function (x) {
      return x && state.user && x.id !== state.user.id && (Date.now() - x.at) < 60000;
    });
    if (board) {
      if (!others.length) board.classList.add('hidden');
      else {
        board.classList.remove('hidden');
        board.textContent = '編集中: ' + others.map(function (x) {
          return x.name + (x.path ? (' @ ' + x.path) : '');
        }).join(' · ');
      }
    }
    if (pills) {
      pills.innerHTML = '';
      others.filter(function (x) { return x.path === state.path; }).forEach(function (x) {
        var s = document.createElement('span');
        s.className = 'collab-pill';
        s.textContent = x.name + ' が編集中';
        pills.appendChild(s);
      });
    }
  }

  /* ---------- assets ---------- */
  function loadAssets() {
    var list = $('asset-list'); if (!list || !state.path) return;
    list.innerHTML = '<p class="hint">読み込み中…</p>';
    var dir = filesDir(state.path);
    if ($('asset-dir')) $('asset-dir').textContent = dir + '/';
    fetch(API + '/' + dir + '?ref=main', { headers: headers() }).then(function (r) {
      if (r.status === 404) { list.innerHTML = '<p class="hint">まだ素材がありません</p>'; return null; }
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }).then(function (items) {
      if (!items) return;
      if (!Array.isArray(items) || !items.length) {
        list.innerHTML = '<p class="hint">まだ素材がありません</p>';
        return;
      }
      list.innerHTML = '';
      items.filter(function (it) { return it.type === 'file'; }).forEach(function (it) {
        var row = document.createElement('div');
        row.className = 'asset-item';
        var url = SITE + it.path;
        row.innerHTML = '<img alt=""><div style="min-width:0;flex:1"><div class="mono" style="font-size:11px;word-break:break-all"></div></div>';
        row.querySelector('img').src = url;
        row.querySelector('.mono').textContent = it.name;
        var use = document.createElement('button');
        use.type = 'button'; use.className = 'btn ghost'; use.textContent = '使う';
        use.onclick = function () {
          var d = doc(); if (!d) return;
          snapshot();
          var img = d.createElement('img');
          img.src = url; img.alt = it.name; img.style.maxWidth = '100%';
          insertNear(img);
        };
        row.appendChild(use);
        list.appendChild(row);
      });
    }).catch(function () {
      list.innerHTML = '<p class="hint">素材フォルダを取得できませんでした</p>';
    });
  }
  function uploadAsset() {
    var input = $('asset-file');
    if (!input || !input.files || !input.files[0] || !state.path) return;
    var file = input.files[0];
    var dir = filesDir(state.path);
    var name = file.name.replace(/[^a-zA-Z0-9._\-]/g, '_');
    var path = dir + '/' + name;
    $('asset-msg').textContent = 'アップロード中…';
    var reader = new FileReader();
    reader.onload = function () {
      var b64 = String(reader.result).split(',')[1];
      getFile(path).then(function (f) {
        return putBinary(path, b64, 'upload ' + path, f.sha);
      }).catch(function () {
        return putBinary(path, b64, 'upload ' + path, null);
      }).then(function () {
        $('asset-msg').textContent = '完了';
        loadAssets();
      }).catch(function (e) {
        $('asset-msg').textContent = '失敗: ' + e.message;
      });
    };
    reader.readAsDataURL(file);
  }

  /* ---------- open views ---------- */
  function openDash() {
    show('view-dash');
    if ($('dash-user') && state.user) {
      $('dash-user').textContent = (state.user.name || state.user.id) + ' · ' + (state.user.semi_name || '');
    }
    var grid = $('page-grid');
    var st = $('dash-status');
    grid.innerHTML = '';
    st.textContent = '読み込み中…';
    var perms = (state.user && state.user.permissions) || [];
    Promise.all(perms.map(function (p) {
      return getFile(p).then(function (f) {
        return { path: p, title: extractTitle(decode(f.content)) || p };
      }).catch(function () { return { path: p, title: p }; });
    })).then(function (items) {
      st.textContent = items.length ? '' : '編集可能なページがありません';
      items.forEach(function (it) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'page-card';
        b.innerHTML = '<span class="t"></span><span class="p mono"></span>';
        b.querySelector('.t').textContent = it.title;
        b.querySelector('.p').textContent = it.path;
        b.onclick = function () { openEditor(it.path); };
        grid.appendChild(b);
      });
    });
    beatPresence();
  }

  function openEditor(path) {
    state.path = path;
    state.cssPath = pathToCss(path);
    state.selected = [];
    state.undo = [];
    state.redo = [];
    show('view-editor');
    if ($('ed-path')) $('ed-path').textContent = path;
    if ($('ed-title')) $('ed-title').textContent = '読み込み中…';
    status('読み込み中…');
    getFile(path).then(function (f) {
      var html = decode(f.content);
      var title = extractTitle(html);
      if ($('ed-title')) $('ed-title').textContent = title || path;
      // meta fields
      try {
        var tmp = new DOMParser().parseFromString(html, 'text/html');
        if ($('m-title')) $('m-title').value = title || '';
        var md = tmp.querySelector('meta[name="description"]');
        if ($('m-desc')) $('m-desc').value = md ? md.content : '';
        var ma = tmp.querySelector('meta[name="author"]');
        if ($('m-author')) $('m-author').value = ma ? ma.content : '';
        var ic = tmp.querySelector('link[rel="icon"]');
        if ($('m-icon')) $('m-icon').value = ic ? ic.getAttribute('href') : '';
        var og = tmp.querySelector('meta[property="og:image"]');
        if ($('m-og')) $('m-og').value = og ? og.content : '';
      } catch (e) {}
      var fEl = frame();
      fEl.onload = function () { bindFrame(); status('編集可能 · 右クリックでメニュー'); };
      fEl.srcdoc = injectChrome(html, path);
      if (state.cssPath) {
        getFile(state.cssPath).then(function (cf) {
          var css = decode(cf.content);
          var m = css.match(/\/\* --- teacher-custom-css-start --- \*\/([\s\S]*?)\/\* --- teacher-custom-css-end --- \*\//);
          if ($('t-css')) $('t-css').value = m ? m[1].trim() : '';
        }).catch(function () { if ($('t-css')) $('t-css').value = ''; });
      }
      loadAssets();
      beatPresence();
    }).catch(function (e) {
      status('読込失敗: ' + e.message);
    });
  }

  function applyStyle() {
    if (!state.selected.length) return;
    snapshot();
    state.selected.forEach(function (el) {
      if (!canEdit(el)) return;
      var text = $('p-text').value;
      if (text !== '' && (el.childElementCount === 0 || /^(H1|H2|H3|H4|P|SPAN|A|BUTTON|LI)$/.test(el.tagName))) {
        el.textContent = text;
      }
      el.style.color = $('p-color').value;
      el.style.backgroundColor = $('p-bg').value;
      el.style.fontSize = $('p-size').value + 'px';
      if ($('p-weight').value) el.style.fontWeight = $('p-weight').value;
      if ($('p-align').value) el.style.textAlign = $('p-align').value;
      if (el.tagName === 'A' && $('p-href').value) el.setAttribute('href', $('p-href').value);
    });
    status('スタイル適用');
  }

  /* ---------- boot ---------- */
  function boot() {
    try { state.vars = JSON.parse(localStorage.getItem(VARS) || '{}') || {}; } catch (e) { state.vars = {}; }

    var s = getSession();
    if (s && s.id) { state.user = s; openDash(); }
    else show('view-login');

    if ($('btn-login')) $('btn-login').onclick = login;
    ['uid','pw'].forEach(function (id) {
      if ($(id)) $(id).addEventListener('keydown', function (e) {
        if (e.key === 'Enter') login();
      });
    });
    if ($('btn-logout')) $('btn-logout').onclick = function () {
      clearSession(); state.user = null; show('view-login');
    };
    if ($('btn-back')) $('btn-back').onclick = function () { openDash(); };
    if ($('btn-save')) $('btn-save').onclick = save;
    if ($('btn-undo')) $('btn-undo').onclick = undo;
    if ($('btn-redo')) $('btn-redo').onclick = redo;
    if ($('btn-outline')) $('btn-outline').onclick = function () {
      state.outline = !state.outline;
      var d = doc(); if (d && d.body) d.body.classList.toggle('cms-outline', state.outline);
    };
    if ($('btn-apply-style')) $('btn-apply-style').onclick = applyStyle;
    if ($('btn-meta')) $('btn-meta').onclick = applyMeta;
    if ($('btn-theme')) $('btn-theme').onclick = applyTheme;
    if ($('btn-theme-reset')) $('btn-theme-reset').onclick = resetTheme;
    if ($('btn-upload')) $('btn-upload').onclick = uploadAsset;
    if ($('p-size')) $('p-size').oninput = function () { $('p-size-v').textContent = this.value; };

    document.querySelectorAll('.rail-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.rail-tab').forEach(function (t) { t.classList.remove('on'); });
        tab.classList.add('on');
        var name = tab.getAttribute('data-tab');
        document.querySelectorAll('.rail-panel').forEach(function (p) {
          p.classList.toggle('hidden', p.getAttribute('data-panel') !== name);
        });
        if (name === 'assets') loadAssets();
      });
    });
    document.querySelectorAll('#device-seg .seg-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('#device-seg .seg-btn').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        $('stage').className = 'stage device-' + b.getAttribute('data-device');
      });
    });
    document.querySelectorAll('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () { addBlock(b.getAttribute('data-add')); });
    });
    document.querySelectorAll('[data-cmd]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = doc(); if (!d) return;
        snapshot();
        d.execCommand(b.getAttribute('data-cmd'), false, null);
      });
    });
    document.querySelectorAll('[data-var]').forEach(function (b) {
      b.addEventListener('click', function () {
        var el = state.selected[0];
        if (el && canEdit(el)) { snapshot(); el.textContent = (el.textContent || '') + b.getAttribute('data-var'); }
      });
    });
    if ($('btn-var-add')) $('btn-var-add').onclick = function () {
      var k = (($('v-key') && $('v-key').value) || '').trim().replace(/[^a-zA-Z0-9_\-]/g, '');
      var v = ($('v-val') && $('v-val').value) || '';
      if (!k) return;
      state.vars[k] = v;
      try { localStorage.setItem(VARS, JSON.stringify(state.vars)); } catch (e) {}
      status('変数を保存');
    };

    if ($('lay-row')) $('lay-row').onclick = layoutRow;
    if ($('lay-col')) $('lay-col').onclick = layoutCol;
    if ($('lay-fit-w')) $('lay-fit-w').onclick = layoutFitW;
    if ($('lay-group')) $('lay-group').onclick = layoutGroup;
    if ($('lay-ungroup')) $('lay-ungroup').onclick = layoutUngroup;
    if ($('lay-region')) $('lay-region').onclick = startRegionLayout;

    if ($('btn-adv')) $('btn-adv').onclick = function () {
      var el = state.selected[0]; if (!el || !canEdit(el)) return;
      snapshot();
      if ($('a-id').value) el.id = $('a-id').value;
      if ($('a-class').value) el.className = $('a-class').value;
      if ($('a-z').value !== '') { el.style.position = el.style.position || 'relative'; el.style.zIndex = $('a-z').value; }
      var raw = $('a-html').value;
      if (raw && el.parentNode) {
        var w = doc().createElement('div'); w.innerHTML = raw;
        var n = w.firstElementChild;
        if (n) { el.parentNode.replaceChild(n, el); setSelection([n], false); }
      }
      status('上級設定適用');
    };
    if ($('btn-lock')) $('btn-lock').onclick = function () {
      if (!(state.user && state.user.isAdmin)) return status('管理者のみ');
      var el = state.selected[0]; if (!el) return;
      snapshot(); el.setAttribute('data-cms-lock', '1'); status('保護');
    };
    if ($('btn-unlock')) $('btn-unlock').onclick = function () {
      if (!(state.user && state.user.isAdmin)) return status('管理者のみ');
      var el = state.selected[0]; if (!el) return;
      snapshot(); el.removeAttribute('data-cms-lock'); status('保護解除');
    };

    document.querySelectorAll('#ctx [data-ctx]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-ctx');
        closeCtx();
        if (act === 'edit') {
          var el = state.selected[0]; if (el && canEdit(el)) { snapshot(); el.contentEditable = 'true'; el.focus(); }
        } else if (act === 'copy') doCopy();
        else if (act === 'cut') doCut();
        else if (act === 'paste') doPaste();
        else if (act === 'dup') doDup();
        else if (act === 'delete') doDelete();
        else if (act === 'front' || act === 'back' || act === 'forward' || act === 'backward') zChange(act);
        else if (act === 'group') layoutGroup();
        else if (act === 'lock') {
          if (state.user && state.user.isAdmin && state.selected[0]) {
            snapshot(); state.selected[0].setAttribute('data-cms-lock', '1'); status('保護');
          }
        }
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('#ctx')) closeCtx();
    });

    window.addEventListener('keydown', function (e) {
      var mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      var k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (k === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      else if (k === 'y') { e.preventDefault(); redo(); }
      else if (k === 's') { e.preventDefault(); save(); }
      else if (k === 'c') { e.preventDefault(); doCopy(); }
      else if (k === 'x') { e.preventDefault(); doCut(); }
      else if (k === 'v') { e.preventDefault(); doPaste(); }
      else if (k === 'a') {
        e.preventDefault();
        var d = doc(); if (!d) return;
        var all = Array.prototype.slice.call(d.body.querySelectorAll('h1,h2,h3,p,a,img,div,section,article,li,button')).filter(canEdit).slice(0, 50);
        setSelection(all, true);
      }
    });

    state.presenceTimer = setInterval(function () {
      if (state.user) beatPresence();
    }, 20000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
