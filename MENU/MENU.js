/**
 * 📋 データ構造（可変長対応・自動レイアウト）
 */
const RADIAL_MENU_DATA = [
  { label: 'ホーム', icon: '🏠', url: 'index.html' },
  { label: '検索', icon: '🔍', action: () => alert('🔍 検索モーダル起動') },
  {
    label: 'システム',
    icon: '⚙️',
    items: [
      { label: '音量設定', icon: '🔊', action: () => alert('音量') },
      { label: '画面輝度', icon: '☀️', action: () => alert('画面') },
      { label: '通信設定', icon: '📡', action: () => alert('通信') },
      { label: 'セキュリティ', icon: '🛡️', action: () => alert('保護') },
      { label: 'ストレージ', icon: '💾', action: () => alert('容量') },
      { label: 'バッテリー', icon: '🔋', action: () => alert('電池') },
      { label: 'システム更新', icon: '🔄', action: () => alert('更新') }
    ]
  },
  {
    label: 'ライブラリ',
    icon: '📁',
    items: [
      { label: 'ドキュメント', icon: '📄', url: 'docs.html' },
      { label: 'ギャラリー', icon: '🖼️', url: 'gallery.html' },
      { label: 'ミュージック', icon: '🎵', url: 'music.html' }
    ]
  },
  { label: 'お気に入り', icon: '⭐', action: () => alert('お気に入り') },
  { label: '通知センター', icon: '🔔', action: () => alert('通知') }
];

