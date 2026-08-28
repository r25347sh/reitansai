/**
 * Reitansai Admin / CMS - GitHub Contents API
 */
const GITHUB_OWNER = "r25347sh";
const GITHUB_REPO = "reitansai";
const GITHUB_TOKEN = "github_pat_11BXRNCFA0EVBbGiXBnXgp_" + "rHoCChQCXXzyvyk2ox1l9RMI3xtQRwRmqUHVNAiAEsjWFWDH6TVCdEu2Pjo";
const API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents`;
const Session = {
  get() { try { return JSON.parse(sessionStorage.getItem('reitansai_user') || 'null'); } catch { return null; } },
  set(u) { sessionStorage.setItem('reitansai_user', JSON.stringify(u)); },
  clear() { sessionStorage.removeItem('reitansai_user'); }
};
async function ghHeaders() {
  return { Accept: 'application/vnd.github+json', Authorization: `Bearer ${GITHUB_TOKEN}`, 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' };
}
async function getFile(path) {
  const res = await fetch(`${API}/${path}?ref=main`, { headers: await ghHeaders() });
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
  return res.json();
}
async function putFile(path, content, message, sha) {
  const body = { message: message || '2026/08/28の変更', content: btoa(unescape(encodeURIComponent(content))), branch: 'main' };
  if (sha) body.sha = sha;
  const res = await fetch(`${API}/${path}`, { method: 'PUT', headers: await ghHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`PUT ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}
