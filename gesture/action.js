/**
 * ⚡ action.js - ドローイング専用アクション実装集
 */
(function () {
  function showModal(title, icon, contentHtml) {
    const existing = document.querySelector('.pen-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'pen-modal-overlay';

    const card = document.createElement('div');
    card.className = 'pen-modal-card';

    card.innerHTML = `
      <button class="pen-modal-close">✕</button>
      <div class="pen-modal-title">
        <span>${icon}</span>
        <span>${title}</span>
      </div>
      <div class="pen-modal-body">${contentHtml}</div>
    `;

    card.querySelector('.pen-modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.body.appendChild(overlay);
  }

  const ACTIONS = {
    // 📝 メモ & 画面キャプチャ保存
    'M': () => {
      const imgData = window.PenEngine.getCanvasDataURL();
      showModal(
        'クイックメモ ＆ 画面キャプチャ',
        '📝',
        `
          <p style="margin-bottom: 12px; font-size:13px; opacity: 0.9;">描画した虹色メモと画面をキャプチャしました。</p>
          <div style="text-align:center; margin: 16px 0;">
            <img src="${imgData}" style="max-width:100%; border-radius:8px; border:1px solid rgba(255,215,0,0.4);" />
          </div>
          <a href="${imgData}" download="reitansai-memo.png" class="pen-btn" style="display:block; text-decoration:none; text-align:center; box-sizing:border-box;">📷 画像として保存する</a>
        `
      );
    },

    // 💖 ブックマーク（お気に入り登録 & 一覧表示）
    'HEART': () => {
      const currentUrl = location.pathname;
      const title = document.title || '麗探祭ページ';
      let bookmarks = JSON.parse(localStorage.getItem('reitansai_bookmarks') || '[]');

      const index = bookmarks.findIndex(b => b.url === currentUrl);
      let msg = '';

      if (index >= 0) {
        bookmarks.splice(index, 1);
        msg = '💔 このページをお気に入りから解除しました。';
      } else {
        bookmarks.push({ title, url: currentUrl, time: new Date().toLocaleDateString() });
        msg = '💖 このページをお気に入りに追加しました！';
      }

      localStorage.setItem('reitansai_bookmarks', JSON.stringify(bookmarks));

      const listHtml = bookmarks.map(b => `
        <li style="margin-bottom:8px; padding:8px; background:rgba(255,255,255,0.08); border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
          <a href="${b.url}" style="color:#FFD700; text-decoration:none; font-weight:bold; font-size:13px;">${b.title}</a>
          <span style="font-size:11px; opacity:0.7;">${b.time}</span>
        </li>
      `).join('') || '<p style="opacity:0.7; font-size:13px;">お気に入りはまだありません。</p>';

      showModal(
        'マイ・ブックマークポータル',
        '💖',
        `
          <p style="margin-bottom:16px; color:#E8B923; font-weight:bold; font-size:13px;">${msg}</p>
          <h4 style="margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:4px; font-size:14px;">保存済みリスト</h4>
          <ul style="list-style:none; padding:0;">${listHtml}</ul>
        `
      );
    },

    // 🔍 検索 & ガイド
    'QUESTION': () => {
      showModal(
        'スマート検索 ＆ AIガイド',
        '🔍',
        `
          <p style="margin-bottom:12px; font-size:13px;">気になるゼミやイベントのキーワードを入力してください。</p>
          <input type="text" id="pen-search-input" placeholder="例: AI, 農業, イベント..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #E8B923; background:rgba(0,0,0,0.5); color:#fff; margin-bottom:12px; box-sizing:border-box;" />
          <button id="pen-search-btn" class="pen-btn" style="width:100%;">検索実行</button>
        `
      );
      setTimeout(() => {
        const btn = document.getElementById('pen-search-btn');
        if (btn) {
          btn.addEventListener('click', () => {
            const query = document.getElementById('pen-search-input').value;
            if (query) alert(`「${query}」に関連するゼミを案内します！`);
          });
        }
      }, 100);
    },

    // 📐 ヘルプコマンド一覧
    'TRIANGLE': () => {
      showModal(
        'ジェスチャーコマンド一覧',
        '📐',
        `
          <ul style="list-style:none; padding:0; font-size:13px; line-height:2.0;">
            <li><strong>📝 「M」を描く:</strong> クイックメモ ＆ 画面キャプチャ保存</li>
            <li><strong>💖 「♡」を描く:</strong> お気に入り登録 ＆ ブックマーク呼出</li>
            <li><strong>🔍 「？」を描く:</strong> クイック検索 ＆ AIガイド</li>
            <li><strong>👑 「★」を描く:</strong> 秘密のイースターエッグ</li>
            <li><strong>🔗 「S」を描く:</strong> Webシェアカード作成</li>
            <li><strong>🧹 「C」を描く:</strong> 描画線の一括クリア</li>
          </ul>
        `
      );
    },

    // 👑 イースターエッグ
    'STAR': () => {
      showModal(
        'シークレット・イースターエッグ',
        '👑',
        `
          <div style="text-align:center; padding:10px 0;">
            <div style="font-size:48px; margin-bottom:12px;">🎉</div>
            <h3 style="color:#E8B923; margin-bottom:8px;">隠しコンテンツ達成！</h3>
            <p style="font-size:13px; opacity:0.9; line-height:1.6;">
              魔法陣を描いたあなたに特別メッセージ！<br>
              「麗探祭では、各ゼミが趣向を凝らした探究発表を行っています。探究の旅をお楽しみください！」
            </p>
          </div>
        `
      );
    },

    // 🔗 SNSシェア
    'SHARE': () => {
      const shareUrl = encodeURIComponent(location.href);
      const shareText = encodeURIComponent(`【麗探祭】${document.title} をチェック！`);
      showModal(
        'SNSシェアポータル',
        '🔗',
        `
          <p style="margin-bottom:16px; font-size:13px;">このページをSNSでシェアしましょう！</p>
          <div style="display:flex; gap:12px;">
            <a href="https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}" target="_blank" class="pen-btn" style="flex:1; text-align:center; text-decoration:none; background:#1DA1F2; color:#fff;">X (Twitter) で投稿</a>
            <a href="https://line.me/R/msg/text/?${shareText}%20${shareUrl}" target="_blank" class="pen-btn" style="flex:1; text-align:center; text-decoration:none; background:#06C755; color:#fff;">LINEで送る</a>
          </div>
        `
      );
    },

    // 🧹 クリア
    'CLEAR': () => {
      window.PenEngine.clearCanvas();
    }
  };

  function execute(gestureName) {
    const action = ACTIONS[gestureName];
    if (action) action();
  }

  window.GestureActions = { execute };
})();
