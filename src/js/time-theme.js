/**
 * Live atmosphere engine — 千葉県柏市光が丘2-1-1 (麗澤)
 * Combines JST clock + Open-Meteo weather into site-wide palette & body classes.
 * Updates continuously (time ~30s, weather ~10min).
 */
(function () {
  'use strict';
  var ROOT = document.documentElement;
  var BODY = document.body;
  var LAT = 35.8360;
  var LON = 139.9540;
  var WEATHER_URL =
    'https://api.open-meteo.com/v1/forecast?latitude=' + LAT +
    '&longitude=' + LON +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m' +
    '&timezone=Asia%2FTokyo';

  var lastWeather = null;

  function getJST() {
    var fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
    });
    var parts = fmt.formatToParts(new Date());
    var get = function (t) {
      return parseInt(parts.find(function (p) { return p.type === t; }).value, 10);
    };
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
    if (code == null) return 'unknown';
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

  function palette(period, kind, isDay, temp) {
    var map = {
      dawn:      { hue: 25, sat: 28, bgL: 10, textL: 92, acc: 35 },
      morning:   { hue: 200, sat: 22, bgL: 12, textL: 90, acc: 42 },
      noon:      { hue: 210, sat: 18, bgL: 14, textL: 88, acc: 45 },
      afternoon: { hue: 35, sat: 24, bgL: 11, textL: 91, acc: 38 },
      dusk:      { hue: 280, sat: 26, bgL: 9, textL: 93, acc: 320 },
      night:     { hue: 230, sat: 30, bgL: 6, textL: 92, acc: 175 },
      late:      { hue: 240, sat: 28, bgL: 5, textL: 90, acc: 200 }
    };
    var b = map[period] || map.night;
    var overlay = { hueShift: 0, satMul: 1, bgDelta: 0, glow: null, grain: 0.03 };
    switch (kind) {
      case 'clear':
        overlay = { hueShift: isDay ? 15 : -10, satMul: 1.15, bgDelta: isDay ? 2 : -1, glow: 'rgba(255,200,120,0.12)', grain: 0.02 };
        break;
      case 'partly':
        overlay = { hueShift: 5, satMul: 1, bgDelta: 0, glow: 'rgba(140,180,220,0.08)', grain: 0.03 };
        break;
      case 'cloudy':
        overlay = { hueShift: -15, satMul: 0.7, bgDelta: -1, glow: 'rgba(120,140,160,0.06)', grain: 0.05 };
        break;
      case 'fog':
        overlay = { hueShift: 10, satMul: 0.4, bgDelta: 3, glow: 'rgba(200,210,220,0.15)', grain: 0.08 };
        break;
      case 'rain':
        overlay = { hueShift: 30, satMul: 0.9, bgDelta: -2, glow: 'rgba(80,140,200,0.14)', grain: 0.06 };
        break;
      case 'rain-heavy':
        overlay = { hueShift: 40, satMul: 0.85, bgDelta: -3, glow: 'rgba(60,100,180,0.2)', grain: 0.07 };
        break;
      case 'snow':
        overlay = { hueShift: -20, satMul: 0.35, bgDelta: 4, glow: 'rgba(220,230,255,0.18)', grain: 0.04 };
        break;
      case 'storm':
        overlay = { hueShift: 50, satMul: 1.2, bgDelta: -4, glow: 'rgba(120,80,255,0.2)', grain: 0.09 };
        break;
    }
    var tTint = 0;
    if (typeof temp === 'number') {
      if (temp >= 28) tTint = 12;
      else if (temp >= 20) tTint = 4;
      else if (temp <= 5) tTint = -18;
      else if (temp <= 12) tTint = -8;
    }
    var hue = (b.hue + overlay.hueShift + tTint + 360) % 360;
    var sat = Math.max(8, Math.min(45, b.sat * overlay.satMul));
    var bgL = Math.max(4, Math.min(18, b.bgL + overlay.bgDelta));
    var accHue = b.acc;
    return {
      hue: hue,
      bg: 'hsl(' + hue + ' ' + sat + '% ' + bgL + '%)',
      bgSoft: 'hsl(' + hue + ' ' + (sat - 2) + '% ' + (bgL + 3) + '%)',
      card: 'hsl(' + hue + ' ' + (sat + 2) + '% ' + (bgL + 5) + '%)',
      cardHover: 'hsl(' + hue + ' ' + (sat + 4) + '% ' + (bgL + 8) + '%)',
      text: 'hsl(' + hue + ' 18% ' + b.textL + '%)',
      textMuted: 'hsl(' + hue + ' 12% 58%)',
      accent: 'hsl(' + accHue + ' 68% 52%)',
      accentSoft: 'hsla(' + accHue + ' 68% 48% / 0.18)',
      border: 'hsla(' + hue + ' 22% 70% / 0.16)',
      glow: overlay.glow || 'hsla(' + hue + ' 50% 50% / 0.15)',
      lab: 'hsl(' + ((hue + 140) % 360) + ' 55% 55%)',
      grain: overlay.grain,
      period: period,
      weather: kind,
      isDay: !!isDay,
      temp: temp
    };
  }

  function apply(p) {
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
    ROOT.dataset.theme = p.isDay ? 'day' : 'night';
    ROOT.dataset.period = p.period;
    ROOT.dataset.weather = p.weather;
    if (p.temp != null) ROOT.dataset.temp = String(Math.round(p.temp));
    ROOT.dataset.place = 'kashiwa-hikarigaoka';
    if (BODY) {
      BODY.dataset.period = p.period;
      BODY.dataset.weather = p.weather;
      BODY.classList.toggle('is-day', p.isDay);
      BODY.classList.toggle('is-night', !p.isDay);
    }
    var layer = document.getElementById('rt-atmosphere');
    if (layer) {
      layer.className = 'rt-atmosphere wx-' + p.weather + ' pd-' + p.period + (p.isDay ? ' day' : ' night');
    }
  }

  function tickTime() {
    var j = getJST();
    var period = periodFromHours(j.hours);
    var w = lastWeather || {};
    var kind = weatherKind(w.weather_code, w.precipitation, w.cloud_cover);
    var isDay = w.is_day != null ? !!w.is_day : (j.hours >= 6 && j.hours < 18);
    var p = palette(period, kind, isDay, w.temperature_2m);
    apply(p);
    return p;
  }

  function fetchWeather() {
    return fetch(WEATHER_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.current) {
          lastWeather = data.current;
          tickTime();
          try {
            sessionStorage.setItem('rt-wx', JSON.stringify({ t: Date.now(), c: data.current }));
          } catch (e) {}
        }
      })
      .catch(function () { tickTime(); });
  }

  function ensureAtmosphere() {
    if (document.getElementById('rt-atmosphere')) return;
    var el = document.createElement('div');
    el.id = 'rt-atmosphere';
    el.className = 'rt-atmosphere';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }

  function boot() {
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.ReitansaiTheme = {
    tick: tickTime,
    fetchWeather: fetchWeather,
    getJST: getJST,
    coords: { lat: LAT, lon: LON, label: '千葉県柏市光が丘2-1-1' }
  };
})();
