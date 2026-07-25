/**
 * ⚡ GestureActions - 魔法陣発動アクション＆ド派手演出モジュール
 */
(function () {
  'use strict';

  function createMagicModal(title, icon, text, themeColor, bgGradient) {
    const existing = document.querySelector('.pen-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'pen-modal-overlay';

    const card = document.createElement('div');
    card.className = 'pen-modal-card';
    card.style.background = bgGradient || 'linear-gradient(145deg, rgba(10, 61, 42, 0.96), rgba(15, 77, 53, 0.96))';
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

    const closeBtn = card.querySelector('.pen-modal-close');
    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  function execute(gestureName) {
    console.log('%c🎯 魔法陣発動: ' + gestureName, 'color:#00ff88; font-size:16px; font-weight:bold;');

    // 描画オーバーレイを自動で閉じる
    if (window.PenEngine) {
      setTimeout(() => window.PenEngine.close(), 600);
    }

    switch (gestureName) {
      case '♡ ハート':
        createMagicModal(
          '愛と絆の召喚陣 (Heart Magic)',
          '💖',
          '麗探祭へようこそ！あなたの訪れを歓迎する愛の波動が発動しました。',
          '#FF69B4',
          'linear-gradient(145deg, rgba(60, 10, 35, 0.96), rgba(90, 15, 50, 0.96))'
        );
        break;

      case '★ 星':
        createMagicModal(
          'スターバースト召喚 (Star Burst)',
          '🌟',
          '星々の煌めきが集結！麗探祭の全企画情報にアクセス可能な状態になりました。',
          '#FFD700',
          'linear-gradient(145deg, rgba(60, 50, 10, 0.96), rgba(90, 75, 15, 0.96))'
        );
        break;

      case '◯ 円':
        createMagicModal(
          '全方位結界・結び (Circle Shield)',
          '⭕',
          '完全な円形結界が展開されました。サイトの全メニューを展開します。',
          '#00F0FF',
          'linear-gradient(145deg, rgba(10, 45, 60, 0.96), rgba(15, 65, 90, 0.96))'
        );
        break;

      case '⚡ 稲妻':
        createMagicModal(
          '迅雷フリック (Lightning Bolt)',
          '⚡',
          '高速アクセス発動！トップページへ一瞬でバインド移動します。',
          '#FFE600',
          'linear-gradient(145deg, rgba(50, 50, 10, 0.96), rgba(80, 80, 15, 0.96))'
        );
        setTimeout(() => { location.href = '/reitansai/index.html'; }, 1800);
        break;

      case '↑ 上矢印':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;

      case '↓ 下矢印':
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        break;

      case '❌ バツ':
        if (window.PenEngine) window.PenEngine.clearCanvas();
        break;

      default:
        createMagicModal(
          `魔法陣【${gestureName}】発動`,
          '✨',
          `ジェスチャー [${gestureName}] が正常に認識されました！`,
          '#E8B923'
        );
        break;
    }
  }

  window.GestureActions = { execute };
})();
