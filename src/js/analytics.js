/**
 * Usage analytics → Supabase analytics_events
 * Admin sessions are NEVER tracked.
 */
(function (global) {
  'use strict';

  var QUEUE_KEY = 'rt-analytics-queue';

  function isAdmin() {
    try {
      return window.ReitansaiUser && window.ReitansaiUser.isAdminMode && window.ReitansaiUser.isAdminMode();
    } catch (e) {
      return false;
    }
  }

  function profileSnapshot() {
    var U = global.ReitansaiUser;
    var p = (U && U.getProfile && U.getProfile()) || {};
    return {
      age_band: p.age || null,
      gender: p.gender || null,
      role: p.role || null
    };
  }

  function localId() {
    var U = global.ReitansaiUser;
    if (!U) return null;
    try {
      return U.getLocalId() || U.ensureLocalId();
    } catch (e) {
      return null;
    }
  }

  function readQueue() {
    try {
      var raw = localStorage.getItem(QUEUE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeQueue(arr) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(arr.slice(-80)));
    } catch (e) {}
  }

  function track(eventName, props) {
    if (!eventName) return;
    if (isAdmin()) return;
    var row = {
      local_id: localId(),
      event_name: String(eventName).slice(0, 64),
      event_props: Object.assign({}, profileSnapshot(), props || {}),
      path: (location.pathname || '') + (location.search || ''),
      created_at: new Date().toISOString()
    };
    var q = readQueue();
    q.push(row);
    writeQueue(q);
    flushSoon();
  }

  var flushTimer = null;
  function flushSoon() {
    if (flushTimer) return;
    flushTimer = setTimeout(function () {
      flushTimer = null;
      flush();
    }, 400);
  }

  function flush() {
    if (isAdmin()) {
      writeQueue([]);
      return Promise.resolve();
    }
    var SB = global.ReitansaiSupabase;
    if (!SB || typeof SB.insertAnalyticsEvents !== 'function') return Promise.resolve();
    var q = readQueue();
    if (!q.length) return Promise.resolve();
    writeQueue([]);
    return SB.insertAnalyticsEvents(q).catch(function () {
      writeQueue(q.concat(readQueue()));
    });
  }

  function trackPageView() {
    track('page_view', {
      title: document.title || '',
      referrer: document.referrer ? String(document.referrer).slice(0, 200) : ''
    });
  }

  function boot() {
    if (isAdmin()) return;
    trackPageView();
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', function () {
      flush();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.ReitansaiAnalytics = {
    track: track,
    flush: flush,
    trackPageView: trackPageView
  };
})(typeof window !== 'undefined' ? window : this);
