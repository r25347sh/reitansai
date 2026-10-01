/* Service Worker — offline cache for 麗探祭 guide site
 * Network-first for schedule.json; cache-first for static assets.
 */
var CACHE = 'reitansai-v1';
var PRECACHE = [
  '/reitansai/',
  '/reitansai/index.html',
  '/reitansai/pages/schedule.html',
  '/reitansai/pages/my/my_schedule.html',
  '/reitansai/pages/venue.html',
  '/reitansai/pages/seminars/index.html',
  '/reitansai/src/css/common.css',
  '/reitansai/src/css/pages/schedule.css',
  '/reitansai/MENU/MENU.css',
  '/reitansai/MENU/MENU.js',
  '/reitansai/src/js/theme-control.js',
  '/reitansai/src/js/time-theme.js',
  '/reitansai/src/js/schedule-id.js',
  '/reitansai/src/js/my-schedule-store.js',
  '/reitansai/src/js/pages/schedule.js',
  '/reitansai/src/js/pages/my-schedule.js',
  '/reitansai/src/json/schedule.json',
  '/reitansai/src/json/schedule-nos.json',
  '/reitansai/sources/favicon.png',
  '/reitansai/manifest.webmanifest'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE.map(function (u) {
        return new Request(u, { cache: 'reload' });
      })).catch(function () {
        /* partial precache is ok */
      });
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
          return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  var isScheduleData =
    url.pathname.indexOf('/src/json/schedule') >= 0;

  if (isScheduleData) {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) {
            c.put(req, clone);
          });
          return res;
        })
        .catch(function () {
          return caches.match(req);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      var fetched = fetch(req)
        .then(function (res) {
          if (res && res.ok && url.pathname.indexOf('/reitansai/') === 0) {
            var clone = res.clone();
            caches.open(CACHE).then(function (c) {
              c.put(req, clone);
            });
          }
          return res;
        })
        .catch(function () {
          return cached;
        });
      return cached || fetched;
    })
  );
});
