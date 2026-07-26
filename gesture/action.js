/**
 * ⚡ GestureActions - ド派手超絶アクション ＆ Web Audio効果音合成エンジン
 */
(function () {
  'use strict';

  // 🔊 音声合成用 Web Audio Context
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
  }

  // 💥 爆発音・重低音・レーザー音の自作生成（ファイル不要！）
  function playSound(type) {
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'explosion') { // 🎆 爆音
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 1.2);
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
      } else if (type === 'blackhole') { // 🌀 ヴォイド（時空吸い込み重低音）
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 1.8);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 1.8);
        osc.start(now);
        osc.stop(now + 1.8);
      } else if (type === 'cyber') { // ♾️ サイバーグリッチ音
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(400, now + 0.1);
        osc.frequency.setValueAtTime(1200, now + 0.2);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.log('Audio Autoplay Blocked:', e);
    }
  }

  // 🎆 【激熱イースターエッグ1】画面炸裂400連発花火 ＆ 画面フラッシュ
  function launchSuperFireworks() {
    playSound('explosion');

    // 画面ホワイトアウト・フラッシュ
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#fff;z-index:999999;transition:opacity 0.6s;pointer-events:none;';
    document.body.appendChild(flash);
    setTimeout(() => { flash.style.opacity = '0'; setTimeout(() => flash.remove(), 600); }, 50);

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:999998;pointer-events:none;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#FF0055', '#00F0FF', '#FFE600', '#FF00FF', '#00FF66', '#FFFFFF'];

    for (let i = 0; i < 450; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 22 + 3;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 2,
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
          p.vy += 0.22; // 重力加速度
          p.vx *= 0.98; // 空気抵抗
          p.alpha -= 0.012;

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 15;
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

  // 🌀 【激熱イースターエッグ2】ブラックホール旋回 ＆ 画面完全吸い込み
  function triggerVoidEffect() {
    playSound('blackhole');

    document.body.style.transition = 'transform 1.8s cubic-bezier(0.7, -0.4, 0.4, 1.4), filter 1.8s ease';
    document.body.style.transformOrigin = 'center center';
    document.body.style.transform = 'scale(0.01) rotate(1080deg)';
    document.body.style.filter = 'invert(1) blur(10px) contrast(300%)';

    setTimeout(() => {
      document.body.style.transform = 'none';
      document.body.style.filter = 'none';
    }, 2200);
  }

  // ♾️ 【激熱イースターエッグ3】マトリックス・デジタルレイン ＆ RGBスプリット
  function triggerMatrixRain() {
    playSound('cyber');

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:999999;pointer-events:none;background:rgba(0,0,0,0.85);';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ♾️⚡★🔥';
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(1);

    let frame = 0;
    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00FF66';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      frame++;
      if (frame < 180) { // 約3秒間マトリックスが降り注ぐ！
        requestAnimationFrame(draw);
      } else {
        canvas.remove();
      }
    }
    draw();
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
        <span style="font-size:32px">${icon}</span> ${title}
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
      setTimeout(() => window.PenEngine.close(), 300);
    }

    switch (gestureName) {
      case '♾️ インフィニティ':
        triggerMatrixRain();
        createMagicModal('無限演算・マトリックス (Matrix Code)', '♾️', 'コードの海が解放されました！無限の可能性が覚醒します。', '#00FF66');
        break;

      case '🎆 花火':
        launchSuperFireworks();
        createMagicModal('超銀河大爆発 (Supernova Explosion)', '🎆', '画面を埋め尽くす大爆発祝砲が発動しました！', '#FF0055');
        break;

      case '🌀 ヴォイド':
        triggerVoidEffect();
        createMagicModal('時空の崩壊 (Void Collapse)', '🌀', '画面がブラックホールへ吸い込まれて再構築されました。', '#00F0FF');
        break;

      case '✅ チェック':
        createMagicModal('承認完了 (Check Complete)', '✅', '魔法陣の検証が正常に完了しました。', '#00FF66');
        break;

      case '♡ ハート':
        createMagicModal('愛の波動 (Heart Magic)', '💖', '麗探祭へのご来場ありがとうございます！', '#FF69B4');
        break;

      case '★ 星':
        launchSuperFireworks();
        createMagicModal('スターバースト (Star Burst)', '🌟', '星々の祝福が舞い降りました。', '#FFD700');
        break;

      case '⚡ 稲妻':
        createMagicModal('迅雷アクセス (Lightning Bolt)', '⚡', 'トップページへ一瞬でバインドジャンプします。', '#FFE600');
        setTimeout(() => { location.href = '/reitansai/index.html'; }, 1500);
        break;

      case '↑ 上矢印':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case '↓ 下矢印':
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        break;

      default:
        createMagicModal(`【${gestureName}】発動`, '✨', `ジェスチャー [${gestureName}] が認識されました！`, '#E8B923');
        break;
    }
  }

  window.GestureActions = { execute };
})();
