/**
 * Header login/logout (関係者専用)
 * sessionStorage key: reitansai_user
 */
(function () {
  function rootPath() {
    const p = location.pathname;
    if (p.includes('/pages/seminars/')) return '../../';
    if (p.includes('/pages/')) return '../';
    return '';
  }

  function getUser() {
    try { return JSON.parse(sessionStorage.getItem('reitansai_user') || 'null'); }
    catch { return null; }
  }

  function mount() {
    const header = document.querySelector('.site-header');
    if (!header || header.querySelector('.header-auth')) return;

    const root = rootPath();
    const box = document.createElement('div');
    box.className = 'header-auth';

    const user = getUser();
    if (user) {
      box.innerHTML =
        '<span class="auth-name" title="' + (user.name || user.id) + '">' +
        (user.name || user.id) +
        '</span>' +
        '<a class="auth-btn auth-cms" href="' + root + 'admin.html">CMS</a>' +
        '<button type="button" class="auth-btn auth-out" id="auth-logout">ログアウト</button>';
      header.appendChild(box);
      document.getElementById('auth-logout')?.addEventListener('click', () => {
        sessionStorage.removeItem('reitansai_user');
        location.reload();
      });
    } else {
      box.innerHTML =
        '<a class="auth-btn auth-in" href="' + root + 'admin.html" title="関係者専用">ログイン</a>';
      header.appendChild(box);
    }

    // メニュー開く用FAB（使いやすさ優先）
    if (!document.querySelector('.menu-fab')) {
      const fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'menu-fab';
      fab.setAttribute('aria-label', 'メニューを開く');
      fab.innerHTML = '☰';
      fab.title = 'メニュー（または長押し）';
      document.body.appendChild(fab);
      fab.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('reitansai:open-menu', {
          detail: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        }));
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.ReitansaiAuth = { getUser };
})();
