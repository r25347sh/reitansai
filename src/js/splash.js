/**
 * First-visit splash (IndexedDB)
 * - Black full-screen logo (contain)
 * - Credit under logo
 * - Accelerating expand + fade out
 * - Prevents page flash until decision is made
 */
(function () {
  'use strict';

  var DB_NAME = 'reitansai-visit';
  var DB_VERSION = 1;
  var STORE = 'flags';
  var KEY = 'firstVisitDone';
  var LOGO_SRC = '/reitansai/sources/\u9e97\u63a2\u796d\u30ed\u30b4.png';
  var HOLD_MS = 1100;
  var EXIT_MS = 780;

  function openDB() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error('no IndexedDB'));
        return;
      }
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = function () {
        reject(req.error || new Error('IDB open failed'));
      };
      req.onupgradeneeded = function (ev) {
        var db = ev.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = function () {
        resolve(req.result);
      };
    });
  }

  function getFlag() {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readonly');
        var req = tx.objectStore(STORE).get(KEY);
        req.onsuccess = function () {
          resolve(req.result && req.result.value === true);
        };
        req.onerror = function () {
          reject(req.error);
        };
      });
    });
  }

  function setFlag() {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put({ key: KEY, value: true, at: Date.now() });
        tx.oncomplete = function () {
          resolve();
        };
        tx.onerror = function () {
          reject(tx.error);
        };
      });
    });
  }

  function preloadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        resolve(null);
      };
      img.src = src;
    });
  }

  function removePending() {
    document.documentElement.classList.remove('rt-splash-pending');
  }

  function destroySplash(el) {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
    removePending();
  }

  function runExit(el) {
    var inner = el.querySelector('.rt-splash-inner');
    if (!inner) {
      destroySplash(el);
      return;
    }

    el.classList.add('is-exiting');

    // Accelerating expand + fade (ease-in cubic)
    inner.style.transition =
      'transform ' + EXIT_MS + 'ms cubic-bezier(0.55, 0.05, 0.9, 0.35), ' +
      'opacity ' + EXIT_MS + 'ms cubic-bezier(0.55, 0.05, 0.9, 0.35)';
    // force reflow
    void inner.offsetWidth;
    inner.style.transform = 'scale(2.35)';
    inner.style.opacity = '0';
    el.style.transition = 'opacity ' + Math.round(EXIT_MS * 0.85) + 'ms ease-in';
    el.style.opacity = '0';

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      destroySplash(el);
    }
    inner.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, EXIT_MS + 80);
  }

  function showSplash() {
    var root = document.createElement('div');
    root.id = 'rt-splash';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML =
      '<div class="rt-splash-inner">' +
      '<img class="rt-splash-logo" src="' + LOGO_SRC + '" alt="" width="420" height="420" decoding="async">' +
      '<p class="rt-splash-credit">Created by 5G10 Haru Sato</p>' +
      '</div>';

    document.body.insertBefore(root, document.body.firstChild);

    // Ensure logo is ready (already preloaded, but wait if needed)
    var logo = root.querySelector('.rt-splash-logo');
    var startHold = function () {
      root.classList.add('is-ready');
      setTimeout(function () {
        setFlag().catch(function () { /* ignore */ });
        runExit(root);
      }, HOLD_MS);
    };

    if (logo.complete && logo.naturalWidth) {
      startHold();
    } else {
      logo.addEventListener('load', startHold, { once: true });
      logo.addEventListener('error', startHold, { once: true });
      // safety
      setTimeout(startHold, 2500);
    }
  }

  function init() {
    // Mark pending early so CSS can hide content
    document.documentElement.classList.add('rt-splash-pending');

    Promise.all([getFlag().catch(function () { return true; }), preloadImage(LOGO_SRC)])
      .then(function (results) {
        var visited = results[0];
        if (visited) {
          removePending();
          return;
        }
        // First visit
        if (document.body) {
          showSplash();
        } else {
          document.addEventListener('DOMContentLoaded', showSplash, { once: true });
        }
      })
      .catch(function () {
        removePending();
      });
  }

  // Run as early as possible
  init();
})();
