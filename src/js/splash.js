/**
 * First-visit splash (IndexedDB)
 * - Main: favicon.png (screen-fitting)
 * - Sub: 麗探祭ロゴ.png
 * - Soft expand + fade out
 * - After exit: guide modal (menu / site usage)
 * - Credit: animated gradient on "5G10 Haru Sato"
 *
 * Image paths are relative to the HTML document (index.html at site root).
 */
(function () {
  'use strict';

  var DB_NAME = 'reitansai-visit';
  var DB_VERSION = 1;
  var STORE = 'flags';
  var KEY = 'firstVisitDone';
  var GUIDE_KEY = 'guideDone';
  var ICON_SRC = 'sources/favicon.png';
  var LOGO_SRC = 'sources/\u9e97\u63a2\u796d\u30ed\u30b4.png';
  var HOLD_MS = 2800;
  var EXIT_MS = 1800;
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

  function getFlag(key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readonly');
        var req = tx.objectStore(STORE).get(key);
        req.onsuccess = function () {
          resolve(req.result && req.result.value === true);
        };
        req.onerror = function () {
          reject(req.error);
        };
      });
    });
  }

  function setFlag(key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put({ key: key, value: true, at: Date.now() });
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

  function showGuideModal() {
    if (document.getElementById('rt-guide')) return;

    var overlay = document.createElement('div');
    overlay.id = 'rt-guide';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'rt-guide-title');
    overlay.innerHTML =
      '<div class="rt-guide-window">' +
      '<div class="rt-guide-titlebar">' +
      '<span class="rt-guide-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<h2 id="rt-guide-title" class="rt-guide-title">ようこそ麗探祭へ</h2>' +
      '<button type="button" class="rt-guide-x" aria-label="閉じる">✕</button>' +
      '</div>' +
      '<div class="rt-guide-body">' +
      '<section class="rt-guide-sec">' +
      '<h3>メニューの使い方</h3>' +
      '<ul>' +
      '<li><strong>長押し</strong>… 画面の任意の場所を長く押すと、放射状メニューが開きます。</li>' +
      '<li><strong>トリプルクリック / タップ</strong>… 3回連続で同じメニューが開きます。</li>' +
      '<li><strong>右下の ≡</strong>… ハンバーガー型の全画面メニューです。</li>' +
      '<li><strong>Ctrl / ⌘ + K</strong>… キーボードからも開閉できます。</li>' +
      '</ul>' +
      '</section>' +
      '<section class="rt-guide-sec">' +
      '<h3>サイトの使い方</h3>' +
      '<ul>' +
      '<li><strong>スケジュール</strong>… 全発表を時間・ゼミ・会場で絞り込めます。</li>' +
      '<li><strong>保存</strong>… 気になる発表を Myスケジュール に追加（この端末のみ）。</li>' +
      '<li><strong>ゼミ一覧</strong>… 各ゼミの概要と発表詳細を見られます。</li>' +
      '<li><strong>配色</strong>… 時刻に応じてテーマが変化します。</li>' +
      '</ul>' +
      '</section>' +
      '</div>' +
      '<div class="rt-guide-footer">' +
      '<button type="button" class="rt-guide-ok">はじめる</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
    });

    function close() {
      overlay.classList.remove('is-open');
      setFlag(GUIDE_KEY).catch(function () {});
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 280);
    }

    overlay.querySelector('.rt-guide-ok').addEventListener('click', close);
    overlay.querySelector('.rt-guide-x').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        close();
      }
    });
  }

  function runExit(el) {
    var inner = el.querySelector('.rt-splash-inner');
    if (!inner) {
      destroySplash(el);
      showGuideModal();
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
      showGuideModal();
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
      '<img class="rt-splash-icon" src="' + ICON_SRC + '" alt="" width="340" height="340" decoding="async">' +
      '<img class="rt-splash-logo" src="' + LOGO_SRC + '" alt="" width="200" height="200" decoding="async">' +
      '<p class="rt-splash-credit">Created by <span class="rt-splash-author">5G10 Haru Sato</span></p>' +
      '</div>';

    document.body.insertBefore(root, document.body.firstChild);

    var icon = root.querySelector('.rt-splash-icon');
    var started = false;
    var startHold = function () {
      if (started) return;
      started = true;
      root.classList.add('is-ready');
      setTimeout(function () {
        setFlag(KEY).catch(function () { /* ignore */ });
        runExit(root);
      }, HOLD_MS);
    };

    if (icon.complete && icon.naturalWidth) {
      startHold();
    } else {
      icon.addEventListener('load', startHold, { once: true });
      icon.addEventListener('error', startHold, { once: true });
      setTimeout(startHold, 4000);
    }
  }

  function init() {
    document.documentElement.classList.add('rt-splash-pending');

    Promise.all([
      getFlag(KEY).catch(function () { return true; }),
      preloadImage(ICON_SRC),
      preloadImage(LOGO_SRC)
    ])
      .then(function (results) {
        var visited = results[0];
        if (visited) {
          removePending();
          return;
        }
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

  init();
})();
