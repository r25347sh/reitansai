/**
 * Reitansai Admin / CMS
 * ログイン: 同一オリジンの users.json を優先（GitHub API に依存しない）
 * 保存: GitHub Contents API
 */
const GITHUB_OWNER = 'r25347sh';
const GITHUB_REPO = 'reitansai';
const GITHUB_TOKEN =
  'github_pat_11BXRNCFA0EVBbGiXBnXgp_' +
  'rHoCChQCXXzyvyk2ox1l9RMI3xtQRwRmqUHVNAiAEsjWFWDH6TVCdEu2Pjo';
const API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents`;
const SESSION_KEY = 'reitansai_user';

const Session = {
  get() {
    try {
      const raw =
        localStorage.getItem(SESSION_KEY) ||
        sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(u) {
    const s = JSON.stringify(u);
    localStorage.setItem(SESSION_KEY, s);
    sessionStorage.setItem(SESSION_KEY, s);
    window.dispatchEvent(new CustomEvent('reitansai:auth-changed', { detail: u }));
  },
  clear() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent('reitansai:auth-changed', { detail: null }));
  }
};

async function ghHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

async function getFile(path) {
  const res = await fetch(`${API}/${path}?ref=main`, { headers: await ghHeaders() });
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
  return res.json();
}

async function putFile(path, content, message, sha) {
  const body = {
    message: message || '2026/08/28の変更',
    content: btoa(unescape(encodeURIComponent(content))),
    branch: 'main'
  };
  if (sha) body.sha = sha;
  const res = await fetch(`${API}/${path}`, {
    method: 'PUT',
    headers: await ghHeaders(),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`PUT ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

function decodeGitHubContent(content) {
  return decodeURIComponent(escape(atob(String(content).replace(/\n/g, ''))));
}

async function appendLog(line) {
  try {
    let sha = null;
    let text = '';
    try {
      const f = await getFile('src/log.txt');
      sha = f.sha;
      text = decodeGitHubContent(f.content);
    } catch (_) {}
    await putFile(
      'src/log.txt',
      text + `[${new Date().toISOString()}] ${line}\n`,
      '2026/08/28の変更',
      sha
    );
  } catch (e) {
    console.warn('log', e);
  }
}

/** ログイン用: APIトークン不要で users.json を読む */
async function loadUsers() {
  const urls = [
    new URL('src/users.json', location.href).href,
    'https://raw.githubusercontent.com/r25347sh/reitansai/main/src/users.json'
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      if (data && typeof data === 'object') return data;
    } catch (e) {
      console.warn('loadUsers fail', url, e);
    }
  }
  // 最終手段: GitHub Contents API
  try {
    const f = await getFile('src/users.json');
    return JSON.parse(decodeGitHubContent(f.content));
  } catch (e) {
    throw new Error('ユーザー一覧を取得できません。ネット接続または GitHub Pages の公開を確認してください。');
  }
}

function pathToCss(htmlPath) {
  if (htmlPath.startsWith('pages/seminars/')) {
    return htmlPath.replace('pages/seminars/', 'src/css/pages/seminars/').replace('.html', '.css');
  }
  if (htmlPath.startsWith('pages/')) {
    return htmlPath.replace('pages/', 'src/css/pages/').replace('.html', '.css');
  }
  if (htmlPath === 'index.html') return 'src/css/pages/index.css';
  if (htmlPath === 'map.html') return 'src/css/pages/map.css';
  return null;
}

