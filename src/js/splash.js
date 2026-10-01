/**
 * First-visit splash (IndexedDB)
 * Heavy images disabled for performance (favicon was ~3.8MB).
 */
(function () {
  'use strict';

  var DB_NAME = 'reitansai-visit';
  var DB_VERSION = 1;
  var STORE = 'flags';
  var KEY = 'firstVisitDone';
  var ICON_SRC = ''; /* was 3.8MB favicon — skip heavy splash image */
  var LOGO_SRC = '';
  var HOLD_MS = 400;
  var EXIT_MS = 300;
  var EASE = 'cubic-bezier(0.33, 0.0, 0.45, 1)';

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
      if (!src) {
        resolve(null);
        return;
      }
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
    inner.style.transition =
      'transform ' + EXIT_MS + 'ms ' + EASE + ', ' +
      'opacity ' + EXIT_MS + 'ms ' + EASE;
    void inner.offsetWidth;
    inner.style.transform = 'scale(1.85)';
    inner.style.opacity = '0';
    el.style.transition = 'opacity ' + Math.round(EXIT_MS * 0.9) + 'ms ' + EASE;
    el.style.opacity = '0';
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      destroySplash(el);
    }
    inner.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, EXIT_MS + 120);
  }

  function showSplash() {
    var root = document.createElement('div');
    root.id = 'rt-splash';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML =
      '<div class="rt-splash-inner">' +
      '<p class="rt-splash-credit">Created by 5G10 Haru Sato</p>' +
      '</div>';
    document.body.insertBefore(root, document.body.firstChild);
    root.classList.add('is-ready');
    setTimeout(function () {
      setFlag().catch(function () {});
      runExit(root);
    }, HOLD_MS);
  }

  function init() {
    document.documentElement.classList.add('rt-splash-pending');
    getFlag()
      .catch(function () {
        return true;
      })
      .then(function (visited) {
        if (visited) {
          removePending();
          return;
        }
        if (document.body) showSplash();
        else document.addEventListener('DOMContentLoaded', showSplash, { once: true });
      })
      .catch(function () {
        removePending();
      });
  }

  init();
})();
