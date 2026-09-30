/**
 * Minimal Supabase REST client (anon / publishable key only).
 * Free-tier conscious: Prefer return=minimal where possible, narrow select.
 */
(function (global) {
  'use strict';

  var SUPABASE_URL = 'https://zpdbigdzyktilsxpsvip.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_9qdYvZCsiExGZMUPSUqjaA_6AmIrTx4';

  function headers(extra) {
    var h = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
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
      if (res.status === 204 || res.status === 201) {
        var ct = res.headers.get('content-type') || '';
        if (!ct.includes('json')) return null;
      }
      if (!res.ok) {
        return res.text().then(function (t) {
          throw new Error('Supabase ' + res.status + ': ' + (t || '').slice(0, 200));
        });
      }
      if (res.status === 204) return null;
      return res.json().catch(function () {
        return null;
      });
    });
  }

  function upsertVisitorProfile(localId, profile) {
    if (!localId) return Promise.reject(new Error('local_id required'));
    profile = profile || {};
    return rest('visitor_profiles?on_conflict=local_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: {
        local_id: localId,
        age_band: profile.age || profile.age_band || null,
        gender: profile.gender || null,
        role: profile.role || null,
        consented_at: profile.consentedAt || profile.consented_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
  }

  function listSavedSchedules(localId) {
    if (!localId) return Promise.resolve([]);
    var q =
      'saved_schedules?local_id=eq.' +
      encodeURIComponent(localId) +
      '&select=schedule_id,meta,updated_at&order=updated_at.asc';
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
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: {
        local_id: localId,
        schedule_id: String(scheduleId),
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
      encodeURIComponent(String(scheduleId));
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

  function insertAnalyticsEvents(rows) {
    if (!rows || !rows.length) return Promise.resolve([]);
    return rest('analytics_events', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: rows
    });
  }

  global.ReitansaiSupabase = {
    url: SUPABASE_URL,
    upsertVisitorProfile: upsertVisitorProfile,
    listSavedSchedules: listSavedSchedules,
    saveSchedule: saveSchedule,
    removeSchedule: removeSchedule,
    removeSchedules: removeSchedules,
    insertAnalyticsEvents: insertAnalyticsEvents
  };
})(typeof window !== 'undefined' ? window : this);
