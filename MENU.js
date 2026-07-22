/**
 * 📋 電子殻型・可変長多次元データ
 */
const RADIAL_MENU_DATA = [
  { label: 'ホーム', icon: '🏠', url: 'index.html' },
  { label: '検索', icon: '🔍', action: () => alert('検索') },
  {
    label: 'システム設定',
    icon: '⚙️',
    // 子要素を展開すると、親が消去され以下の7要素が電子殻配置で再配置されます
    items: [
      { label: '音量', icon: '🔊', action: () => alert('音量') },
      { label: 'ディスプレイ', icon: '🖥️', action: () => alert('画面') },
      { label: 'ネットワーク', icon: '📡', action: () => alert('通信') },
      { label: 'セキュリティ', icon: '🛡️', action: () => alert('保護') },
      { label: 'ストレージ', icon: '💾', action: () => alert('容量') },
      { label: 'バッテリー', icon: '🔋', action: () => alert('電池') },
      { label: 'アップデート', icon: '🔄', action: () => alert('更新') }
    ]
  },
  {
    label: 'メディア',
    icon: '📁',
    items: [
      { label: 'ドキュメント', icon: '📄', url: 'docs.html' },
      { label: 'ギャラリー', icon: '🖼️', url: 'gallery.html' },
      { label: 'ミュージック', icon: '🎵', url: 'music.html' }
    ]
  },
  { label: 'アカウント', icon: '👤', action: () => alert('ユーザー') },
  { label: '通知', icon: '🔔', action: () => alert('通知') }
];

