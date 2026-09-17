/*! CMS session */
(function (g) {
  var C = null;
  function cfg() { if (!C) C = g.ASOBI_CMS; return C; }
  function key() { return (cfg() && cfg().SESSION_KEY) || 'cms_user'; }
  function legacyKey() { return (cfg() && cfg().LEGACY_SESSION_KEY) || ''; }
  function get() {
    try {
      var raw = localStorage.getItem(key()) || sessionStorage.getItem(key());
      if (!raw && legacyKey()) raw = localStorage.getItem(legacyKey()) || sessionStorage.getItem(legacyKey());
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function set(user) {
    var s = JSON.stringify(user || {});
    try { localStorage.setItem(key(), s); sessionStorage.setItem(key(), s); } catch (e) {}
  }
  function clear() {
    try {
      localStorage.removeItem(key()); sessionStorage.removeItem(key());
      if (legacyKey()) { localStorage.removeItem(legacyKey()); sessionStorage.removeItem(legacyKey()); }
    } catch (e) {}
  }
  function require(redirect) {
    var u = get();
    if (u && u.id) return u;
    if (redirect !== false) {
      var login = (cfg() && cfg().PAGES && cfg().PAGES.login) || 'login.html';
      location.href = login + '?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search);
    }
    return null;
  }
  function canEditPath(user, path) {
    if (!user) return false;
    if (user.isAdmin || user.fullAccess) return true;
    var perms = user.permissions || [];
    return perms.indexOf(path) >= 0;
  }
  g.ASOBI_SESSION = { get: get, set: set, clear: clear, require: require, canEditPath: canEditPath };
})(typeof window !== 'undefined' ? window : this);
