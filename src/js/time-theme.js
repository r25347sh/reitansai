(function () {
  'use strict';
  var ROOT = document.documentElement;
  var LAT = 35.8360, LON = 139.9540;
  var WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LON +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m&timezone=Asia%2FTokyo';
  var lastWeather = null;
  var FIXED = { classic: 1, green: 1 };
  var LIGHT = { classic: 1, green: 1, light: 1 };

  /* Expo window (JST minutes-of-day): 9:00–12:00 = 540–720 */
  var EXPO_START = 9 * 60;
  var EXPO_END = 12 * 60;

  /**
   * Waypoints for dark-scheme continuous palette (readability locked:
   * text is always near-white, bg stays deep enough for WCAG AA).
   * Dramatic hue / glow / accent shifts every ~15–20 min during expo.
   */
  var EXPO_STOPS = [
    { m: 540, bg: '#070b14', soft: '#0c1220', card: '#10182a', text: '#eef4ff', muted: '#9eb0cc', accent: '#6eb6ff', glow: 'rgba(80,160,255,0.38)', lab: '#7ad4ff', border: 'rgba(140,180,255,0.18)' },
    { m: 555, bg: '#081018', soft: '#0e1624', card: '#121c2e', text: '#f0f5ff', muted: '#a0b4ce', accent: '#7ec8ff', glow: 'rgba(90,180,255,0.42)', lab: '#8ae0ff', border: 'rgba(150,190,255,0.20)' },
    { m: 570, bg: '#0a1016', soft: '#121a24', card: '#151f2c', text: '#f2f6fa', muted: '#a4b6c8', accent: '#c9a227', glow: 'rgba(201,162,39,0.28)', lab: '#5ec8c8', border: 'rgba(180,200,230,0.16)' },
    { m: 585, bg: '#0c1214', soft: '#141c1e', card: '#182226', text: '#f4f8f6', muted: '#a8b8b4', accent: '#e0b84a', glow: 'rgba(255,200,80,0.32)', lab: '#6ed4c0', border: 'rgba(200,190,140,0.18)' },
    { m: 600, bg: '#0e1012', soft: '#16181c', card: '#1a1e24', text: '#f6f4f0', muted: '#b0a89c', accent: '#ff9a3c', glow: 'rgba(255,150,60,0.36)', lab: '#ffc86e', border: 'rgba(230,170,100,0.20)' },
    { m: 615, bg: '#0c1214', soft: '#141c20', card: '#18242a', text: '#f0f8f8', muted: '#9cb8b8', accent: '#3dd6c3', glow: 'rgba(60,220,200,0.34)', lab: '#7aefe0', border: 'rgba(100,210,200,0.20)' },
    { m: 630, bg: '#0a1018', soft: '#121a26', card: '#162030', text: '#eef4ff', muted: '#9cb0cc', accent: '#5a9cff', glow: 'rgba(90,160,255,0.40)', lab: '#8ec8ff', border: 'rgba(130,180,255,0.22)' },
    { m: 645, bg: '#0c0e16', soft: '#161820', card: '#1c1e2a', text: '#f4f2fa', muted: '#b0a8c0', accent: '#c86bff', glow: 'rgba(180,100,255,0.34)', lab: '#e0a0ff', border: 'rgba(180,140,255,0.20)' },
    { m: 660, bg: '#100e12', soft: '#1a161c', card: '#221c24', text: '#faf4f6', muted: '#c0a8b0', accent: '#ff6b9a', glow: 'rgba(255,100,150,0.32)', lab: '#ffb0c8', border: 'rgba(255,140,180,0.18)' },
    { m: 675, bg: '#120e0c', soft: '#1c1612', card: '#261c16', text: '#faf6f0', muted: '#c0b0a0', accent: '#ff8c42', glow: 'rgba(255,140,60,0.36)', lab: '#ffc080', border: 'rgba(255,160,100,0.20)' },
    { m: 690, bg: '#100c10', soft: '#1a1418', card: '#241c22', text: '#f8f0f4', muted: '#b8a4b0', accent: '#d4a0ff', glow: 'rgba(180,120,255,0.30)', lab: '#c8b0ff', border: 'rgba(180,140,220,0.18)' },
    { m: 720, bg: '#0e0c12', soft: '#16141c', card: '#1e1a24', text: '#f2eef6', muted: '#a898b0', accent: '#a070ff', glow: 'rgba(140,100,255,0.28)', lab: '#b090ff', border: 'rgba(160,130,220,0.16)' }
  ];

  var DAY_STOPS = [
    { m: 0,   bg: '#05060c', soft: '#0a0c14', card: '#0e1018', text: '#e4eaf6', muted: '#8a96aa', accent: '#7a9ad4', glow: 'rgba(80,120,200,0.22)', lab: '#6a8ec0', border: 'rgba(120,140,180,0.12)' },
    { m: 300, bg: '#060810', soft: '#0c1018', card: '#10141e', text: '#e6ecf8', muted: '#8e9ab0', accent: '#6a9ae0', glow: 'rgba(70,140,220,0.26)', lab: '#7ab0f0', border: 'rgba(110,150,210,0.14)' },
    { m: 360, bg: '#080c14', soft: '#0e1420', card: '#121a28', text: '#eaf0fa', muted: '#96a6bc', accent: '#5a9cff', glow: 'rgba(90,160,255,0.32)', lab: '#8ac8ff', border: 'rgba(130,170,230,0.16)' },
    { m: 480, bg: '#0a1016', soft: '#121a22', card: '#162028', text: '#eef4fa', muted: '#9aacc0', accent: '#c9a227', glow: 'rgba(201,162,39,0.24)', lab: '#5ec8c8', border: 'rgba(180,200,230,0.14)' },
    { m: 540, bg: '#070b14', soft: '#0c1220', card: '#10182a', text: '#eef4ff', muted: '#9eb0cc', accent: '#6eb6ff', glow: 'rgba(80,160,255,0.38)', lab: '#7ad4ff', border: 'rgba(140,180,255,0.18)' },
    { m: 720, bg: '#0e0c12', soft: '#16141c', card: '#1e1a24', text: '#f2eef6', muted: '#a898b0', accent: '#a070ff', glow: 'rgba(140,100,255,0.28)', lab: '#b090ff', border: 'rgba(160,130,220,0.16)' },
    { m: 780, bg: '#0c1014', soft: '#141a20', card: '#1a2228', text: '#eef4f8', muted: '#9aacb8', accent: '#d4ad2e', glow: 'rgba(212,173,46,0.22)', lab: '#6ed0d0', border: 'rgba(190,210,235,0.14)' },
    { m: 1020, bg: '#100c0a', soft: '#1a1410', card: '#241c16', text: '#faf4ee', muted: '#b8a898', accent: '#ff9a4a', glow: 'rgba(255,140,60,0.30)', lab: '#ffb878', border: 'rgba(230,160,100,0.16)' },
    { m: 1140, bg: '#08060c', soft: '#0e0c14', card: '#14101a', text: '#e8e4f0', muted: '#9088a0', accent: '#8a70d0', glow: 'rgba(120,100,200,0.24)', lab: '#a090e0', border: 'rgba(140,120,190,0.12)' },
    { m: 1440, bg: '#05060c', soft: '#0a0c14', card: '#0e1018', text: '#e4eaf6', muted: '#8a96aa', accent: '#7a9ad4', glow: 'rgba(80,120,200,0.22)', lab: '#6a8ec0', border: 'rgba(120,140,180,0.12)' }
  ];

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

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  }
  function rgbToHex(r, g, b) {
    function h(n) {
      n = Math.max(0, Math.min(255, Math.round(n)));
      var s = n.toString(16);
      return s.length < 2 ? '0' + s : s;
    }
    return '#' + h(r) + h(g) + h(b);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpHex(a, b, t) {
    var A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(lerp(A.r, B.r, t), lerp(A.g, B.g, t), lerp(A.b, B.b, t));
  }
  function parseRgba(s) {
    var m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/.exec(s);
    if (!m) return { r: 100, g: 180, b: 255, a: 0.22 };
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] != null ? +m[4] : 1 };
  }
  function lerpRgba(a, b, t) {
    var A = parseRgba(a), B = parseRgba(b);
    return 'rgba(' +
      Math.round(lerp(A.r, B.r, t)) + ',' +
      Math.round(lerp(A.g, B.g, t)) + ',' +
      Math.round(lerp(A.b, B.b, t)) + ',' +
      (Math.round(lerp(A.a, B.a, t) * 1000) / 1000) + ')';
  }

  function sampleStops(stops, minOfDay) {
    var i = 0;
    while (i < stops.length - 1 && stops[i + 1].m <= minOfDay) i++;
    var a = stops[i];
    var b = stops[Math.min(i + 1, stops.length - 1)];
    var span = Math.max(1, b.m - a.m);
    var t = (minOfDay - a.m) / span;
    t = Math.max(0, Math.min(1, t));
    t = t * t * (3 - 2 * t);
    return {
      bg: lerpHex(a.bg, b.bg, t),
      soft: lerpHex(a.soft, b.soft, t),
      card: lerpHex(a.card, b.card, t),
      text: lerpHex(a.text, b.text, t),
      muted: lerpHex(a.muted, b.muted, t),
      accent: lerpHex(a.accent, b.accent, t),
      glow: lerpRgba(a.glow, b.glow, t),
      lab: lerpHex(a.lab, b.lab, t),
      border: lerpRgba(a.border, b.border, t)
    };
  }

  function periodName(minOfDay) {
    if (minOfDay >= EXPO_START && minOfDay < EXPO_END) {
      if (minOfDay < 555) return 'expo-open';
      if (minOfDay < 585) return 'expo-early';
      if (minOfDay < 615) return 'expo-amber';
      if (minOfDay < 645) return 'expo-teal';
      if (minOfDay < 675) return 'expo-violet';
      if (minOfDay < 700) return 'expo-late';
      return 'expo-close';
    }
    if (minOfDay < 300) return 'night';
    if (minOfDay < 360) return 'pre-dawn';
    if (minOfDay < 480) return 'dawn';
    if (minOfDay < EXPO_START) return 'morning';
    if (minOfDay < 1020) return 'afternoon';
    if (minOfDay < 1140) return 'dusk';
    return 'night';
  }

  function applyPalette(p) {
    ROOT.style.setProperty('--rt-bg', p.bg);
    ROOT.style.setProperty('--rt-bg-soft', p.soft);
    ROOT.style.setProperty('--rt-card', p.card);
    ROOT.style.setProperty('--rt-card-hover', p.card);
    ROOT.style.setProperty('--rt-text', p.text);
    ROOT.style.setProperty('--rt-text-muted', p.muted);
    ROOT.style.setProperty('--rt-accent', p.accent);
    try {
      var ac = hexToRgb(p.accent);
      ROOT.style.setProperty('--rt-accent-soft', 'rgba(' + ac.r + ',' + ac.g + ',' + ac.b + ',0.18)');
    } catch (e) {}
    ROOT.style.setProperty('--rt-glow', p.glow);
    ROOT.style.setProperty('--rt-lab', p.lab);
    ROOT.style.setProperty('--rt-border', p.border);
  }

  function clearPalette() {
    ['--rt-bg', '--rt-bg-soft', '--rt-card', '--rt-card-hover', '--rt-text', '--rt-text-muted',
      '--rt-accent', '--rt-accent-soft', '--rt-glow', '--rt-lab', '--rt-border'].forEach(function (k) {
      ROOT.style.removeProperty(k);
    });
  }

  function wxCodeToClass(code, isDay) {
    if (code == null) return isDay ? 'wx-clear' : 'wx-night';
    if (code === 0) return isDay ? 'wx-clear' : 'wx-night';
    if (code <= 2) return isDay ? 'wx-clear' : 'wx-night';
    if (code === 3) return 'wx-partly';
    if (code <= 48) return 'wx-fog';
    if (code <= 55) return 'wx-rain';
    if (code <= 67 || code === 80 || code === 81 || code === 82) return 'wx-rain-heavy';
    if (code <= 77 || code === 85 || code === 86) return 'wx-snow';
    if (code >= 95) return 'wx-storm';
    return 'wx-cloudy';
  }

  function applyWxClass(cls) {
    var layer = document.getElementById('rt-atmosphere');
    if (!layer) return;
    var jst = getJST();
    var h = jst.getHours();
    var dayNight = (h >= 6 && h < 18) ? 'day' : 'night';
    layer.className = 'rt-atmosphere ' + cls + ' ' + dayNight;
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
    var s = jst.getSeconds();
    var minOfDay = h * 60 + m + s / 60;
    var scheme = currentScheme();
    ROOT.setAttribute('data-hour', String(h));
    ROOT.setAttribute('data-minute', String(m));
    ROOT.setAttribute('data-min-of-day', String(Math.floor(minOfDay)));

    if (FIXED[scheme]) {
      ROOT.removeAttribute('data-time-period');
      ROOT.removeAttribute('data-expo-phase');
      ROOT.removeAttribute('data-expo');
      clearPalette();
    } else {
      var period = periodName(minOfDay);
      ROOT.setAttribute('data-time-period', period);
      if (minOfDay >= EXPO_START && minOfDay < EXPO_END) {
        ROOT.setAttribute('data-expo-phase', period);
        ROOT.setAttribute('data-expo', '1');
      } else {
        ROOT.removeAttribute('data-expo-phase');
        ROOT.removeAttribute('data-expo');
      }
      var stops = (minOfDay >= EXPO_START && minOfDay <= EXPO_END) ? EXPO_STOPS : DAY_STOPS;
      applyPalette(sampleStops(stops, minOfDay));
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
    setInterval(function () { tickTime(); }, 15000);
    setInterval(fetchWeather, 10 * 60 * 1000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { tickTime(); fetchWeather(); }
    });
    document.addEventListener('rt-theme-change', function () {
      tickTime();
      if (atmosphereEnabled()) fetchWeather();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  (function () {
    if (document.getElementById('rt-header-nav-js')) return;
    var s = document.createElement('script');
    s.id = 'rt-header-nav-js';
    s.src = (function () {
      try {
        var list = document.getElementsByTagName('script');
        for (var i = list.length - 1; i >= 0; i--) {
          var a = list[i].src || '';
          var k = a.indexOf('/src/js/');
          if (k !== -1) return a.substring(0, k + 1) + 'src/js/header-nav.js';
        }
      } catch (e) {}
      var p = location.pathname || '';
      if (/\/pages\/seminars\//.test(p)) return '../../src/js/header-nav.js';
      if (/\/pages\//.test(p)) return '../src/js/header-nav.js';
      return 'src/js/header-nav.js';
    })();
    document.head.appendChild(s);
  })();

  window.ReitansaiTheme = {
    tick: tickTime,
    retick: tickTime,
    fetchWeather: fetchWeather,
    getJST: getJST,
    coords: { lat: LAT, lon: LON, label: 'Chiba Kashiwa' },
    sampleStops: sampleStops,
    EXPO_STOPS: EXPO_STOPS
  };
})();
