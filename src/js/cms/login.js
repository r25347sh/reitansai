/*! Reitansai CMS login */
(function () {
  var C = window.ASOBI_CMS;
  var S = window.ASOBI_SESSION;
  var API = window.ASOBI_API;
  var $ = function (id) { return document.getElementById(id); };
  function msg(t, isErr) {
    var el = $('login-msg');
    if (!el) return;
    el.textContent = t || '';
    el.className = 'msg' + (isErr ? ' err' : (t ? ' ok' : ''));
  }
  function nextUrl() {
    try {
      var q = new URLSearchParams(location.search).get('next');
      if (q && q.indexOf('login') < 0) return q;
    } catch (e) {}
    return C.PAGES.select;
  }
  function goApp(user) { S.set(user); location.href = nextUrl(); }
  function verify(id, pw, users) {
    id = String(id || '').trim();
    pw = String(pw || '');
    if (!id || !pw) return Promise.reject(new Error('IDとパスワードを入力してください'));
    var u = users[id];
    if (!u) return Promise.reject(new Error('ユーザーが見つかりません'));
    var ok = false;
    if (u.pass_hash && window.AsobiAuth && window.AsobiAuth.verify) {
      ok = window.AsobiAuth.verify(id, pw, u.pass_hash);
    } else if (u.password != null) {
      ok = String(u.password) === pw;
    }
    if (!ok) return Promise.reject(new Error('パスワードが違います'));
    var isAdmin = !!u.isAdmin || u.semi_id === 'admin' || id === 'r25347sh' || id === 'takimura';
    return Promise.resolve({
      id: id, name: u.name || id, semi_id: u.semi_id || '', semi_name: u.semi_name || '',
      role: u.role || (isAdmin ? 'admin' : 'editor'), isAdmin: isAdmin, fullAccess: isAdmin,
      permissions: (u.permissions || []).slice(), canUpload: true, canDelete: true
    });
  }
  function doLogin(id, pw) {
    msg('確認中…');
    return API.loadUsers().then(function (users) { return verify(id, pw, users); })
      .then(function (user) { msg('ようこそ、' + user.name + ' さん'); setTimeout(function () { goApp(user); }, 300); })
      .catch(function (e) { msg(e.message || String(e), true); });
  }
  document.addEventListener('DOMContentLoaded', function () {
    var existing = S.get();
    if (existing && existing.id) { location.replace(nextUrl()); return; }
    var form = $('login-form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      doLogin($('login-id').value, $('login-pw').value);
    });
  });
})();
