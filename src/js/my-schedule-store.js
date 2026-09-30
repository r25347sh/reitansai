/**
 * My schedule — IndexedDB only (no server).
 * DB: reitansai-my-schedule / store: items
 * Legacy localStorage key rt-my-schedule-cache is wiped on load (no migrate).
 * Depends: schedule-id.js (optional, for rangesOverlap)
 */
(function (global) {
  'use strict';

  var DB_NAME = 'reitansai-my-schedule';
  var DB_VERSION = 1;
  var STORE = 'items';
  var LEGACY_LS_KEY = 'rt-my-schedule-cache';
  var dbPromise = null;
  var purgedLegacy = false;

  function toMinutes(t) {
    if (t == null || t === '') return -1;
    var s = String(t)
      .replace(/[０-９]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
      })
      .replace(/[：．]/g, ':')
      .trim();
    var m = s.match(/(\d{1,2})\s*:\s*(\d{1,2})/);
    if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    return -1;
  }

  function purgeLegacyLocalStorage() {
    if (purgedLegacy) return;
    purgedLegacy = true;
    try {
      localStorage.removeItem(LEGACY_LS_KEY);
    } catch (e) { /* ignore */ }
  }

  function openDB() {
    if (dbPromise) return dbPromise;
    purgeLegacyLocalStorage();
    dbPromise = new Promise(function (resolve, reject) {
      if (!global.indexedDB) {
        reject(new Error('このブラウザは IndexedDB に対応していません'));
        return;
      }
      var req = global.indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = function () {
        reject(req.error || new Error('IndexedDB を開けませんでした'));
      };
      req.onupgradeneeded = function (ev) {
        var db = ev.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function () {
        resolve(req.result);
      };
    });
    return dbPromise;
  }

  /** @returns {Promise<object[]>} */
  function listRows() {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readonly');
        var store = tx.objectStore(STORE);
        var req = store.getAll();
        req.onsuccess = function () {
          resolve(Array.isArray(req.result) ? req.result : []);
        };
        req.onerror = function () {
          reject(req.error);
        };
        tx.onerror = function () {
          reject(tx.error);
        };
      });
    });
  }

  /** Alias for callers; always returns a Promise<object[]> */
  function readCache() {
    return listRows();
  }

  function findConflicts(candidate, existing) {
    var cs = toMinutes(candidate.t);
    var ce = toMinutes(candidate.e);
    var overlap = global.ReitansaiScheduleId
      ? global.ReitansaiScheduleId.rangesOverlap
      : function (a, b, c, d) {
          return a < d && c < b;
        };
    return (existing || []).filter(function (ex) {
      if (ex.id && candidate.id && ex.id === candidate.id) return false;
      return overlap(cs, ce, toMinutes(ex.t), toMinutes(ex.e));
    });
  }

  /**
   * @param {object} candidate
   * @param {object} [options] - { force: 'replace' | 'ok' | 'cancel' }
   */
  function save(candidate, options) {
    options = options || {};
    if (!candidate || !candidate.id) {
      return Promise.reject(new Error('不正な発表データです'));
    }

    return listRows().then(function (existing) {
      var already = existing.some(function (r) {
        return r.id === candidate.id;
      });
      if (already) {
        return { ok: true, already: true, rows: existing };
      }

      var conflicts = findConflicts(candidate, existing);
      if (conflicts.length && !options.force) {
        return { ok: false, conflicts: conflicts, candidate: candidate };
      }
      if (options.force === 'cancel') {
        return { ok: false, cancelled: true };
      }

      var removeIds = [];
      if (options.force === 'replace' && conflicts.length) {
        conflicts.forEach(function (c) {
          if (c.id) removeIds.push(c.id);
        });
      }

      var row = {
        id: candidate.id,
        t: candidate.t || '',
        e: candidate.e || '',
        s: candidate.s || '',
        title: candidate.title || '',
        sp: candidate.sp || '',
        form: candidate.form || '',
        v: candidate.v || '',
        vn: candidate.vn || '',
        no: candidate.no != null ? candidate.no : '',
        savedAt: Date.now()
      };

      return openDB().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction(STORE, 'readwrite');
          var store = tx.objectStore(STORE);
          removeIds.forEach(function (id) {
            store.delete(id);
          });
          store.put(row);
          tx.oncomplete = function () {
            var next = existing.filter(function (r) {
              return removeIds.indexOf(r.id) < 0;
            });
            next.push(row);
            resolve({ ok: true, saved: true, rows: next });
          };
          tx.onerror = function () {
            reject(tx.error || new Error('保存に失敗しました'));
          };
        });
      });
    });
  }

  function remove(id) {
    if (!id) return listRows();
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        var store = tx.objectStore(STORE);
        store.delete(id);
        var req = store.getAll();
        var rows = [];
        req.onsuccess = function () {
          rows = Array.isArray(req.result) ? req.result : [];
        };
        tx.oncomplete = function () {
          resolve(rows);
        };
        tx.onerror = function () {
          reject(tx.error || new Error('削除に失敗しました'));
        };
      });
    });
  }

  /** Wipe all My-schedule data (IndexedDB + legacy localStorage). */
  function clearAll() {
    purgeLegacyLocalStorage();
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = function () {
          resolve([]);
        };
        tx.onerror = function () {
          reject(tx.error || new Error('クリアに失敗しました'));
        };
      });
    });
  }

  // Wipe legacy localStorage immediately (user requested full reset of existing schedules)
  purgeLegacyLocalStorage();

  global.ReitansaiMySchedule = {
    readCache: readCache,
    list: listRows,
    save: save,
    remove: remove,
    clearAll: clearAll,
    toMinutes: toMinutes
  };
})(typeof window !== 'undefined' ? window : this);
