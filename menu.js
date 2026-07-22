/**
 * ======================================================
 * 📋 メニューのリストデータ（ここを変更・編集してください）
 * ======================================================
 */
const RADIAL_MENU_DATA = [
  { label: 'ホーム', icon: '🏠', action: () => location.href = 'index.html' },
  { label: '検索', icon: '🔍', action: () => alert('検索画面を開きます') },
  { label: '設定', icon: '⚙️', action: () => alert('設定画面を開きます') },
  {
    label: 'ファイル',
    icon: '📁',
    // 隠し（サブ）メニューの設定
    items: [
      { label: 'ドキュメント', icon: '📄', action: () => alert('文書リスト') },
      { label: '画像', icon: '🖼️', action: () => alert('画像ギャラリー') },
      { label: '音楽', icon: '🎵', action: () => alert('プレイリスト') }
    ]
  },
  { label: 'お気に入り', icon: '❤️', action: () => alert('お気に入りに追加') },
  { label: 'シェア', icon: '🚀', action: () => alert('共有リンクをコピー') }
];

(function () {
  const LONG_PRESS_MS = 450;  // 長押しと判定するミリ秒
  const MOVE_THRESHOLD = 10;   // 指がズレた時にキャンセルする距離（px）
  
  let menuEl = null;
  let timer = null;
  let startX = 0, startY = 0;
  let isOpen = false;

  // 1. メニューを動的に組み立てる関数
  function createMenuDOM() {
    menuEl = document.createElement('div');
    menuEl.className = 'radial-menu-wrapper';
    
    // 誤タップ防止用の中央空間インジケーター
    const centerIndicator = document.createElement('div');
    centerIndicator.className = 'radial-menu-center-indicator';
    menuEl.appendChild(centerIndicator);

    const total = RADIAL_MENU_DATA.length;
    // メニュー半径を取得（CSS変数の値、デフォルト110px）
    const radius = 110; 

    RADIAL_MENU_DATA.forEach((item, index) => {
      // 円周上に配置するための角度計算（真上から時計回り）
      const angle = (index / total) * 2 * Math.PI - (Math.PI / 2);
      const x = Math.round(Math.cos(angle) * radius);
      const y = Math.round(Math.sin(angle) * radius);

      if (item.items && item.items.length > 0) {
        // --- サブメニューを持つ多隠し要素 ---
        const subContainer = document.createElement('div');
        subContainer.className = 'rm-item rm-has-sub';
        subContainer.setAttribute('data-label', item.label);
        subContainer.style.setProperty('--x', `${x}px`);
        subContainer.style.setProperty('--y', `${y}px`);
        subContainer.style.transitionDelay = `${index * 0.04}s`; // 時差ポップアップ animation

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'rm-toggle';
        toggleBtn.innerHTML = item.icon;
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          subContainer.classList.toggle('open');
        });
        subContainer.appendChild(toggleBtn);

        // サブアイテムの配置（親の方向から外側に向けて扇状に配置）
        const subTotal = item.items.length;
        const subRadius = 65;
        item.items.forEach((sub, subIdx) => {
          const subItem = document.createElement('button');
          subItem.className = 'rm-sub-item';
          subItem.setAttribute('data-label', sub.label);
          subItem.innerHTML = sub.icon;

          // 親の角度を中心に左右に扇状に展開
          const spreadAngle = 0.5; // 扇状の広がり角
          const subAngle = angle + (subIdx - (subTotal - 1) / 2) * spreadAngle;
          const subX = Math.round(Math.cos(subAngle) * subRadius);
          const subY = Math.round(Math.sin(subAngle) * subRadius);

          subItem.style.setProperty('--sub-x', `${subX}px`);
          subItem.style.setProperty('--sub-y', `${subY}px`);

          subItem.addEventListener('click', (e) => {
            e.stopPropagation();
            sub.action();
            closeMenu();
          });
          subContainer.appendChild(subItem);
        });

        menuEl.appendChild(subContainer);
      } else {
        // --- 通常の単体ボタン ---
        const btn = document.createElement('button');
        btn.className = 'rm-item';
        btn.setAttribute('data-label', item.label);
        btn.innerHTML = item.icon;
        btn.style.setProperty('--x', `${x}px`);
        btn.style.setProperty('--y', `${y}px`);
        btn.style.transitionDelay = `${index * 0.04}s`; // 時差アニメーション

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

  // 2. メニュー位置の画面外はみ出し補正（クランプ処理）
  function getAdjustedPosition(clientX, clientY) {
    const margin = 140; // メニュー半径＋ボタンサイズ＋ツールチップ分のマージン
    const maxX = window.innerWidth - margin;
    const maxY = window.innerHeight - margin;

    const clampedX = Math.max(margin, Math.min(clientX, maxX));
    const clampedY = Math.max(margin, Math.min(clientY, maxY));

    return { x: clampedX, y: clampedY };
  }

  // 3. メニューを開く
  function openMenu(x, y) {
    const pos = getAdjustedPosition(x, y);
    menuEl.style.left = `${pos.x}px`;
    menuEl.style.top = `${pos.y}px`;
    menuEl.classList.add('active');
    isOpen = true;
  }

  // 4. メニューを閉じる
  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    // サブメニューが開いていれば一緒に閉じる
    menuEl.querySelectorAll('.rm-has-sub').forEach(el => el.classList.remove('open'));
    isOpen = false;
  }

  // 5. タッチ・ポインターイベントのリスナー制御
  function initEvents() {
    // 画面全体でのポインター押し下げ（長押し検出開始）
    document.addEventListener('pointerdown', (e) => {
      // メニュー展開中にメニュー内をクリックした場合は閉じない
      if (isOpen && menuEl.contains(e.target)) return;

      // メニュー展開中にメニュー外をクリックしたら閉じる
      if (isOpen && !menuEl.contains(e.target)) {
        closeMenu();
        return;
      }

      startX = e.clientX;
      startY = e.clientY;

      // タイマーセット（長押し中には分散・表示させない）
      clearTimeout(timer);
      timer = setTimeout(() => {
        openMenu(startX, startY);
      }, LONG_PRESS_MS);
    });

    // 指を移動した時（一定距離以上動かしたら長押しキャンセル）
    document.addEventListener('pointermove', (e) => {
      if (!timer || isOpen) return;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist > MOVE_THRESHOLD) {
        clearTimeout(timer);
        timer = null;
      }
    });

    // 指を離した時（長押し完了前ならタイマー解除。完了後ならメニューを表示したままにする）
    document.addEventListener('pointerup', () => {
      if (timer && !isOpen) {
        clearTimeout(timer);
        timer = null;
      }
    });

    // コンテキストメニュー（右クリック等）による誤作動防止
    document.addEventListener('contextmenu', (e) => {
      if (isOpen) e.preventDefault();
    });
  }

  // DOM読み込み完了時に自動初期化
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
