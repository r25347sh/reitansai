/**
 * Usage analytics → Supabase analytics_events
 * Free-tier conscious:
 *  - admin never tracked
 *  - page_view once per path per browser session
 *  - batch + delayed flush (reduces API round-trips / egress)
 *  - small queue, lean payloads
 */
(function (global) {
  'use strict';

  var QUEUE_KEY = 'rt-analytics-queue';
  var PV_KEY = 'rt-pv-session'; /* sessionStorage: paths already counted */
  var FLUSH_MS = 2800;
  var MAX_QUEUE = 40;

  function isAdmin() {
    try {
      return (
        window.ReitansaiUser &&
        window.ReitansaiUser.isAdminMode &&
        window.ReitansaiUser.isAdminMode()
      );
    } catch (e) {
      return false;
    }
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
      localStorage.setItem(QUEUE_KEY, JSON.stringify(arr.slice(-MAX_QUEUE)));
    } catch (e) {}
  }

  function track(eventName, props) {
    if (!eventName) return;
    if (isAdmin()) return;
    var lid = localId();
    if (!lid) return;
    var row = {
      local_id: lid,
      event_name: String(eventName).slice(0, 48),
      event_props: props || {},
      path: (location.pathname || '').slice(0, 120),
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
    }, FLUSH_MS);
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
      writeQueue(q.concat(readQueue()).slice(-MAX_QUEUE));
    });
  }

  function trackPageView() {
    if (isAdmin()) return;
    var path = location.pathname || '/';
    try {
      var raw = sessionStorage.getItem(PV_KEY);
      var seen = raw ? JSON.parse(raw) : {};
      if (seen[path]) return; /* once per path / session */
      seen[path] = 1;
      sessionStorage.setItem(PV_KEY, JSON.stringify(seen));
    } catch (e) {}
    track('page_view', {});
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
