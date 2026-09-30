/**
 * Minimal Supabase REST client (anon / publishable key only).
 * NEVER embed the service_role key in frontend code.
 *
 * Env (hard-coded for this project site):
 *   URL:  https://zpdbigdzyktilsxpsvip.supabase.co
 *   Key:  publishable (sb_publishable_…)
 */
(function (global) {
  'use strict';

  var SUPABASE_URL = 'https://zpdbigdzyktilsxpsvip.supabase.co';
  /* Public publishable key — safe for browser when RLS is configured */
  var SUPABASE_ANON_KEY = 'sb_publishable_9qdYvZCsiExGZMUPSUqjaA_6AmIrTx4';

  function headers(extra) {
    var h = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) h[k] = extra[k];
      }
    }
    return h;
  }

  function rest(path, options) {
    var opts = options || {};
    return fetch(SUPABASE_URL + '/rest/v1/' + path, {
      method: opts.method || 'GET',
      headers: headers(opts.headers),
      body: opts.body != null ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      if (res.status === 204) return null;
      return res.text().then(function (text) {
        var data = null;
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = { raw: text };
          }
        }
        if (!res.ok) {
          var err = new Error(
            (data && (data.message || data.error_description || data.error)) ||
              ('Supabase HTTP ' + res.status)
          );
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  function upsertVisitorProfile(localId, profile) {
    if (!localId) return Promise.reject(new Error('local_id required'));
    var row = {
      local_id: localId,
      age_band: (profile && profile.age) || null,
      gender: (profile && profile.gender) || null,
      updated_at: new Date().toISOString()
    };
    return rest('visitor_profiles?on_conflict=local_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: row
    });
  }

  function listSavedSchedules(localId) {
    if (!localId) return Promise.resolve([]);
    var q =
      'saved_schedules?local_id=eq.' +
      encodeURIComponent(localId) +
      '&select=*&order=created_at.asc';
    return rest(q).then(function (rows) {
      return Array.isArray(rows) ? rows : [];
    });
  }

  function saveSchedule(localId, scheduleId, meta) {
    if (!localId || !scheduleId) {
      return Promise.reject(new Error('local_id and schedule_id required'));
    }
    return rest('saved_schedules?on_conflict=local_id,schedule_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: {
        local_id: localId,
        schedule_id: scheduleId,
        meta: meta || {},
        updated_at: new Date().toISOString()
      }
    });
  }

  function removeSchedule(localId, scheduleId) {
    var q =
      'saved_schedules?local_id=eq.' +
      encodeURIComponent(localId) +
      '&schedule_id=eq.' +
      encodeURIComponent(scheduleId);
    return rest(q, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  }

  function removeSchedules(localId, scheduleIds) {
    if (!scheduleIds || !scheduleIds.length) return Promise.resolve();
    var chain = Promise.resolve();
    scheduleIds.forEach(function (sid) {
      chain = chain.then(function () {
        return removeSchedule(localId, sid);
      });
    });
    return chain;
  }

  global.ReitansaiSupabase = {
    url: SUPABASE_URL,
    upsertVisitorProfile: upsertVisitorProfile,
    listSavedSchedules: listSavedSchedules,
    saveSchedule: saveSchedule,
    removeSchedule: removeSchedule,
    removeSchedules: removeSchedules
  };
})(typeof window !== 'undefined' ? window : this);
