/**
 * Time-linked palette — laboratory mystical base
 * Day: cooler slate + amber | Night: deeper ink + cyan/gold
 */
(function () {
  'use strict';
  var ROOT = document.documentElement;

  function timeToPalette(hours) {
    var t = hours / 24;
    var isNight = hours < 6.5 || hours >= 18.5;
    var hue = isNight ? 220 + Math.sin(t * Math.PI * 2) * 25 : 200 + Math.sin((hours - 6) / 12 * Math.PI) * 30;
    var accentHue = isNight ? 45 : 42;
    var labHue = isNight ? 175 : 170;

    if (isNight) {
      return {
        hue: hue,
        bg: 'hsl(' + hue + ' 18% 7%)',
        bgSoft: 'hsl(' + hue + ' 16% 10%)',
        card: 'hsl(' + hue + ' 20% 11%)',
        cardHover: 'hsl(' + hue + ' 22% 14%)',
        text: 'hsl(' + hue + ' 20% 92%)',
        textMuted: 'hsl(' + hue + ' 12% 62%)',
        accent: 'hsl(' + accentHue + ' 70% 52%)',
        accentSoft: 'hsla(' + accentHue + ' 70% 45% / 0.18)',
        border: 'hsla(' + hue + ' 25% 70% / 0.14)',
        glow: 'hsla(' + labHue + ' 60% 50% / 0.22)',
        isNight: true
      };
    }
    return {
      hue: hue,
      bg: 'hsl(' + hue + ' 14% 10%)',
      bgSoft: 'hsl(' + hue + ' 12% 13%)',
      card: 'hsl(' + hue + ' 16% 14%)',
      cardHover: 'hsl(' + hue + ' 18% 17%)',
      text: 'hsl(' + hue + ' 15% 90%)',
      textMuted: 'hsl(' + hue + ' 10% 58%)',
      accent: 'hsl(' + accentHue + ' 65% 48%)',
      accentSoft: 'hsla(' + accentHue + ' 65% 45% / 0.16)',
      border: 'hsla(' + hue + ' 20% 65% / 0.16)',
      glow: 'hsla(' + labHue + ' 50% 45% / 0.18)',
      isNight: false
    };
  }

  function applyPalette(p) {
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
    ROOT.dataset.theme = p.isNight ? 'night' : 'day';
  }

  function getJSTHours() {
    var fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
    });
    var parts = fmt.formatToParts(new Date());
    var h = parseInt(parts.find(function (p) { return p.type === 'hour'; }).value, 10);
    var m = parseInt(parts.find(function (p) { return p.type === 'minute'; }).value, 10);
    var s = parseInt(parts.find(function (p) { return p.type === 'second'; }).value, 10);
    return h + m / 60 + s / 3600;
  }

  function tick() { applyPalette(timeToPalette(getJSTHours())); }
  tick();
  setInterval(tick, 30000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) tick();
  });
  window.ReitansaiTheme = { tick: tick, getJSTHours: getJSTHours, timeToPalette: timeToPalette };
})();