(function () {
  const LONG_PRESS_MS = 380;
  const MOVE_THRESHOLD = 8;

  // ⚛️ 電子殻（Shell）の各周ごとの最大収納数と半径(px)設定
  const SHELL_CAPACITIES = [6, 10, 14, 18]; // 1周目: 6個, 2周目: 10個...
  const SHELL_RADII = [105, 175, 245, 315];   /* ゆったり配置 */

  let menuEl = null;
  let itemsContainer = null;
  let orbitsContainer = null;
  let coreCloseBtn = null;
  let canvas = null;
  let ctx = null;

  let timer = null;
  let startX = 0, startY = 0;
  let isOpen = false;
  let menuStack = []; // 階層の深さを管理するスタック

  // Ajax遷移
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
        }, 200);
      } else {
        location.href = url;
      }
    } catch {
      location.href = url;
    }
  }

  // Particle Pulse
  function triggerParticleBurst() {
    if (!canvas || !ctx) return;
    canvas.width = 600;
    canvas.height = 600;
    const cX = 300, cY = 300;

    let shockRadius = 10, shockAlpha = 1;
    const particles = Array.from({ length: 24 }, () => {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 7 + 3;
      return {
        x: cX, y: cY,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        size: Math.random() * 3 + 2,
        color: Math.random() > 0.5 ? '#00f0ff' : '#ff007f',
        alpha: 1, decay: Math.random() * 0.03 + 0.02
      };
    });

    function render() {
      ctx.clearRect(0, 0, 600, 600);
      if (shockAlpha > 0) {
        ctx.beginPath();
        ctx.arc(cX, cY, shockRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${shockAlpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        shockRadius += 8; shockAlpha -= 0.04;
      }

      let alive = false;
      particles.forEach(p => {
        if (p.alpha > 0) {
          alive = true;
          p.x += p.vx; p.y += p.vy;
          p.vx *= 0.94; p.vy *= 0.94;
          p.alpha -= p.decay;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fill();
        }
      });

      if (shockAlpha > 0 || alive) requestAnimationFrame(render);
      else ctx.clearRect(0, 0, 600, 600);
    }
    render();
  }

  // ⚛️ 電子殻アルゴリズム：可変長データを各周へ自動配置計算
  function calculateShellLayout(items) {
    const layout = [];
    let remaining = items.length;
    let itemIdx = 0;

    for (let sIdx = 0; sIdx < SHELL_CAPACITIES.length && remaining > 0; sIdx++) {
      const capacity = SHELL_CAPACITIES[sIdx];
      const countInShell = Math.min(remaining, capacity);
      const radius = SHELL_RADII[sIdx];

      for (let i = 0; i < countInShell; i++) {
        // 角度を要素数で完全均等分割（真上 -90deg 起点）
        const angle = (i / countInShell) * 2 * Math.PI - (Math.PI / 2);
        const x = Math.round(Math.cos(angle) * radius);
        const y = Math.round(Math.sin(angle) * radius);

        layout.push({
          item: items[itemIdx],
          x, y,
          shellIndex: sIdx,
          radius
        });
        itemIdx++;
      }
      remaining -= countInShell;
    }
    return layout;
  }

  // 🔄 画面上の全要素をクリアして入れ替えるレンダリング関数
  function renderMenuLevel(items) {
    // 既存のアイテムを中央に吸い込んで削除
    const oldItems = itemsContainer.querySelectorAll('.rm-item');
    oldItems.forEach(el => {
      el.classList.remove('rendered');
      setTimeout(() => el.remove(), 250);
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
      btn.style.transitionDelay = `${index * 0.03}s`;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (data.item.items && data.item.items.length > 0) {
          // 💡 親が押されたら現在階層を保持して子メニュー単体で画面を置き換える
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

      // 時間差でアニメーションポップイン
      requestAnimationFrame(() => {
        setTimeout(() => btn.classList.add('rendered'), 20);
      });
    });

    // アクティブな電子殻の軌道リングを生成
    activeShells.forEach(sIdx => {
      const orbit = document.createElement('div');
      orbit.className = 'rm-shell-orbit';
      const diameter = SHELL_RADII[sIdx] * 2;
      orbit.style.width = `${diameter}px`;
      orbit.style.height = `${diameter}px`;
      orbit.style.marginTop = `-${SHELL_RADII[sIdx]}px`;
      orbit.style.marginLeft = `-${SHELL_RADII[sIdx]}px`;
      orbitsContainer.appendChild(orbit);
    });

    // 深い階層へ進んでいる場合は中央に「閉じる/戻る」ボタンを表示
    if (menuStack.length > 0) {
      coreCloseBtn.classList.add('visible');
    } else {
      coreCloseBtn.classList.remove('visible');
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

    // 中央に現れる階層戻る（閉じる）アイコン
    coreCloseBtn = document.createElement('button');
    coreCloseBtn.className = 'rm-core-close-btn';
    coreCloseBtn.innerHTML = '✕';
    coreCloseBtn.title = '前の階層へ戻る';
    coreCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (menuStack.length > 0) {
        const prevLevel = menuStack.pop();
        renderMenuLevel(prevLevel);
        triggerParticleBurst();
      } else {
        closeMenu();
      }
    });
    menuEl.appendChild(coreCloseBtn);

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

    menuStack = []; // スタック初期化
    renderMenuLevel(RADIAL_MENU_DATA);
    triggerParticleBurst();
  }

  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    const oldItems = itemsContainer.querySelectorAll('.rm-item');
    oldItems.forEach(el => el.classList.remove('rendered'));
    coreCloseBtn.classList.remove('visible');
    isOpen = false;
  }

  function initEvents() {
    document.addEventListener('pointerdown', (e) => {
      if (isOpen && menuEl.contains(e.target)) return;
      if (isOpen && !menuEl.contains(e.target)) {
        closeMenu();
        return;
      }

      startX = e.clientX; startY = e.clientY;
      clearTimeout(timer);
      timer = setTimeout(() => openMenu(startX, startY), LONG_PRESS_MS);
    });

    document.addEventListener('pointermove', (e) => {
      if (!timer || isOpen) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) {
        clearTimeout(timer);
        timer = null;
      }
    });

    document.addEventListener('pointerup', () => {
      if (timer && !isOpen) { clearTimeout(timer); timer = null; }
    });

    document.addEventListener('contextmenu', (e) => { if (isOpen) e.preventDefault(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { createMenuDOM(); initEvents(); });
  } else {
    createMenuDOM(); initEvents();
  }
})();
