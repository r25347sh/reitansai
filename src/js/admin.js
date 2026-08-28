/**
 * Reitansai CMS — 確実ログイン版
 * 認証は BUILTIN_USERS（JS内完結・通信不要）
 * form を使わず button#login-btn の click のみ（リロード防止）
 */
(function () {
  'use strict';

  var SESSION_KEY = 'reitansai_user';
  var GITHUB_OWNER = 'r25347sh';
  var GITHUB_REPO = 'reitansai';
  var GITHUB_TOKEN =
    'github_pat_11BXRNCFA0EVBbGiXBnXgp_' +
    'rHoCChQCXXzyvyk2ox1l9RMI3xtQRwRmqUHVNAiAEsjWFWDH6TVCdEu2Pjo';
  var API =
    'https://api.github.com/repos/' +
    GITHUB_OWNER +
    '/' +
    GITHUB_REPO +
    '/contents';

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

  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
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

  function $(id) {
    return document.getElementById(id);
  }

  function setVisible(el, on) {
    if (!el) return;
    if (on) {
      el.classList.remove('hidden');
      el.style.display = 'block';
      el.removeAttribute('hidden');
    } else {
      el.classList.add('hidden');
      el.style.display = 'none';
    }
  }

  function showView(name) {
    setVisible($('login-view'), name === 'login');
    setVisible($('dash-view'), name === 'dash');
    setVisible($('edit-view'), name === 'edit');
  }

  function mountHeader(user) {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var old = header.querySelector('.header-auth');
    if (old) old.parentNode.removeChild(old);
    var box = document.createElement('div');
    box.className = 'header-auth';
    if (user) {
      box.innerHTML =
        '<span class="auth-name">' +
        (user.name || user.id) +
        '</span>' +
        '<span class="auth-btn auth-cms">ログイン中</span>' +
        '<button type="button" class="auth-btn auth-out" id="header-logout">ログアウト</button>';
      header.appendChild(box);
      var btn = document.getElementById('header-logout');
      if (btn) {
        btn.onclick = function () {
          clearSession();
          location.reload();
        };
      }
    } else {
      box.innerHTML = '<span class="auth-name">未ログイン</span>';
      header.appendChild(box);
    }
  }

  function enterDash(user) {
    var label = $('user-label');
    var list = $('perm-list');
    if (label) {
      label.textContent = (user.name || user.id) + '（' + (user.semi_name || '') + '）';
    }
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
            b.textContent = p;
            b.onclick = function () {
              openEditor(user, p);
            };
            li.appendChild(b);
            list.appendChild(li);
          })(perms[i]);
        }
      }
    }
    showView('dash');
    mountHeader(user);
    var banner = $('auth-banner');
    if (banner) {
      banner.style.display = 'block';
      banner.textContent =
        'ログイン中: ' + (user.name || user.id) + ' · 権限 ' + (user.permissions || []).length + ' 件';
    }
  }

  function tryLogin(id, pw) {
    var u = BUILTIN_USERS[id];
    if (!u) return null;
    if (String(u.password) !== String(pw)) return null;
    return {
      id: id,
      name: u.name,
      semi_name: u.semi_name,
      permissions: u.permissions.slice()
    };
  }

  function doLogin() {
    var errEl = $('login-error');
    var st = $('login-status');
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

  function getFile(path) {
    return fetch(API + '/' + path + '?ref=main', { headers: ghHeaders() }).then(function (res) {
      if (!res.ok) throw new Error('GET ' + path + ': ' + res.status);
      return res.json();
    });
  }

  function putFile(path, content, message, sha) {
    var body = {
      message: message || '2026/08/28の変更',
      content: btoa(unescape(encodeURIComponent(content))),
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

  function pathToCss(htmlPath) {
    if (htmlPath.indexOf('pages/seminars/') === 0)
      return htmlPath.replace('pages/seminars/', 'src/css/pages/seminars/').replace('.html', '.css');
    if (htmlPath.indexOf('pages/') === 0)
      return htmlPath.replace('pages/', 'src/css/pages/').replace('.html', '.css');
    if (htmlPath === 'index.html') return 'src/css/pages/index.css';
    if (htmlPath === 'map.html') return 'src/css/pages/map.css';
    return null;
  }

  function openEditor(user, htmlPath) {
    showView('edit');
    $('edit-path').textContent = htmlPath;
    var frame = $('edit-frame');
    var status = $('edit-status');
    status.textContent = '読み込み中…';
    getFile(htmlPath)
      .then(function (file) {
        var html = decodeContent(file.content);
        frame.setAttribute('data-sha', file.sha);
        frame.setAttribute('data-path', htmlPath);
        var doc = new DOMParser().parseFromString(html, 'text/html');
        $('meta-title').value = (doc.querySelector('title') && doc.querySelector('title').textContent) || '';
        var md = doc.querySelector('meta[name="description"]');
        $('meta-desc').value = (md && md.getAttribute('content')) || '';
        var ma = doc.querySelector('meta[name="author"]');
        $('meta-author').value = (ma && ma.getAttribute('content')) || '';
        var ic = doc.querySelector('link[rel="icon"]');
        $('meta-favicon').value = (ic && ic.getAttribute('href')) || '';
        var section = doc.querySelector('section.article_by_teacher');
        var editor = $('rich-editor');
        editor.innerHTML = section
          ? section.innerHTML
          : '<p>（section.article_by_teacher なし — メタのみ編集可）</p>';
        editor.contentEditable = 'true';
        var cssPath = pathToCss(htmlPath);
        $('css-path').textContent = cssPath || '（なし）';
        frame.setAttribute('data-css-path', cssPath || '');
        if (!cssPath) {
          $('css-editor').value = '';
          status.textContent = '編集可能';
          return;
        }
        return getFile(cssPath)
          .then(function (cssFile) {
            frame.setAttribute('data-css-sha', cssFile.sha);
            var cssText = decodeContent(cssFile.content);
            var m = cssText.match(
              /\/\* --- teacher-custom-css-start --- \*\/([\s\S]*?)\/\* --- teacher-custom-css-end --- \*\/
            );
            $('css-editor').value = m ? m[1].trim() : '';
            status.textContent = '編集可能';
          })
          .catch(function () {
            $('css-editor').value = '';
            status.textContent = '編集可能（CSS新規可）';
          });
      })
      .catch(function (err) {
        status.textContent = '読込失敗: ' + err.message;
      });
  }

  function boot() {
    if (!$('login-view') || !$('dash-view')) {
      document.body.insertAdjacentHTML(
        'afterbegin',
        '<p style="color:red;padding:1rem">admin.html 構造エラー</p>'
      );
      return;
    }

    setVisible($('edit-view'), false);

    var existing = getSession();
    if (existing && existing.id) {
      enterDash(existing);
    } else {
      showView('login');
      mountHeader(null);
    }

    // ★ form ではなく button click（リロードしない）
    var loginBtn = $('login-btn');
    if (loginBtn) {
      loginBtn.onclick = function (e) {
        if (e) e.preventDefault();
        doLogin();
      };
    }
    // Enter キーでもログイン（input 上）
    function onEnter(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        doLogin();
      }
    }
    if ($('uid')) $('uid').addEventListener('keydown', onEnter);
    if ($('pw')) $('pw').addEventListener('keydown', onEnter);

    var logoutBtn = $('logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = function () {
        clearSession();
        showView('login');
        mountHeader(null);
        var banner = $('auth-banner');
        if (banner) banner.style.display = 'none';
      };
    }

    var backBtn = $('btn-back');
    if (backBtn) {
      backBtn.onclick = function () {
        var u = getSession();
        if (u) enterDash(u);
        else showView('login');
      };
    }

    var cmds = document.querySelectorAll('[data-cmd]');
    for (var i = 0; i < cmds.length; i++) {
      cmds[i].addEventListener('click', function () {
        var cmd = this.getAttribute('data-cmd');
        if (cmd === 'createLink') {
          var url = prompt('URL');
          if (url) document.execCommand(cmd, false, url);
        } else if (cmd === 'insertImage') {
          var u2 = prompt('画像URL');
          if (u2) document.execCommand('insertImage', false, u2);
        } else if (cmd === 'insertTable') {
          document.execCommand(
            'insertHTML',
            false,
            '<table><tr><th>A</th><th>B</th></tr><tr><td>-</td><td>-</td></tr></table>'
          );
        } else if (cmd === 'insertEmbed') {
          var u3 = prompt('iframe src');
          if (u3)
            document.execCommand('insertHTML', false, '<iframe src="' + u3 + '" allowfullscreen></iframe>');
        } else {
          document.execCommand(cmd, false, null);
        }
      });
    }

    var saveBtn = $('btn-save');
    if (saveBtn) {
      saveBtn.onclick = function () {
        var frame = $('edit-frame');
        var path = frame.getAttribute('data-path');
        var status = $('edit-status');
        var user = getSession();
        var commitMsg =
          ($('commit-msg') && $('commit-msg').value.trim()) || '2026/08/28の変更';
        if (!path || !user) return;
        status.textContent = '保存中…';
        getFile(path)
          .then(function (file) {
            var doc = new DOMParser().parseFromString(decodeContent(file.content), 'text/html');
            var title = $('meta-title').value;
            var desc = $('meta-desc').value;
            var author = $('meta-author').value;
            var fav = $('meta-favicon').value;
            if (doc.querySelector('title')) doc.querySelector('title').textContent = title;
            var md = doc.querySelector('meta[name="description"]');
            if (md) md.setAttribute('content', desc);
            else {
              md = doc.createElement('meta');
              md.name = 'description';
              md.content = desc;
              doc.head.appendChild(md);
            }
            var ma = doc.querySelector('meta[name="author"]');
            if (ma) ma.setAttribute('content', author);
            else {
              ma = doc.createElement('meta');
              ma.name = 'author';
              ma.content = author;
              doc.head.appendChild(ma);
            }
            var icon = doc.querySelector('link[rel="icon"]');
            if (icon) icon.href = fav;
            else if (fav) {
              icon = doc.createElement('link');
              icon.rel = 'icon';
              icon.href = fav;
              doc.head.appendChild(icon);
            }
            var section = doc.querySelector('section.article_by_teacher');
            if (section) section.innerHTML = $('rich-editor').innerHTML;
            return putFile(
              path,
              '<!DOCTYPE html>\n' + doc.documentElement.outerHTML,
              commitMsg,
              file.sha
            ).then(function () {
              var cssPath = frame.getAttribute('data-css-path');
              var customCss = $('css-editor').value;
              if (!cssPath) {
                status.textContent = '保存完了 ✓';
                return;
              }
              return getFile(cssPath)
                .then(function (cf) {
                  var cssText = decodeContent(cf.content);
                  if (cssText.indexOf('teacher-custom-css-start') >= 0) {
                    cssText = cssText.replace(
                      /\/\* --- teacher-custom-css-start --- \*\/[\s\S]*?\/\* --- teacher-custom-css-end --- \*\//,
                      '/* --- teacher-custom-css-start --- */\n' +
                        customCss +
                        '\n/* --- teacher-custom-css-end --- */'
                    );
                  } else {
                    cssText +=
                      '\n/* --- teacher-custom-css-start --- */\n' +
                      customCss +
                      '\n/* --- teacher-custom-css-end --- */\n';
                  }
                  return putFile(cssPath, cssText, commitMsg, cf.sha);
                })
                .catch(function () {
                  var cssText =
                    '/* page */\n/* --- teacher-custom-css-start --- */\n' +
                    customCss +
                    '\n/* --- teacher-custom-css-end --- */\n';
                  return putFile(cssPath, cssText, commitMsg, null);
                })
                .then(function () {
                  status.textContent = '保存完了 ✓';
                });
            });
          })
          .catch(function (err) {
            status.textContent = '保存失敗: ' + err.message;
          });
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