(function () {
  const LONG_PRESS_MS = 360;
  const TRIPLE_TAP_DELAY_MS = 300; // 3回タップ間隔の判定時間
  const MOVE_THRESHOLD = 8;

  // ⚛️ 電子殻の自動拡張設定（収容数＆半径）
  const SHELL_CAPACITIES = [6, 10, 14];
  const SHELL_RADII = [115, 185, 255];

  let menuEl = null;
  let itemsContainer = null;
  let orbitsContainer = null;
  let coreBtn = null;
  let canvas = null;
  let ctx = null;

  let timer = null;
  let startX = 0, startY = 0;
  let isOpen = false;
  let menuStack = [];

  // トリプルタップ/クリック検出用変数
  let tapCount = 0;
  let tapTimer = null;

  // 🚀 Ajax非同期遷移
  async function navigateAjax(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error();
      const htmlText = await response.text();
      const doc = new DOMParser().parseFromString(htmlText, 'text/html');
      const newContent = doc.querySelector('#app') || doc.querySelector('main') || doc.body;
      const targetContainer = document.querySelector('#app') || document.querySelector('main');

      if (targetContainer && newContent) {
        targetContainer.style.opacity = '0';
        setTimeout(() => {
          targetContainer.innerHTML = newContent.innerHTML;
          targetContainer.style.opacity = '1';
          history.pushState({ path: url }, '', url);
        }, 180);
      } else {
        location.href = url;
      }
    } catch {
      location.href = url;
    }
  }

  // 💥 放射状レインボースパーク ＆ ダブルショックウェーブエンジン
  function triggerParticleBurst() {
    if (!canvas || !ctx) return;
    canvas.width = 600;
    canvas.height = 600;
    const cX = 300, cY = 300;

    let ring1Radius = 10, ring1Alpha = 1;
    let ring2Radius = 5, ring2Alpha = 0.8;

    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, (_, idx) => {
      const a = (idx / particleCount) * Math.PI * 2 + (Math.random() * 0.15);
      const spd = Math.random() * 7 + 3.5;
      const hue = Math.floor((a / (Math.PI * 2)) * 360); // 🌈 放射状角度に応じた色相

      return {
        x: cX, y: cY,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        size: Math.random() * 3 + 1.5,
        color: `hsl(${hue}, 100%, 65%)`,
        alpha: 1
      };
    });

    function draw() {
      ctx.clearRect(0, 0, 600, 600);

      // 衝撃波リング1
      if (ring1Alpha > 0) {
        ctx.beginPath();
        ctx.arc(cX, cY, ring1Radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${ring1Alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ring1Radius += 8;
        ring1Alpha -= 0.045;
      }

      // 衝撃波リング2 (ピンク系追従)
      if (ring2Alpha > 0) {
        ctx.beginPath();
        ctx.arc(cX, cY, ring2Radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 0, 127, ${ring2Alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ring2Radius += 6;
        ring2Alpha -= 0.035;
      }

      // 粒子
      let isAlive = false;
      particles.forEach(p => {
        if (p.alpha > 0) {
          isAlive = true;
          p.x += p.vx; p.y += p.vy;
          p.vx *= 0.93; p.vy *= 0.93;
          p.alpha -= 0.032;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fill();
        }
      });

      if (ring1Alpha > 0 || ring2Alpha > 0 || isAlive) requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, 600, 600);
    }
    draw();
  }

  // ⚛️ 可変長自動レイアウト演算（電子殻モデル）
  function calculateShellLayout(items) {
    const layout = [];
    let remaining = items.length;
    let itemIdx = 0;

    for (let sIdx = 0; sIdx < SHELL_CAPACITIES.length && remaining > 0; sIdx++) {
      const capacity = SHELL_CAPACITIES[sIdx];
      const countInShell = Math.min(remaining, capacity);
      const radius = SHELL_RADII[sIdx];

      for (let i = 0; i < countInShell; i++) {
        const angle = (i / countInShell) * 2 * Math.PI - (Math.PI / 2);
        const x = Math.round(Math.cos(angle) * radius);
        const y = Math.round(Math.sin(angle) * radius);

        layout.push({ item: items[itemIdx], x, y, shellIndex: sIdx });
        itemIdx++;
      }
      remaining -= countInShell;
    }
    return layout;
  }

  // 🔄 階層切り替え：画面上の全要素を完全リプレイス
  function renderMenuLevel(items) {
    const oldItems = itemsContainer.querySelectorAll('.rm-item');
    oldItems.forEach(el => {
      el.classList.remove('rendered');
      setTimeout(() => el.remove(), 200);
    });

    orbitsContainer.innerHTML = '';

    const layout = calculateShellLayout(items);
    const activeShells = new Set();

    layout.forEach((data, index) => {
      activeShells.add(data.shellIndex);

      const btn = document.createElement('button');
      btn.className = 'rm-item' + (data.item.items ? ' has-sub' : '');
      btn.setAttribute('data-label', data.item.label);
      btn.innerHTML = data.item.icon;
      btn.style.setProperty('--x', `${data.x}px`);
      btn.style.setProperty('--y', `${data.y}px`);
      btn.style.transitionDelay = `${index * 0.025}s`;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (data.item.items && data.item.items.length > 0) {
          menuStack.push(items);
          renderMenuLevel(data.item.items);
          triggerParticleBurst();
        } else {
          if (data.item.url) navigateAjax(data.item.url);
          else if (data.item.action) data.item.action();
          closeMenu();
        }
      });

      itemsContainer.appendChild(btn);

      requestAnimationFrame(() => {
        setTimeout(() => btn.classList.add('rendered'), 15);
      });
    });

    activeShells.forEach(sIdx => {
      const orbit = document.createElement('div');
      orbit.className = 'rm-shell-orbit';
      const d = SHELL_RADII[sIdx] * 2;
      orbit.style.width = `${d}px`;
      orbit.style.height = `${d}px`;
      orbit.style.marginTop = `-${SHELL_RADII[sIdx]}px`;
      orbit.style.marginLeft = `-${SHELL_RADII[sIdx]}px`;
      orbitsContainer.appendChild(orbit);
    });

    if (menuStack.length > 0) {
      coreBtn.classList.add('visible');
    } else {
      coreBtn.classList.remove('visible');
    }
  }

  function createMenuDOM() {
    menuEl = document.createElement('div');
    menuEl.className = 'radial-menu-wrapper';

    canvas = document.createElement('canvas');
    canvas.className = 'rm-canvas-layer';
    ctx = canvas.getContext('2d');
    menuEl.appendChild(canvas);

    orbitsContainer = document.createElement('div');
    menuEl.appendChild(orbitsContainer);

    itemsContainer = document.createElement('div');
    menuEl.appendChild(itemsContainer);

    coreBtn = document.createElement('button');
    coreBtn.className = 'rm-core-btn';
    coreBtn.innerHTML = '✕';
    coreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (menuStack.length > 0) {
        const prevLevel = menuStack.pop();
        renderMenuLevel(prevLevel);
        triggerParticleBurst();
      } else {
        closeMenu();
      }
    });
    menuEl.appendChild(coreBtn);

    document.body.appendChild(menuEl);
  }

  function openMenu(x, y) {
    const margin = 180;
    const clampedX = Math.max(margin, Math.min(x, window.innerWidth - margin));
    const clampedY = Math.max(margin, Math.min(y, window.innerHeight - margin));

    menuEl.style.left = `${clampedX}px`;
    menuEl.style.top = `${clampedY}px`;
    menuEl.classList.add('active');
    isOpen = true;

    menuStack = [];
    renderMenuLevel(RADIAL_MENU_DATA);
    triggerParticleBurst();
  }

  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    const oldItems = itemsContainer.querySelectorAll('.rm-item');
    oldItems.forEach(el => el.classList.remove('rendered'));
    coreBtn.classList.remove('visible');
    isOpen = false;
  }

  // 🎯 トリプルタップ & 長押しイベントリスナー
  function initEvents() {
    document.addEventListener('pointerdown', (e) => {
      if (isOpen && menuEl.contains(e.target)) return;
      if (isOpen && !menuEl.contains(e.target)) {
        closeMenu();
        return;
      }

      startX = e.clientX; 
      startY = e.clientY;

      // 🔥 トリプルタップ/クリックの判定処理
      tapCount++;
      clearTimeout(tapTimer);

      if (tapCount === 3) {
        // 3回連続タップ成功！即座にメニュー展開
        clearTimeout(timer);
        timer = null;
        tapCount = 0;
        openMenu(startX, startY);
        return;
      }

      tapTimer = setTimeout(() => {
        tapCount = 0;
      }, TRIPLE_TAP_DELAY_MS);

      // 🔥 長押しの判定処理
      clearTimeout(timer);
      timer = setTimeout(() => {
        tapCount = 0;
        openMenu(startX, startY);
      }, LONG_PRESS_MS);
    });

    document.addEventListener('pointermove', (e) => {
      if (!timer || isOpen) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) {
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
    document.addEventListener('DOMContentLoaded', () => { createMenuDOM(); initEvents(); });
  } else {
    createMenuDOM(); initEvents();
  }
})();
