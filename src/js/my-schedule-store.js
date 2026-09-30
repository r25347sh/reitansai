/**
 * My schedule: local cache + Supabase sync, conflict detection.
 * Depends: user-id.js, schedule-id.js, supabase-client.js
 */
(function (global) {
  'use strict';

  var CACHE_KEY = 'rt-my-schedule-cache';

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

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeCache(rows) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(rows || []));
    } catch (e) {}
  }

  function rowFromMeta(meta, scheduleId) {
    var m = meta || {};
    return {
      id: scheduleId || m.id,
      t: m.t || '',
      e: m.e || '',
      s: m.s || '',
      title: m.title || '',
      sp: m.sp || '',
      form: m.form || '',
      v: m.v || '',
      vn: m.vn || '',
      no: m.no || ''
    };
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

  function ensureUser() {
    var U = global.ReitansaiUser;
    if (!U) return null;
    if (!U.hasConsented()) return null;
    return U.ensureLocalId();
  }

  function serverToRows(serverRows) {
    return (serverRows || []).map(function (r) {
      return rowFromMeta(r.meta, r.schedule_id);
    });
  }

  function fetchRemote() {
    var localId = ensureUser();
    if (!localId || !global.ReitansaiSupabase) {
      return Promise.resolve(readCache());
    }
    return global.ReitansaiSupabase.listSavedSchedules(localId)
      .then(function (rows) {
        var mapped = serverToRows(rows);
        writeCache(mapped);
        return mapped;
      })
      .catch(function () {
        return readCache();
      });
  }

  function save(candidate, options) {
    options = options || {};
    var localId = ensureUser();
    if (!localId) {
      return Promise.reject(new Error('同意後に利用できます。ページを再読み込みしてください。'));
    }

    var existing = readCache();
    var already = existing.some(function (r) {
      return r.id === candidate.id;
    });
    if (already) {
      return Promise.resolve({ ok: true, already: true, rows: existing });
    }

    var conflicts = findConflicts(candidate, existing);
    if (conflicts.length && !options.force) {
      return Promise.resolve({ ok: false, conflicts: conflicts, candidate: candidate });
    }
    if (options.force === 'cancel') {
      return Promise.resolve({ ok: false, cancelled: true });
    }

    var chain = Promise.resolve();
    if (options.force === 'replace' && conflicts.length) {
      var ids = conflicts.map(function (c) {
        return c.id;
      });
      existing = existing.filter(function (r) {
        return ids.indexOf(r.id) < 0;
      });
      writeCache(existing);
      if (global.ReitansaiSupabase) {
        chain = global.ReitansaiSupabase.removeSchedules(localId, ids);
      }
    }

    var meta = {
      id: candidate.id,
      t: candidate.t,
      e: candidate.e,
      s: candidate.s,
      title: candidate.title,
      sp: candidate.sp,
      form: candidate.form,
      v: candidate.v,
      vn: candidate.vn,
      no: candidate.no
    };

    return chain
      .then(function () {
        if (global.ReitansaiSupabase) {
          return global.ReitansaiSupabase.saveSchedule(localId, candidate.id, meta);
        }
      })
      .then(function () {
        existing = readCache();
        if (!existing.some(function (r) { return r.id === candidate.id; })) {
          existing.push(meta);
          writeCache(existing);
        }
        return { ok: true, saved: true, rows: existing };
      });
  }

  function remove(scheduleId) {
    var localId = ensureUser();
    var existing = readCache().filter(function (r) {
      return r.id !== scheduleId;
    });
    writeCache(existing);
    if (localId && global.ReitansaiSupabase) {
      return global.ReitansaiSupabase.removeSchedule(localId, scheduleId).then(function () {
        return existing;
      }).catch(function () {
        return existing;
      });
    }
    return Promise.resolve(existing);
  }

  function isSaved(scheduleId) {
    return readCache().some(function (r) {
      return r.id === scheduleId;
    });
  }

  global.ReitansaiMySchedule = {
    readCache: readCache,
    writeCache: writeCache,
    fetchRemote: fetchRemote,
    save: save,
    remove: remove,
    isSaved: isSaved,
    findConflicts: findConflicts,
    toMinutes: toMinutes
  };
})(typeof window !== 'undefined' ? window : this);