/** admin ページ専用ヘッダー（MENU.js なしでも動く） */
function mountAdminHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let box = header.querySelector('.header-auth');
  if (box) box.remove();
  box = document.createElement('div');
  box.className = 'header-auth';
  const user = Session.get();
  if (user) {
    box.innerHTML =
      '<span class="auth-name">' +
      (user.name || user.id) +
      '</span>' +
      '<span class="auth-btn auth-cms" style="pointer-events:none;opacity:.9">ログイン中</span>' +
      '<button type="button" class="auth-btn auth-out" id="header-logout">ログアウト</button>';
    header.appendChild(box);
    document.getElementById('header-logout')?.addEventListener('click', () => {
      Session.clear();
      location.reload();
    });
  } else {
    box.innerHTML = '<span class="auth-name">未ログイン</span>';
    header.appendChild(box);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const dashView = document.getElementById('dash-view');
  const editView = document.getElementById('edit-view');
  const loginForm = document.getElementById('login-form');
  const errEl = document.getElementById('login-error');
  const userLabel = document.getElementById('user-label');
  const permList = document.getElementById('perm-list');
  const statusLogin = document.getElementById('login-status');

  function show(v) {
    [loginView, dashView, editView].forEach((x) => x && x.classList.add('hidden'));
    if (v) v.classList.remove('hidden');
  }

  function enterDash(user) {
    if (!user) {
      show(loginView);
      mountAdminHeader();
      return;
    }
    userLabel.textContent = `${user.name || user.id}（${user.semi_name || ''}）`;
    permList.innerHTML = '';
    const perms = user.permissions || [];
    if (!perms.length) {
      const li = document.createElement('li');
      li.textContent = '編集可能なページがありません';
      permList.appendChild(li);
    } else {
      perms.forEach((p) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-gold';
        btn.textContent = p;
        btn.addEventListener('click', () => openEditor(user, p));
        li.appendChild(btn);
        permList.appendChild(li);
      });
    }
    show(dashView);
    mountAdminHeader();
  }

  // 既存セッション復元
  const existing = Session.get();
  if (existing) {
    enterDash(existing);
  } else {
    show(loginView);
    mountAdminHeader();
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    if (statusLogin) statusLogin.textContent = '認証中…';
    const id = document.getElementById('uid').value.trim();
    const pw = document.getElementById('pw').value;
    const btn = loginForm.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const users = await loadUsers();
      const u = users[id];
      if (!u || String(u.password) !== String(pw)) {
        errEl.textContent = 'ID またはパスワードが違います';
        if (statusLogin) statusLogin.textContent = '';
        return;
      }
      const session = {
        id,
        name: u.name,
        semi_name: u.semi_name,
        permissions: u.permissions || []
      };
      Session.set(session);
      appendLog(`LOGIN ${id}`).catch(() => {});
      if (statusLogin) statusLogin.textContent = 'ログイン成功';
      enterDash(session);
    } catch (err) {
      errEl.textContent = '認証エラー: ' + (err.message || err);
      if (statusLogin) statusLogin.textContent = '';
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    Session.clear();
    show(loginView);
    mountAdminHeader();
    if (errEl) errEl.textContent = '';
  });

  async function openEditor(user, htmlPath) {
    // index.html 等は article_by_teacher が無い場合あり
    show(editView);
    document.getElementById('edit-path').textContent = htmlPath;
    const frame = document.getElementById('edit-frame');
    const status = document.getElementById('edit-status');
    status.textContent = '読み込み中…';
    try {
      const file = await getFile(htmlPath);
      const html = decodeGitHubContent(file.content);
      frame.dataset.sha = file.sha;
      frame.dataset.path = htmlPath;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      document.getElementById('meta-title').value = doc.querySelector('title')?.textContent || '';
      document.getElementById('meta-desc').value =
        doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      document.getElementById('meta-author').value =
        doc.querySelector('meta[name="author"]')?.getAttribute('content') || '';
      document.getElementById('meta-favicon').value =
        doc.querySelector('link[rel="icon"]')?.getAttribute('href') || '';
      const section = doc.querySelector('section.article_by_teacher');
      const editor = document.getElementById('rich-editor');
      editor.innerHTML = section
        ? section.innerHTML
        : '<p>（このページに section.article_by_teacher がありません。メタ情報のみ編集できます）</p>';
      editor.contentEditable = 'true';
      const cssPath = pathToCss(htmlPath);
      document.getElementById('css-path').textContent = cssPath || '（なし）';
      frame.dataset.cssPath = cssPath || '';
      if (cssPath) {
        try {
          const cssFile = await getFile(cssPath);
          frame.dataset.cssSha = cssFile.sha;
          const cssText = decodeGitHubContent(cssFile.content);
          const m = cssText.match(
            /\/\* --- teacher-custom-css-start --- \*\/([\s\S]*?)\/\* --- teacher-custom-css-end --- \*\/
          );
          document.getElementById('css-editor').value = m ? m[1].trim() : '';
        } catch {
          document.getElementById('css-editor').value = '';
        }
      } else {
        document.getElementById('css-editor').value = '';
      }
      status.textContent = '編集可能';
    } catch (err) {
      status.textContent = '読込失敗: ' + err.message;
    }
  }

  document.getElementById('btn-back')?.addEventListener('click', () => {
    const u = Session.get();
    if (u) enterDash(u);
    else show(loginView);
  });

  document.querySelectorAll('[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd === 'createLink') {
        const url = prompt('URL');
        if (url) document.execCommand(cmd, false, url);
      } else if (cmd === 'insertImage') {
        const url = prompt('画像URL');
        if (url) document.execCommand('insertImage', false, url);
      } else if (cmd === 'insertTable') {
        document.execCommand(
          'insertHTML',
          false,
          '<table><tr><th>A</th><th>B</th></tr><tr><td>-</td><td>-</td></tr></table>'
        );
      } else if (cmd === 'insertEmbed') {
        const url = prompt('iframe src');
        if (url)
          document.execCommand(
            'insertHTML',
            false,
            '<iframe src="' + url + '" allowfullscreen></iframe>'
          );
      } else {
        document.execCommand(cmd, false, null);
      }
    });
  });

  document.getElementById('rich-editor')?.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = () => document.execCommand('insertImage', false, reader.result);
        reader.readAsDataURL(item.getAsFile());
        break;
      }
    }
  });

  document.getElementById('btn-save')?.addEventListener('click', async () => {
    const frame = document.getElementById('edit-frame');
    const path = frame.dataset.path;
    const status = document.getElementById('edit-status');
    const commitMsg =
      document.getElementById('commit-msg').value.trim() || '2026/08/28の変更';
    const user = Session.get();
    if (!path || !user) return;
    status.textContent = '保存中…';
    try {
      const file = await getFile(path);
      const doc = new DOMParser().parseFromString(
        decodeGitHubContent(file.content),
        'text/html'
      );
      const title = document.getElementById('meta-title').value;
      const desc = document.getElementById('meta-desc').value;
      const author = document.getElementById('meta-author').value;
      const fav = document.getElementById('meta-favicon').value;
      if (doc.querySelector('title')) doc.querySelector('title').textContent = title;
      let md = doc.querySelector('meta[name="description"]');
      if (md) md.setAttribute('content', desc);
      else {
        md = doc.createElement('meta');
        md.name = 'description';
        md.content = desc;
        doc.head.appendChild(md);
      }
      let ma = doc.querySelector('meta[name="author"]');
      if (ma) ma.setAttribute('content', author);
      else {
        ma = doc.createElement('meta');
        ma.name = 'author';
        ma.content = author;
        doc.head.appendChild(ma);
      }
      let icon = doc.querySelector('link[rel="icon"]');
      if (icon) icon.href = fav;
      else if (fav) {
        icon = doc.createElement('link');
        icon.rel = 'icon';
        icon.href = fav;
        doc.head.appendChild(icon);
      }
      const section = doc.querySelector('section.article_by_teacher');
      if (section) section.innerHTML = document.getElementById('rich-editor').innerHTML;
      await putFile(
        path,
        '<!DOCTYPE html>\n' + doc.documentElement.outerHTML,
        commitMsg,
        file.sha
      );
      const cssPath = frame.dataset.cssPath;
      const customCss = document.getElementById('css-editor').value;
      if (cssPath) {
        let cssSha = frame.dataset.cssSha;
        let cssText = '';
        try {
          const cf = await getFile(cssPath);
          cssSha = cf.sha;
          cssText = decodeGitHubContent(cf.content);
        } catch (_) {
          cssText =
            '/* page */\n/* --- teacher-custom-css-start --- */\n/* --- teacher-custom-css-end --- */\n';
        }
        if (cssText.includes('teacher-custom-css-start')) {
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
        await putFile(cssPath, cssText, commitMsg, cssSha);
      }
      await appendLog('EDIT ' + user.id + ' ' + path + ' | ' + commitMsg);
      status.textContent = '保存完了 ✓';
      frame.dataset.sha = (await getFile(path)).sha;
    } catch (err) {
      status.textContent = '保存失敗: ' + err.message;
    }
  });
});
