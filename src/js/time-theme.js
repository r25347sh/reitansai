/**
 * Reitansai — Time-based living color system
 * 現在のJST時刻に合わせて背景・文字・カード・アクセントを
 * 滑らかにグラデーション変化させる。
 * どのページからも読み込まれる共通JS。
 */
(function () {
  'use strict';

  const ROOT = document.documentElement;

  // 24時間を0〜1に正規化し、複数の色相・彩度・明度カーブを合成
  function timeToPalette(hours) {
    // hours: 0〜24 (小数可)
    const t = hours / 24;

    // ベースhue: 朝は青系(200) → 昼は暖かい(40) → 夕方オレンジ(15) → 夜紫(280)
    let hue;
    if (hours < 5) {
      // 深夜〜早朝: 深い藍〜紫
      hue = 230 + (hours / 5) * 40;
    } else if (hours < 8) {
      // 夜明け: 紫→青
      hue = 270 - ((hours - 5) / 3) * 70;
    } else if (hours < 11) {
      // 朝: 青→シアン寄り
      hue = 200 - ((hours - 8) / 3) * 30;
    } else if (hours < 14) {
      // 昼: シアン→黄緑寄り
      hue = 170 - ((hours - 11) / 3) * 50;
    } else if (hours < 17) {
      // 午後: 黄緑→オレンジ
      hue = 120 - ((hours - 14) / 3) * 80;
    } else if (hours < 20) {
      // 夕方: オレンジ→赤紫
      hue = 40 - ((hours - 17) / 3) * 50;
    } else {
      // 夜: 赤紫→深い藍
      hue = (350 + ((hours - 20) / 4) * 40) % 360;
    }

    // 彩度・明度も時間で変化
    let sat, lightBg, lightCard, lightText, lightAccent;
    if (hours >= 6 && hours < 18) {
      // 日中: 明るめ
      sat = 45 + Math.sin((hours - 6) / 12 * Math.PI) * 20;
      lightBg = 96 - Math.abs(hours - 12) * 1.2;
      lightCard = 98;
      lightText = 18;
      lightAccent = 48;
    } else {
      // 夜間: 暗め・彩度抑えめ
      sat = 35 + Math.sin(hours / 24 * Math.PI * 2) * 15;
      lightBg = 12 + (hours < 6 ? hours * 2 : (24 - hours) * 1.5);
      lightCard = 18;
      lightText = 92;
      lightAccent = 62;
    }

    // 夜はテキストを明るく、昼は暗く
    const isNight = hours < 6.5 || hours >= 18.5;

    return {
      hue: Math.round(hue * 10) / 10,
      sat: Math.round(sat * 10) / 10,
      bg: `hsl(${hue} ${sat * 0.55}% ${lightBg}%)`,
      bgSoft: `hsl(${hue} ${sat * 0.4}% ${isNight ? lightBg + 4 : lightBg - 3}%)`,
      card: `hsl(${hue} ${sat * 0.5}% ${lightCard}%)`,
      cardHover: `hsl(${hue} ${sat * 0.65}% ${isNight ? lightCard + 6 : lightCard - 4}%)`,
      text: `hsl(${hue} ${sat * 0.3}% ${lightText}%)`,
      textMuted: `hsl(${hue} ${sat * 0.25}% ${isNight ? 70 : 42}%)`,
      accent: `hsl(${(hue + 30) % 360} ${Math.min(sat + 15, 75)}% ${lightAccent}%)`,
      accentSoft: `hsl(${(hue + 30) % 360} ${sat}% ${isNight ? 35 : 88}%)`,
      border: `hsl(${hue} ${sat * 0.4}% ${isNight ? 30 : 82}%)`,
      glow: `hsla(${(hue + 20) % 360} ${sat + 10}% ${lightAccent}% / 0.35)`,
      isNight
    };
  }

  function applyPalette(p) {
    ROOT.style.setProperty('--rt-hue', p.hue);
    ROOT.style.setProperty('--rt-sat', p.sat + '%');
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
    // 確実にAsia/Tokyoの現在時を取得
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    const parts = fmt.formatToParts(new Date());
    const h = parseInt(parts.find(p => p.type === 'hour').value, 10);
    const m = parseInt(parts.find(p => p.type === 'minute').value, 10);
    const s = parseInt(parts.find(p => p.type === 'second').value, 10);
    return h + m / 60 + s / 3600;
  }

  function tick() {
    const hours = getJSTHours();
    applyPalette(timeToPalette(hours));
  }

  // 初回即時 + 30秒ごとに更新（滑らかなグラデーション変化）
  tick();
  setInterval(tick, 30000);

  // ページ遷移やvisibilitychangeでも即時反映
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tick();
  });

  // 他スクリプトから手動更新可能に
  window.ReitansaiTheme = { tick, getJSTHours, timeToPalette };
})();
