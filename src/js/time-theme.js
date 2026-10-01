(function () {
  'use strict';
  var ROOT = document.documentElement;
  var BODY = document.body;
  var LAT = 35.8360, LON = 139.9540;
  var WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LON +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m&timezone=Asia%2FTokyo';
  var lastWeather = null;
  var FIXED = { classic: 1, green: 1 };
  var LIGHT = { classic: 1, green: 1, light: 1 };

  function currentScheme() {
    if (window.ReitansaiThemeControl && window.ReitansaiThemeControl.getScheme)
      return window.ReitansaiThemeControl.getScheme();
    var s = ROOT.getAttribute('data-color-scheme') || 'dark';
    if (s === 'light') return 'classic';
    if (s === 'classic' || s === 'green' || s === 'dark') return s;
    return 'dark';
  }
  function atmosphereEnabled() {
    if (window.ReitansaiThemeControl && window.ReitansaiThemeControl.isAtmosphereOn)
      return window.ReitansaiThemeControl.isAtmosphereOn();
    return true;
  }
  function getJST() {
    var now = new Date();
    var utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 9 * 3600000);
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function wxCodeToClass(code, isDay) {
    if (code == null) return isDay ? 'wx-clear' : 'wx-night';
    if (code === 0) return isDay ? 'wx-clear' : 'wx-night';
    if (code <= 3) return 'wx-cloudy';
    if (code <= 48) return 'wx-fog';
    if (code <= 67 || code === 80 || code === 81 || code === 82) return 'wx-rain';
    if (code <= 77 || code === 85 || code === 86) return 'wx-snow';
    if (code >= 95) return 'wx-storm';
    return 'wx-cloudy';
  }
  function applyWxClass(cls) {
    var layer = document.getElementById('rt-atmosphere');
    if (!layer) return;
    layer.className = 'rt-atmosphere ' + cls;
  }
  function ensureAtmosphere() {
    if (document.getElementById('rt-atmosphere')) return;
    var el = document.createElement('div');
    el.id = 'rt-atmosphere';
    el.className = 'rt-atmosphere';
    el.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(el, document.body.firstChild);
  }
  function tickTime() {
    var jst = getJST();
    var h = jst.getHours();
    var m = jst.getMinutes();
    var scheme = currentScheme();
    ROOT.setAttribute('data-hour', String(h));
    ROOT.setAttribute('data-minute', String(m));
    if (FIXED[scheme]) {
      ROOT.removeAttribute('data-time-period');
    } else {
      var period = h < 5 ? 'night' : h < 8 ? 'dawn' : h < 11 ? 'morning' : h < 16 ? 'day' : h < 19 ? 'dusk' : 'night';
      ROOT.setAttribute('data-time-period', period);
    }
    if (!atmosphereEnabled()) {
      var layer = document.getElementById('rt-atmosphere');
      if (layer) layer.className = 'rt-atmosphere';
      return;
    }
    ensureAtmosphere();
    var isDay = h >= 6 && h < 18;
    if (lastWeather) {
      applyWxClass(wxCodeToClass(lastWeather.weather_code, lastWeather.is_day === 1));
    } else {
      applyWxClass(isDay ? 'wx-clear' : 'wx-night');
    }
  }
  function fetchWeather() {
    if (!atmosphereEnabled()) return Promise.resolve();
    return fetch(WEATHER_URL).then(function (r) { return r.json(); }).then(function (data) {
      if (data && data.current) {
        lastWeather = data.current;
        tickTime();
        try { sessionStorage.setItem('rt-wx', JSON.stringify({ t: Date.now(), c: data.current })); } catch (e) {}
      }
    }).catch(function () { tickTime(); });
  }
  function boot() {
    try {
      var cached = sessionStorage.getItem('rt-wx');
      if (cached) {
        var o = JSON.parse(cached);
        if (o && o.c && Date.now() - (o.t || 0) < 15 * 60 * 1000) lastWeather = o.c;
      }
    } catch (e) {}
    tickTime();
    fetchWeather();
    setInterval(tickTime, 30000);
    setInterval(fetchWeather, 10 * 60 * 1000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { tickTime(); fetchWeather(); }
    });
    document.addEventListener('rt-theme-change', function () {
      tickTime();
      if (atmosphereEnabled()) fetchWeather();
    });
    /* lightning animation disabled for performance */
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  (function () {
    if (document.getElementById('rt-header-nav-js')) return;
    var s = document.createElement('script');
    s.id = 'rt-header-nav-js';
    s.src = '/reitansai/src/js/header-nav.js';
    document.head.appendChild(s);
  })();

  window.ReitansaiTheme = {
    tick: tickTime,
    retick: tickTime,
    fetchWeather: fetchWeather,
    getJST: getJST,
    coords: { lat: LAT, lon: LON, label: 'Chiba Kashiwa' }
  };
})();