async function appendLog(line) {
  try {
    let sha = null, text = '';
    try { const f = await getFile('src/log.txt'); sha = f.sha; text = decodeURIComponent(escape(atob(f.content.replace(/\n/g, '')))); } catch (_) {}
    await putFile('src/log.txt', text + `[${new Date().toISOString()}] ${line}\n`, '2026/08/28の変更', sha);
  } catch (e) { console.warn('log', e); }
}
async function loadUsers() {
  const f = await getFile('src/users.json');
  return JSON.parse(decodeURIComponent(escape(atob(f.content.replace(/\n/g, '')))));
}
function pathToCss(htmlPath) {
  if (htmlPath.startsWith('pages/seminars/')) return htmlPath.replace('pages/seminars/', 'src/css/pages/seminars/').replace('.html', '.css');
  if (htmlPath.startsWith('pages/')) return htmlPath.replace('pages/', 'src/css/pages/').replace('.html', '.css');
  return null;
}
document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const dashView = document.getElementById('dash-view');
  const editView = document.getElementById('edit-view');
  const loginForm = document.getElementById('login-form');
  const errEl = document.getElementById('login-error');
  const userLabel = document.getElementById('user-label');
  const permList = document.getElementById('perm-list');
  function show(v) { [loginView, dashView, editView].forEach(x => x && x.classList.add('hidden')); v && v.classList.remove('hidden'); }
  async function enterDash(user) {
    userLabel.textContent = `${user.name}（${user.semi_name || ''}）`;
    permList.innerHTML = '';
    (user.permissions || []).forEach(p => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'btn-gold'; btn.textContent = p;
      btn.addEventListener('click', () => openEditor(user, p));
      li.appendChild(btn); permList.appendChild(li);
    });
    show(dashView);
  }
  const existing = Session.get();
  if (existing) enterDash(existing);
  loginForm && loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); errEl.textContent = '';
    const id = document.getElementById('uid').value.trim();
    const pw = document.getElementById('pw').value;
    try {
      const users = await loadUsers();
      const u = users[id];
      if (!u || u.password !== pw) { errEl.textContent = 'ID またはパスワードが違います'; return; }
      const session = { id, name: u.name, semi_name: u.semi_name, permissions: u.permissions || [] };
      Session.set(session);
      await appendLog(`LOGIN ${id}`);
      enterDash(session);
    } catch (err) { errEl.textContent = '認証エラー: ' + err.message; }
  });
  document.getElementById('logout-btn')?.addEventListener('click', () => { Session.clear(); show(loginView); });
  async function openEditor(user, htmlPath) {
    show(editView);
    document.getElementById('edit-path').textContent = htmlPath;
    const frame = document.getElementById('edit-frame');
    const status = document.getElementById('edit-status');
    status.textContent = '読み込み中…';
    try {
      const file = await getFile(htmlPath);
      const html = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ''))));
      frame.dataset.sha = file.sha; frame.dataset.path = htmlPath;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      document.getElementById('meta-title').value = doc.querySelector('title')?.textContent || '';
      document.getElementById('meta-desc').value = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      document.getElementById('meta-author').value = doc.querySelector('meta[name="author"]')?.getAttribute('content') || '';
      document.getElementById('meta-favicon').value = doc.querySelector('link[rel="icon"]')?.getAttribute('href') || '';
      const section = doc.querySelector('section.article_by_teacher');
      const editor = document.getElementById('rich-editor');
      editor.innerHTML = section ? section.innerHTML : '<p>section なし</p>';
      editor.contentEditable = 'true';
      const cssPath = pathToCss(htmlPath);
      document.getElementById('css-path').textContent = cssPath || '（なし）';
      if (cssPath) {
        try {
          const cssFile = await getFile(cssPath);
          frame.dataset.cssSha = cssFile.sha; frame.dataset.cssPath = cssPath;
          const cssText = decodeURIComponent(escape(atob(cssFile.content.replace(/\n/g, ''))));
          const m = cssText.match(/\/\* --- teacher-custom-css-start --- \*\/([\s\S]*?)\/\* --- teacher-custom-css-end --- \*\/);
          document.getElementById('css-editor').value = m ? m[1].trim() : '';
        } catch { document.getElementById('css-editor').value = ''; }
      }
      status.textContent = '編集可能';
    } catch (err) { status.textContent = '読込失敗: ' + err.message; }
  }
  document.getElementById('btn-back')?.addEventListener('click', () => { const u = Session.get(); if (u) enterDash(u); else show(loginView); });
  document.querySelectorAll('[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd === 'createLink') { const url = prompt('URL'); if (url) document.execCommand(cmd, false, url); }
      else if (cmd === 'insertImage') { const url = prompt('画像URL'); if (url) document.execCommand('insertImage', false, url); }
      else if (cmd === 'insertTable') document.execCommand('insertHTML', false, '<table><tr><th>A</th><th>B</th></tr><tr><td>-</td><td>-</td></tr></table>');
      else if (cmd === 'insertEmbed') { const url = prompt('iframe src'); if (url) document.execCommand('insertHTML', false, '<iframe src="'+url+'" allowfullscreen></iframe>'); }
      else document.execCommand(cmd, false, null);
    });
  });
  document.getElementById('rich-editor')?.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items; if (!items) return;
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
    const commitMsg = document.getElementById('commit-msg').value.trim() || '2026/08/28の変更';
    const user = Session.get();
    if (!path || !user) return;
    status.textContent = '保存中…';
    try {
      const file = await getFile(path);
      const doc = new DOMParser().parseFromString(decodeURIComponent(escape(atob(file.content.replace(/\n/g, '')))), 'text/html');
      const title = document.getElementById('meta-title').value;
      const desc = document.getElementById('meta-desc').value;
      const author = document.getElementById('meta-author').value;
      const fav = document.getElementById('meta-favicon').value;
      if (doc.querySelector('title')) doc.querySelector('title').textContent = title;
      let md = doc.querySelector('meta[name="description"]');
      if (md) md.setAttribute('content', desc); else { md = doc.createElement('meta'); md.name = 'description'; md.content = desc; doc.head.appendChild(md); }
      let ma = doc.querySelector('meta[name="author"]');
      if (ma) ma.setAttribute('content', author); else { ma = doc.createElement('meta'); ma.name = 'author'; ma.content = author; doc.head.appendChild(ma); }
      let icon = doc.querySelector('link[rel="icon"]');
      if (icon) icon.href = fav; else { icon = doc.createElement('link'); icon.rel = 'icon'; icon.href = fav; doc.head.appendChild(icon); }
      const section = doc.querySelector('section.article_by_teacher');
      if (section) section.innerHTML = document.getElementById('rich-editor').innerHTML;
      await putFile(path, '<!DOCTYPE html>\n' + doc.documentElement.outerHTML, commitMsg, file.sha);
      const cssPath = frame.dataset.cssPath;
      const customCss = document.getElementById('css-editor').value;
      if (cssPath) {
        let cssSha = frame.dataset.cssSha, cssText = '';
        try { const cf = await getFile(cssPath); cssSha = cf.sha; cssText = decodeURIComponent(escape(atob(cf.content.replace(/\n/g, '')))); }
        catch (_) { cssText = '/* page */\n/* --- teacher-custom-css-start --- */\n/* --- teacher-custom-css-end --- */\n'; }
        if (cssText.includes('teacher-custom-css-start')) {
          cssText = cssText.replace(/\/\* --- teacher-custom-css-start --- \*\/[\s\S]*?\/\* --- teacher-custom-css-end --- \*\//,
            '/* --- teacher-custom-css-start --- */\n' + customCss + '\n/* --- teacher-custom-css-end --- */');
        } else cssText += '\n/* --- teacher-custom-css-start --- */\n' + customCss + '\n/* --- teacher-custom-css-end --- */\n';
        await putFile(cssPath, cssText, commitMsg, cssSha);
      }
      await appendLog('EDIT ' + user.id + ' ' + path + ' | ' + commitMsg);
      status.textContent = '保存完了 ✓';
      frame.dataset.sha = (await getFile(path)).sha;
    } catch (err) { status.textContent = '保存失敗: ' + err.message; }
  });
});
