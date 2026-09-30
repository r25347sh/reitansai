/**
 * Local visitor ID + profile
 * - Normal: random long ID in localStorage (rt-local-id)
 * - Admin:  ?user=admin  → fixed ID "admin" (no random)
 */
(function (global) {
  'use strict';

  var KEY_ID = 'rt-local-id';
  var KEY_PROFILE = 'rt-visitor-profile';
  var KEY_TUTORIAL = 'rt-tutorial-done';
  var KEY_CONSENT = 'rt-consent-done';
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

  function isAdminMode() {
    return queryUserParam() === 'admin' || getLocalId() === ADMIN_ID;
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

  function ensureLocalId() {
    if (queryUserParam() === 'admin') {
      setLocalId(ADMIN_ID);
      return ADMIN_ID;
    }
    var id = getLocalId();
    if (id && id.length >= 3) return id;
    id = randomLocalId();
    setLocalId(id);
    return id;
  }

  function hasConsented() {
    if (queryUserParam() === 'admin') return true;
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
    if (queryUserParam() === 'admin') return true;
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
    if (queryUserParam() === 'admin') return false;
    return !hasConsented();
  }

  if (queryUserParam() === 'admin') {
    setLocalId(ADMIN_ID);
    setConsented();
    setTutorialDone();
    if (!getProfile()) {
      setProfile({ age: null, gender: null, role: 'admin', consentedAt: new Date().toISOString() });
    }
  }

  global.ReitansaiUser = {
    KEY_ID: KEY_ID,
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
    randomLocalId: randomLocalId
  };
})(typeof window !== 'undefined' ? window : this);
