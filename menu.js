/**
 * ======================================================
 * 📋 メニュー項目データ（配列を編集するだけで更新可能）
 * ======================================================
 */
const RADIAL_MENU_DATA = [
  { label: 'ホーム', icon: '🏠', action: () => location.href = 'index.html' },
  { label: '検索', icon: '🔍', action: () => alert('検索メニュー') },
  { label: '設定', icon: '⚙️', action: () => alert('設定メニュー') },
  {
    label: 'フォルダ',
    icon: '📁',
    // サブ（多隠し）メニュー
    items: [
      { label: 'ドキュメント', icon: '📄', action: () => alert('📄 ドキュメントを選択') },
      { label: '画像', icon: '🖼️', action: () => alert('🖼️ 画像を選択') },
      { label: '音楽', icon: '🎵', action: () => alert('🎵 音楽を選択') }
    ]
  },
  { label: 'お気に入り', icon: '❤️', action: () => alert('お気に入り') },
  { label: 'シェア', icon: '🚀', action: () => alert('シェア') }
];

(function () {
  const LONG_PRESS_MS = 400;   // 長押し判定時間
  const MOVE_THRESHOLD = 8;    // キャンセルされる移動判定幅(px)
  
  let menuEl = null;
  let timer = null;
  let startX = 0, startY = 0;
  let isOpen = false;

  function createMenuDOM() {
    menuEl = document.createElement('div');
    menuEl.className = 'radial-menu-wrapper';
    
    // 中央波紋インジケーター
    const centerIndicator = document.createElement('div');
    centerIndicator.className = 'radial-menu-center-indicator';
    menuEl.appendChild(centerIndicator);

    const total = RADIAL_MENU_DATA.length;
    const radius = 115; // 円形メニューの半径

    RADIAL_MENU_DATA.forEach((item, index) => {
      // 真上（-90度）を起点に円状に配置する角度計算
      const angle = (index / total) * 2 * Math.PI - (Math.PI / 2);
      const x = Math.round(Math.cos(angle) * radius);
      const y = Math.round(Math.sin(angle) * radius);

      if (item.items && item.items.length > 0) {
        // --- 隠しサブメニュー付きの親要素 ---
        const subContainer = document.createElement('div');
        subContainer.className = 'rm-item rm-has-sub';
        subContainer.setAttribute('data-label', item.label);
        subContainer.style.setProperty('--x', `${x}px`);
        subContainer.style.setProperty('--y', `${y}px`);
        // 順番に飛び出す時差（Stagger）アニメーション
        subContainer.style.transitionDelay = `${index * 0.03}s`;

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'rm-toggle';
        toggleBtn.innerHTML = item.icon;
        
        // サブメニュー展開トグル処理
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          subContainer.classList.toggle('open');
        });
        subContainer.appendChild(toggleBtn);

        // --- 子要素（サブアイテム）の配置 ---
        const subTotal = item.items.length;
        const subRadius = 68; // 親からの距離
        
        item.items.forEach((sub, subIdx) => {
          const subItem = document.createElement('button');
          subItem.className = 'rm-sub-item';
          subItem.setAttribute('data-label', sub.label); // 子の文字ラベルをセット
          subItem.innerHTML = sub.icon;

          // 親の方向から放射状に広がる角度を計算
          const spreadAngle = 0.55; 
          const subAngle = angle + (subIdx - (subTotal - 1) / 2) * spreadAngle;
          const subX = Math.round(Math.cos(subAngle) * subRadius);
          const subY = Math.round(Math.sin(subAngle) * subRadius);

          subItem.style.setProperty('--sub-x', `${subX}px`);
          subItem.style.setProperty('--sub-y', `${subY}px`);
          subItem.style.transitionDelay = `${subIdx * 0.04}s`; // 子の時差表示

          subItem.addEventListener('click', (e) => {
            e.stopPropagation();
            sub.action();
            closeMenu();
          });
          subContainer.appendChild(subItem);
        });

        menuEl.appendChild(subContainer);
      } else {
        // --- 通常のメインボタン ---
        const btn = document.createElement('button');
        btn.className = 'rm-item';
        btn.setAttribute('data-label', item.label);
        btn.innerHTML = item.icon;
        btn.style.setProperty('--x', `${x}px`);
        btn.style.setProperty('--y', `${y}px`);
        btn.style.transitionDelay = `${index * 0.03}s`;

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          item.action();
          closeMenu();
        });
        menuEl.appendChild(btn);
      }
    });

    document.body.appendChild(menuEl);
  }

  // 画面端でメニューがはみ出ないように補正（クランプ処理）
  function getAdjustedPosition(clientX, clientY) {
    const margin = 140; 
    const maxX = window.innerWidth - margin;
    const maxY = window.innerHeight - margin;

    const clampedX = Math.max(margin, Math.min(clientX, maxX));
    const clampedY = Math.max(margin, Math.min(clientY, maxY));

    return { x: clampedX, y: clampedY };
  }

  function openMenu(x, y) {
    const pos = getAdjustedPosition(x, y);
    menuEl.style.left = `${pos.x}px`;
    menuEl.style.top = `${pos.y}px`;
    menuEl.classList.add('active');
    isOpen = true;
  }

  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    // 開いているサブメニューをリセット
    menuEl.querySelectorAll('.rm-has-sub').forEach(el => el.classList.remove('open'));
    isOpen = false;
  }

  function initEvents() {
    // 画面の長押し検知開始
    document.addEventListener('pointerdown', (e) => {
      if (isOpen && menuEl.contains(e.target)) return;

      // メニュー外のクリックで閉じる
      if (isOpen && !menuEl.contains(e.target)) {
        closeMenu();
        return;
      }

      startX = e.clientX;
      startY = e.clientY;

      clearTimeout(timer);
      timer = setTimeout(() => {
        openMenu(startX, startY);
      }, LONG_PRESS_MS);
    });

    // 指を動かした時はキャンセル（メニュー表示前のみ）
    document.addEventListener('pointermove', (e) => {
      if (!timer || isOpen) return;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist > MOVE_THRESHOLD) {
        clearTimeout(timer);
        timer = null;
      }
    });

    // 指を離した時（長押し完了前ならタイマー解除。開いた後はそのまま維持）
    document.addEventListener('pointerup', () => {
      if (timer && !isOpen) {
        clearTimeout(timer);
        timer = null;
      }
    });

    // 右クリックなどの標準コンテキストメニュー制御
    document.addEventListener('contextmenu', (e) => {
      if (isOpen) e.preventDefault();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createMenuDOM();
      initEvents();
    });
  } else {
    createMenuDOM();
    initEvents();
  }
})();
