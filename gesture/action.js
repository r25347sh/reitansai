/**
 * ⚡ GestureActions - 隠しイースターエッグアニメーション演出エンジン
 */
(function () {
  'use strict';

  // 🎆 イースターエッグ1: 全画面花火エフェクト
  function launchFireworks() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '9999999';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#E8B923', '#FF0055', '#00F0FF', '#FF00FF', '#00FF66'];

    for (let i = 0; i < 150; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 2;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1
      });
    }

    function anim() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        if (p.alpha > 0) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15; // 重力
          p.alpha -= 0.015;

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      if (alive) requestAnimationFrame(anim);
      else canvas.remove();
    }
    anim();
  }

  // 🌀 イースターエッグ2: 画面ブラックホール歪み（ヴォイド）
  function triggerVoidEffect() {
    document.body.style.transition = 'transform 0.8s cubic-bezier(0.6, -0.28, 0.735, 0.045), filter 0.8s ease';
    document.body.style.transform = 'scale(0.8) rotate(720deg)';
    document.body.style.filter = 'invert(1) hue-rotate(180deg) blur(4px)';

    setTimeout(() => {
      document.body.style.transform = 'none';
      document.body.style.filter = 'none';
    }, 1600);
  }

  // ♾️ イースターエッグ3: サイバーパンク・グリッチモード
  function triggerGlitchMode() {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      const rx = (Math.random() - 0.5) * 18;
      const ry = (Math.random() - 0.5) * 18;
      document.body.style.transform = `translate(${rx}px, ${ry}px)`;
      document.body.style.filter = `hue-rotate(${Math.random() * 360}deg) contrast(200%)`;

      if (count > 20) {
        clearInterval(interval);
        document.body.style.transform = 'none';
        document.body.style.filter = 'none';
      }
    }, 60);
  }

  function createMagicModal(title, icon, text, themeColor) {
    const existing = document.querySelector('.pen-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'pen-modal-overlay';

    const card = document.createElement('div');
    card.className = 'pen-modal-card';
    card.style.borderColor = themeColor || '#E8B923';

    card.innerHTML = `
      <button class="pen-modal-close">✕</button>
      <div class="pen-modal-title" style="color: ${themeColor || '#E8B923'}">
        <span style="font-size:28px">${icon}</span> ${title}
      </div>
      <div style="font-size:15px; line-height:1.7; color:#f0f0f0;">
        ${text}
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    card.querySelector('.pen-modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  function execute(gestureName) {
    if (window.PenEngine) {
      setTimeout(() => window.PenEngine.close(), 400);
    }

    switch (gestureName) {
      // 🎁 イースターエッグアクション
      case '🎆 花火':
        launchFireworks();
        createMagicModal('祝祭の花火 (Reitansai Fireworks)', '🎆', '麗探祭の開催を祝う祝砲花火が打ち上がりました！', '#FF0055');
        break;

      case '🌀 ヴォイド':
        triggerVoidEffect();
        createMagicModal('時空歪曲 (Void Distortion)', '🌀', '画面の時空が歪み、空間がリセットされました。', '#00F0FF');
        break;

      case '♾️ インフィニティ':
        triggerGlitchMode();
        createMagicModal('無限演算 (Infinity Glitch)', '♾️', '無限の可能性を秘めたグリッチモードが起動しました。', '#FF00FF');
        break;

      // 通常アクション
      case '✅ チェック':
        createMagicModal('承認完了 (Check Complete)', '✅', '魔法陣の承認が正常に行われました。', '#00FF66');
        break;

      case '♡ ハート':
        createMagicModal('愛の波動 (Heart Magic)', '💖', '麗探祭へのご来場ありがとうございます！', '#FF69B4');
        break;

      case '★ 星':
        launchFireworks();
        createMagicModal('スターバースト (Star Burst)', '🌟', '星々の祝福が舞い降りました。', '#FFD700');
        break;

      case '⚡ 稲妻':
        createMagicModal('迅雷アクセス (Lightning Bolt)', '⚡', 'トップページへバインドジャンプします。', '#FFE600');
        setTimeout(() => { location.href = '/reitansai/index.html'; }, 1500);
        break;

      case '↑ 上矢印':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case '↓ 下矢印':
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        break;

      default:
        createMagicModal(`【${gestureName}】発動`, '✨', `魔法陣 [${gestureName}] が展開されました。`, '#E8B923');
        break;
    }
  }

  window.GestureActions = { execute };
})();
