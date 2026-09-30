/**
 * My schedule — localStorage only (no server / no Supabase).
 * Key: rt-my-schedule-cache
 * Depends: schedule-id.js (optional, for rangesOverlap)
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
   * @param {object} candidate - row with id, t, e, s, title, sp, form, v, vn, no
   * @param {object} [options] - { force: 'replace' | 'ok' | 'cancel' }
   * @returns {Promise<{ok, already?, conflicts?, cancelled?, rows?}>}
   */
  function save(candidate, options) {
    options = options || {};
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

    if (options.force === 'replace' && conflicts.length) {
      var ids = conflicts.map(function (c) {
        return c.id;
      });
      existing = existing.filter(function (r) {
        return ids.indexOf(r.id) < 0;
      });
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
      no: candidate.no,
      saved_at: new Date().toISOString()
    };

    if (!existing.some(function (r) {
      return r.id === candidate.id;
    })) {
      existing.push(meta);
    }
    writeCache(existing);
    return Promise.resolve({ ok: true, saved: true, rows: existing });
  }

  function remove(scheduleId) {
    var existing = readCache().filter(function (r) {
      return r.id !== scheduleId;
    });
    writeCache(existing);
    return Promise.resolve(existing);
  }

  function isSaved(scheduleId) {
    return readCache().some(function (r) {
      return r.id === scheduleId;
    });
  }

  /** Compatibility: previously fetched remote; now just returns local cache. */
  function fetchRemote() {
    return Promise.resolve(readCache());
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
