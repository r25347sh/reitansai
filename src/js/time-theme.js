(function () {
  'use strict';
  var ROOT = document.documentElement;
  var BODY = document.body;
  var LAT = 35.8360, LON = 139.9540;
  var WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=' + LAT + '&longitude=' + LON +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m&timezone=Asia%2FTokyo';
  var lastWeather = null;
  var FIXED = { sakura: 1, ocean: 1, midnight: 1 };
  var LIGHT = { classic: 1, green: 1, sakura: 1, ocean: 1, light: 1 };

  function currentScheme() {
    if (window.ReitansaiThemeControl && window.ReitansaiThemeControl.getScheme)
      return window.ReitansaiThemeControl.getScheme();
    var s = ROOT.getAttribute('data-color-scheme') || 'dark';
    if (s === 'light') return 'classic';
    return s;
  }
  function atmosphereEnabled() {
    if (window.ReitansaiThemeControl && window.ReitansaiThemeControl.isAtmosphereOn)
      return window.ReitansaiThemeControl.isAtmosphereOn();
    return ROOT.getAttribute('data-atmosphere') !== 'off';
  }
  function isLight(s) { return !!LIGHT[s]; }

  function clearInlineVars() {
    ['--rt-hue','--rt-bg','--rt-bg-soft','--rt-card','--rt-card-hover','--rt-text','--rt-text-muted',
     '--rt-accent','--rt-accent-soft','--rt-border','--rt-glow','--rt-lab','--rt-grain','--rt-sat-boost','--rt-wx-opacity']
      .forEach(function (k) { ROOT.style.removeProperty(k); });
  }

  function setLayer(weather, period, isDay) {
    var layer = document.getElementById('rt-atmosphere');
    if (!layer) return;
    if (!atmosphereEnabled() || weather === 'off') {
      layer.className = 'rt-atmosphere wx-off';
      layer.style.display = 'none';
      return;
    }
    layer.style.display = '';
    layer.className = 'rt-atmosphere wx-' + weather + ' pd-' + period + (isDay ? ' day' : ' night');
    if (weather === 'storm' && !layer.querySelector('.rt-atm-lightning')) {
      var b = document.createElement('div');
      b.className = 'rt-atm-lightning';
      b.setAttribute('aria-hidden', 'true');
      layer.appendChild(b);
    }
  }

  function getJST() {
    var fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
    var parts = fmt.formatToParts(new Date());
    var get = function (t) { return parseInt(parts.find(function (p) { return p.type === t; }).value, 10); };
    var h = get('hour'), m = get('minute'), s = get('second');
    return { h: h, m: m, s: s, hours: h + m / 60 + s / 3600 };
  }
  function periodFromHours(hours) {
    if (hours >= 4.5 && hours < 6.5) return 'dawn';
    if (hours >= 6.5 && hours < 10) return 'morning';
    if (hours >= 10 && hours < 15) return 'noon';
    if (hours >= 15 && hours < 17.5) return 'afternoon';
    if (hours >= 17.5 && hours < 19.5) return 'dusk';
    if (hours >= 19.5 && hours < 22.5) return 'night';
    return 'late';
  }
  function weatherKind(code, precip, cloud) {
    if (code == null) return 'partly';
    if (code === 0) return 'clear';
    if (code <= 3) return cloud >= 70 ? 'cloudy' : 'partly';
    if (code >= 45 && code <= 48) return 'fog';
    if (code >= 51 && code <= 67) return precip > 2 ? 'rain-heavy' : 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rain';
    if (code >= 85 && code <= 86) return 'snow';
    if (code >= 95) return 'storm';
    return 'cloudy';
  }

  function paletteDark(period, kind, isDay) {
    var map = {
      dawn: { hue: 18, sat: 42, bgL: 8, textL: 94, acc: 28 },
      morning: { hue: 195, sat: 38, bgL: 11, textL: 92, acc: 48 },
      noon: { hue: 205, sat: 32, bgL: 15, textL: 90, acc: 42 },
      afternoon: { hue: 32, sat: 40, bgL: 10, textL: 93, acc: 25 },
      dusk: { hue: 305, sat: 44, bgL: 7, textL: 94, acc: 330 },
      night: { hue: 235, sat: 48, bgL: 5, textL: 93, acc: 185 },
      late: { hue: 250, sat: 46, bgL: 4, textL: 91, acc: 210 }
    };
    var b = map[period] || map.night;
    var hue = b.hue, sat = b.sat, bgL = b.bgL;
    if (kind === 'clear') { sat *= 1.2; bgL += isDay ? 3 : -1; }
    if (kind === 'rain' || kind === 'rain-heavy') { hue = (hue + 40) % 360; bgL -= 2; }
    if (kind === 'storm') { hue = (hue + 60) % 360; sat *= 1.3; }
    if (kind === 'fog') { sat *= 0.4; }
    if (kind === 'snow') { sat *= 0.3; bgL += 4; }
    var accHue = (b.acc + 360) % 360;
    return {
      hue: hue,
      bg: 'hsl(' + hue + ' ' + sat + '% ' + bgL + '%)',
      bgSoft: 'hsl(' + hue + ' ' + Math.max(10, sat - 4) + '% ' + (bgL + 4) + '%)',
      card: 'hsl(' + hue + ' ' + (sat + 4) + '% ' + (bgL + 6) + '%)',
      cardHover: 'hsl(' + hue + ' ' + (sat + 8) + '% ' + (bgL + 10) + '%)',
      text: 'hsl(' + hue + ' 22% ' + b.textL + '%)',
      textMuted: 'hsl(' + hue + ' 16% 60%)',
      accent: 'hsl(' + accHue + ' 58% 54%)',
      accentSoft: 'hsla(' + accHue + ' 58% 50% / 0.28)',
      border: 'hsla(' + hue + ' 30% 72% / 0.22)',
      glow: 'hsla(' + hue + ' 55% 50% / 0.22)',
      lab: 'hsl(' + ((hue + 150) % 360) + ' 62% 58%)',
      grain: 0.04, period: period, weather: kind, isDay: !!isDay
    };
  }

  function applyVars(p) {
    ROOT.style.setProperty('--rt-hue', p.hue);
    ROOT.style.setProperty('--rt-bg', p.bg);
    ROOT.style.setProperty('--rt-bg-soft', p.bgSoft);
    ROOT.style.setProperty('--rt-card', p.card);
    ROOT.style.setProperty('--rt-card-hover', p.cardHover);
    ROOT.style.setProperty('--rt-text', p.text);
    ROOT.style.setProperty('--rt-text-muted', p.textMuted);
    ROOT.style.setProperty('--rt-accent', p.accent);
    ROOT.style.setProperty('--rt-accent-soft', p.accentSoft);
    ROOT.style.setProperty('--rt-border', p.border);
    ROOT.style.setProperty('--rt-glow', p.glow);
    ROOT.style.setProperty('--rt-lab', p.lab);
    ROOT.style.setProperty('--rt-grain', p.grain);
    ROOT.dataset.period = p.period;
    ROOT.dataset.weather = p.weather;
    ROOT.dataset.place = 'kashiwa-hikarigaoka';
    if (BODY) {
      BODY.dataset.period = p.period;
      BODY.dataset.weather = p.weather;
      BODY.classList.toggle('is-day', p.isDay);
      BODY.classList.toggle('is-night', !p.isDay);
    }
    setLayer(p.weather, p.period, p.isDay);
  }

  function tickTime() {
    var scheme = currentScheme();
    if (!atmosphereEnabled()) {
      clearInlineVars();
      ROOT.dataset.period = 'static';
      ROOT.dataset.weather = 'off';
      if (BODY) {
        BODY.dataset.period = 'static';
        BODY.dataset.weather = 'off';
        BODY.classList.toggle('is-day', isLight(scheme));
        BODY.classList.toggle('is-night', !isLight(scheme));
      }
      setLayer('off', 'static', isLight(scheme));
      return;
    }
    var j = getJST();
    var period = periodFromHours(j.hours);
    var w = lastWeather || {};
    var kind = weatherKind(w.weather_code, w.precipitation, w.cloud_cover);
    var isDay = w.is_day != null ? !!w.is_day : (j.hours >= 6 && j.hours < 18);

    if (FIXED[scheme] || scheme === 'classic' || scheme === 'green') {
      clearInlineVars();
      ROOT.dataset.period = period;
      ROOT.dataset.weather = kind;
      ROOT.dataset.place = 'kashiwa-hikarigaoka';
      if (BODY) {
        BODY.dataset.period = period;
        BODY.dataset.weather = kind;
        BODY.classList.toggle('is-day', isLight(scheme));
        BODY.classList.toggle('is-night', !isLight(scheme));
      }
      setLayer(kind, period, isDay);
      return;
    }

    applyVars(paletteDark(period, kind, isDay));
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

  function ensureAtmosphere() {
    if (document.getElementById('rt-atmosphere')) return;
    var el = document.createElement('div');
    el.id = 'rt-atmosphere';
    el.className = 'rt-atmosphere';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }

  function ensureThemeControl(done) {
    if (window.ReitansaiThemeControl) { done(); return; }
    var existing = document.querySelector('script[src*="theme-control.js"]');
    if (existing) {
      var wait = setInterval(function () {
        if (window.ReitansaiThemeControl) { clearInterval(wait); done(); }
      }, 20);
      setTimeout(function () { clearInterval(wait); done(); }, 2000);
      return;
    }
    var s = document.createElement('script');
    s.src = '/reitansai/src/js/theme-control.js';
    s.onload = function () { done(); };
    s.onerror = function () { done(); };
    document.head.appendChild(s);
  }

  function boot() {
    ensureThemeControl(function () {
      ensureAtmosphere();
      try {
        var cached = sessionStorage.getItem('rt-wx');
        if (cached) {
          var o = JSON.parse(cached);
          if (o && o.c && Date.now() - o.t < 15 * 60 * 1000) lastWeather = o.c;
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
      setInterval(function () {
        var layer = document.getElementById('rt-atmosphere');
        if (!layer || !layer.classList.contains('wx-storm')) return;
        if (Math.random() > 0.28) return;
        layer.classList.remove('lightning-active');
        void layer.offsetWidth;
        layer.classList.add('lightning-active');
        setTimeout(function () { layer.classList.remove('lightning-active'); }, 420);
      }, 3200);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.ReitansaiTheme = {
    tick: tickTime,
    retick: tickTime,
    fetchWeather: fetchWeather,
    getJST: getJST,
    coords: { lat: LAT, lon: LON, label: 'Chiba Kashiwa' }
  };
})();
