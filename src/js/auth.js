/**
 * login/logout (関係者専用)
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
    try {
      var raw = localStorage.getItem('reitansai_user') || sessionStorage.getItem('reitansai_user') || 'null';
      return JSON.parse(raw);
    } catch {
      return null;
    }
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
        try { localStorage.removeItem('reitansai_user'); } catch (e) {}
        try { sessionStorage.removeItem('reitansai_user'); } catch (e) {}
        location.reload();
      });
    } else {
      box.innerHTML =
        '<a class="auth-btn auth-in" href="' + root + 'admin.html" title="関係者専用">ログイン</a>';
      header.appendChild(box);
    }

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.ReitansaiAuth = { getUser };
})();
