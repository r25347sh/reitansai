/**
 * Local visitor ID + profile (localStorage only for ID; profile also mirrored to Supabase).
 * Key: rt-local-id
 * Profile: rt-visitor-profile { age, gender, consentedAt }
 */
(function (global) {
  'use strict';

  var KEY_ID = 'rt-local-id';
  var KEY_PROFILE = 'rt-visitor-profile';
  var KEY_TUTORIAL = 'rt-tutorial-done';
  var KEY_CONSENT = 'rt-consent-done';

  /** 48 chars: A-Z a-z 0-9 and safe symbols (no quotes/backslash) */
  var ALPHABET =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_+-=~';

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

  function ensureLocalId() {
    var id = getLocalId();
    if (id && id.length >= 20) return id;
    id = randomLocalId();
    try {
      localStorage.setItem(KEY_ID, id);
    } catch (e) {}
    return id;
  }

  function hasConsented() {
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
    return !getLocalId() && !hasConsented();
  }

  global.ReitansaiUser = {
    KEY_ID: KEY_ID,
    getLocalId: getLocalId,
    ensureLocalId: ensureLocalId,
    hasConsented: hasConsented,
    setConsented: setConsented,
    hasTutorialDone: hasTutorialDone,
    setTutorialDone: setTutorialDone,
    getProfile: getProfile,
    setProfile: setProfile,
    isFirstVisit: isFirstVisit,
    randomLocalId: randomLocalId
  };
})(typeof window !== 'undefined' ? window : this);
