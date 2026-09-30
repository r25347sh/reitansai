/**
 * Local visitor ID + profile
 * - Normal: random long ID (rt-local-id)
 * - Admin: ?user=admin → ID "admin", flag rt-is-admin=1 persisted in localStorage
 */
(function (global) {
  'use strict';

  var KEY_ID = 'rt-local-id';
  var KEY_PROFILE = 'rt-visitor-profile';
  var KEY_TUTORIAL = 'rt-tutorial-done';
  var KEY_CONSENT = 'rt-consent-done';
  var KEY_ADMIN = 'rt-is-admin';
  var ADMIN_ID = 'admin';

  var ALPHABET =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_+-=~';

  function queryUserParam() {
    try {
      var q = new URLSearchParams(location.search || '');
      var u = (q.get('user') || '').trim().toLowerCase();
      return u || null;
    } catch (e) {
      return null;
    }
  }

  function getLocalId() {
    try {
      return localStorage.getItem(KEY_ID) || null;
    } catch (e) {
      return null;
    }
  }

  function setLocalId(id) {
    try {
      localStorage.setItem(KEY_ID, id);
    } catch (e) {}
  }

  function setAdminFlag(on) {
    try {
      if (on) localStorage.setItem(KEY_ADMIN, '1');
      else localStorage.removeItem(KEY_ADMIN);
    } catch (e) {}
  }

  function readAdminFlag() {
    try {
      return localStorage.getItem(KEY_ADMIN) === '1';
    } catch (e) {
      return false;
    }
  }

  function isAdminMode() {
    if (queryUserParam() === 'admin') return true;
    if (readAdminFlag()) return true;
    if (getLocalId() === ADMIN_ID) return true;
    return false;
  }

  function activateAdmin() {
    setLocalId(ADMIN_ID);
    setAdminFlag(true);
    setConsented();
    setTutorialDone();
    var p = getProfile() || {};
    p.role = 'admin';
    if (!p.consentedAt) p.consentedAt = new Date().toISOString();
    setProfile(p);
    return ADMIN_ID;
  }

  function randomLocalId() {
    var out = '';
    var bytes;
    try {
      bytes = new Uint8Array(48);
      crypto.getRandomValues(bytes);
    } catch (e) {
      bytes = null;
    }
    for (var i = 0; i < 48; i++) {
      var n = bytes ? bytes[i] : Math.floor(Math.random() * 256);
      out += ALPHABET[n % ALPHABET.length];
    }
    return 'rt_' + Date.now().toString(36) + '_' + out;
  }

  function ensureLocalId() {
    if (queryUserParam() === 'admin' || readAdminFlag() || getLocalId() === ADMIN_ID) {
      return activateAdmin();
    }
    var id = getLocalId();
    if (id && id.length >= 3) return id;
    id = randomLocalId();
    setLocalId(id);
    return id;
  }

  function hasConsented() {
    if (isAdminMode()) return true;
    try {
      return localStorage.getItem(KEY_CONSENT) === '1';
    } catch (e) {
      return false;
    }
  }

  function setConsented() {
    try {
      localStorage.setItem(KEY_CONSENT, '1');
    } catch (e) {}
  }

  function hasTutorialDone() {
    if (isAdminMode()) return true;
    try {
      return localStorage.getItem(KEY_TUTORIAL) === '1';
    } catch (e) {
      return false;
    }
  }

  function setTutorialDone() {
    try {
      localStorage.setItem(KEY_TUTORIAL, '1');
    } catch (e) {}
  }

  function getProfile() {
    try {
      var raw = localStorage.getItem(KEY_PROFILE);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setProfile(profile) {
    try {
      localStorage.setItem(KEY_PROFILE, JSON.stringify(profile || {}));
    } catch (e) {}
  }

  function isFirstVisit() {
    if (isAdminMode()) return false;
    return !hasConsented();
  }

  if (queryUserParam() === 'admin') {
    activateAdmin();
  } else if (readAdminFlag() || getLocalId() === ADMIN_ID) {
    activateAdmin();
  }

  global.ReitansaiUser = {
    KEY_ID: KEY_ID,
    KEY_ADMIN: KEY_ADMIN,
    ADMIN_ID: ADMIN_ID,
    getLocalId: getLocalId,
    ensureLocalId: ensureLocalId,
    hasConsented: hasConsented,
    setConsented: setConsented,
    hasTutorialDone: hasTutorialDone,
    setTutorialDone: setTutorialDone,
    getProfile: getProfile,
    setProfile: setProfile,
    isFirstVisit: isFirstVisit,
    isAdminMode: isAdminMode,
    activateAdmin: activateAdmin,
    randomLocalId: randomLocalId
  };
})(typeof window !== 'undefined' ? window : this);
