/**
 * ======================================================
 * 📋 多次元配列（無限階層対応）メニューリスト
 * ======================================================
 */
const RADIAL_MENU_DATA = [
  { label: 'ホーム', icon: '🏠', action: () => location.href = 'index.html' },
  { label: '検索', icon: '🔍', action: () => alert('検索') },
  {
    label: 'システム',
    icon: '⚙️',
    items: [
      { label: '音量', icon: '🔊', action: () => alert('音量設定') },
      { label: '画面', icon: '☀️', action: () => alert('画面輝度') },
      {
        label: 'ネットワーク',
        icon: '📡',
        // 3次元目の階層（さらにネスト可能）
        items: [
          { label: 'Wi-Fi', icon: '📶', action: () => alert('Wi-Fi設定') },
          { label: 'Bluetooth', icon: '🎧', action: () => alert('Bluetooth設定') }
        ]
      }
    ]
  },
  {
    label: 'ファイル',
    icon: '📁',
    items: [
      { label: 'ドキュメント', icon: '📄', action: () => alert('文書') },
      { label: '画像', icon: '🖼️', action: () => alert('画像') },
      { label: '音楽', icon: '🎵', action: () => alert('音楽') }
    ]
  },
  { label: 'お気に入り', icon: '❤️', action: () => alert('お気に入り') }
];

(function () {
  const LONG_PRESS_MS = 400;
  const MOVE_THRESHOLD = 8;
  
  let menuEl = null;
  let timer = null;
  let startX = 0, startY = 0;
  let isOpen = false;

  // 再帰的に多次元配列のDOM要素を生成する関数
  function buildMenuTree(items, depth = 0, parentAngle = null) {
    const groupEl = document.createElement('div');
    groupEl.className = 'rm-group' + (depth === 0 ? ' open' : '');

    const total = items.length;
    // 階層が深くなるごとに半径を外側へ広げる
    const radius = 110 + (depth * 50);

    items.forEach((item, index) => {
      let angle = 0;
      
      if (depth === 0) {
        // 第1階層：全周（360度）にバランスよく配置
        angle = (index / total) * 2 * Math.PI - (Math.PI / 2);
      } else {
        // 第2階層以降：親の伸ばした方向を中心に扇状（120度幅）に配置
        const spread = Math.PI * 0.65;
        angle = parentAngle + (index - (total - 1) / 2) * (spread / Math.max(total - 1, 1));
      }

      const x = Math.round(Math.cos(angle) * radius);
      const y = Math.round(Math.sin(angle) * radius);

      if (item.items && item.items.length > 0) {
        // --- 隠しサブメニューを持つノード（グループ） ---
        const subGroup = buildMenuTree(item.items, depth + 1, angle);
        subGroup.classList.add('has-sub');

        const btn = document.createElement('button');
        btn.className = 'rm-item';
        btn.setAttribute('data-label', item.label);
        btn.innerHTML = item.icon;
        btn.style.setProperty('--x', `${x}px`);
        btn.style.setProperty('--y', `${y}px`);
        btn.style.transitionDelay = `${index * 0.035}s`;

        // 開閉トグル処理
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isExpanded = subGroup.classList.contains('is-expanded');
          
          // 同一階層の他の開いているサブメニューを閉じる
          groupEl.querySelectorAll(':scope > .rm-group').forEach(el => {
            el.classList.remove('is-expanded', 'open');
          });

          if (!isExpanded) {
            subGroup.classList.add('is-expanded', 'open');
          }
        });

        subGroup.insertBefore(btn, subGroup.firstChild);
        groupEl.appendChild(subGroup);
      } else {
        // --- 通常のボタン項目 ---
        const btn = document.createElement('button');
        btn.className = 'rm-item';
        btn.setAttribute('data-label', item.label);
        btn.innerHTML = item.icon;
        btn.style.setProperty('--x', `${x}px`);
        btn.style.setProperty('--y', `${y}px`);
        btn.style.transitionDelay = `${index * 0.035}s`;

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          item.action();
          closeMenu();
        });

        groupEl.appendChild(btn);
      }
    });

    return groupEl;
  }

  function createMenuDOM() {
    menuEl = document.createElement('div');
    menuEl.className = 'radial-menu-wrapper';
    
    const centerIndicator = document.createElement('div');
    centerIndicator.className = 'radial-menu-center-indicator';
    menuEl.appendChild(centerIndicator);

    // 多次元配列から再帰的に構築
    const tree = buildMenuTree(RADIAL_MENU_DATA);
    menuEl.appendChild(tree);

    document.body.appendChild(menuEl);
  }

  function getAdjustedPosition(clientX, clientY) {
    const margin = 160; 
    const maxX = window.innerWidth - margin;
    const maxY = window.innerHeight - margin;

    return {
      x: Math.max(margin, Math.min(clientX, maxX)),
      y: Math.max(margin, Math.min(clientY, maxY))
    };
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
    // 開いた全多次元階層をまとめてリセット
    menuEl.querySelectorAll('.rm-group').forEach(el => {
      el.classList.remove('is-expanded');
      if (el !== menuEl.querySelector('.rm-group')) {
        el.classList.remove('open');
      }
    });
    isOpen = false;
  }

  function initEvents() {
    document.addEventListener('pointerdown', (e) => {
      if (isOpen && menuEl.contains(e.target)) return;

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

    document.addEventListener('pointermove', (e) => {
      if (!timer || isOpen) return;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist > MOVE_THRESHOLD) {
        clearTimeout(timer);
        timer = null;
      }
    });

    document.addEventListener('pointerup', () => {
      if (timer && !isOpen) {
        clearTimeout(timer);
        timer = null;
      }
    });

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
