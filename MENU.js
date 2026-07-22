/**
 * ======================================================
 * 📋 多次元配列データ (無限ネスト & Ajax対応)
 * ======================================================
 */
const RADIAL_MENU_DATA = [
  { label: 'ホーム', icon: '🏠', url: 'index.html' },
  { label: '検索', icon: '🔍', action: () => alert('🔍 検索モーダル起動') },
  {
    label: 'システム',
    icon: '⚙️',
    items: [
      { label: '音量設定', icon: '🔊', action: () => alert('🔊 音量調整') },
      { label: 'ディスプレイ', icon: '🖥️', action: () => alert('🖥️ 画面設定') },
      {
        label: 'ネットワーク',
        icon: '📡',
        // 3次元ネスト
        items: [
          { label: 'Wi-Fi', icon: '📶', action: () => alert('📶 Wi-Fi接続') },
          { label: 'Bluetooth', icon: '🎧', action: () => alert('🎧 Bluetooth設定') }
        ]
      }
    ]
  },
  {
    label: 'ライブラリ',
    icon: '📁',
    items: [
      { label: 'ドキュメント', icon: '📄', url: 'docs.html' },
      { label: 'メディアギャラリー', icon: '🖼️', url: 'gallery.html' }
    ]
  },
  { label: 'セキュリティ', icon: '🛡️', action: () => alert('🛡️ スキャン完了') }
];

(function () {
  const LONG_PRESS_MS = 380;
  const MOVE_THRESHOLD = 8;

  let menuEl = null;
  let canvas = null;
  let ctx = null;
  let timer = null;
  let startX = 0, startY = 0;
  let isOpen = false;
  let animId = null;

  // 💥 1. Canvasハイパー・パーティクル＆衝撃波エンジン
  function triggerParticleBurst() {
    if (!canvas || !ctx) return;

    canvas.width = 500;
    canvas.height = 500;
    const cX = canvas.width / 2;
    const cY = canvas.height / 2;

    let shockwaveRadius = 10;
    let shockwaveOpacity = 1;

    // スパーク粒子30本生成
    const particles = Array.from({ length: 30 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      return {
        x: cX,
        y: cY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color: Math.random() > 0.5 ? '#00f0ff' : '#ff007f',
        alpha: 1,
        decay: Math.random() * 0.03 + 0.015
      };
    });

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // A. 衝撃波リングの描画
      if (shockwaveOpacity > 0) {
        ctx.beginPath();
        ctx.arc(cX, cY, shockwaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${shockwaveOpacity})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.stroke();

        shockwaveRadius += 7;
        shockwaveOpacity -= 0.035;
      }

      // B. スパーク粒子の描画・更新
      let aliveCount = 0;
      particles.forEach(p => {
        if (p.alpha > 0) {
          aliveCount++;
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.94; // 空気抵抗
          p.vy *= 0.94;
          p.alpha -= p.decay;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fill();
        }
      });

      if (shockwaveOpacity > 0 || aliveCount > 0) {
        animId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    if (animId) cancelAnimationFrame(animId);
    render();
  }

  // 🚀 2. Ajax非同期遷移
  async function navigateAjax(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const htmlText = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const newContent = doc.querySelector('#app') || doc.querySelector('main') || doc.body;
      const targetContainer = document.querySelector('#app') || document.querySelector('main');

      if (targetContainer && newContent) {
        targetContainer.style.opacity = '0';
        targetContainer.style.transform = 'scale(0.98)';
        targetContainer.style.transition = 'all 0.25s ease';
        
        setTimeout(() => {
          targetContainer.innerHTML = newContent.innerHTML;
          targetContainer.style.opacity = '1';
          targetContainer.style.transform = 'scale(1)';
          history.pushState({ path: url }, '', url);
        }, 250);
      } else {
        location.href = url;
      }
    } catch (err) {
      location.href = url;
    }
  }

  window.addEventListener('popstate', () => navigateAjax(location.pathname));

  // 🌲 3. 無限多次元配列対応の再帰構築ロジック
  function buildMenuTree(items, depth = 0, parentAngle = null) {
    const groupEl = document.createElement('div');
    groupEl.className = 'rm-group' + (depth === 0 ? ' open' : '');

    const total = items.length;
    const radius = 115 + (depth * 52);

    items.forEach((item, index) => {
      let angle = 0;
      if (depth === 0) {
        angle = (index / total) * 2 * Math.PI - (Math.PI / 2);
      } else {
        const spread = Math.PI * 0.7;
        angle = parentAngle + (index - (total - 1) / 2) * (spread / Math.max(total - 1, 1));
      }

      const x = Math.round(Math.cos(angle) * radius);
      const y = Math.round(Math.sin(angle) * radius);

      if (item.items && item.items.length > 0) {
        const subGroup = buildMenuTree(item.items, depth + 1, angle);
        subGroup.classList.add('has-sub');

        const btn = document.createElement('button');
        btn.className = 'rm-item';
        btn.setAttribute('data-label', item.label);
        btn.innerHTML = item.icon;
        btn.style.setProperty('--x', `${x}px`);
        btn.style.setProperty('--y', `${y}px`);
        btn.style.transitionDelay = `${index * 0.04}s`;

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isExpanded = subGroup.classList.contains('is-expanded');
          groupEl.querySelectorAll(':scope > .rm-group').forEach(el => {
            el.classList.remove('is-expanded', 'open');
          });
          if (!isExpanded) {
            subGroup.classList.add('is-expanded', 'open');
            triggerParticleBurst(); // サブ展開時もパルス衝撃波発火
          }
        });

        subGroup.insertBefore(btn, subGroup.firstChild);
        groupEl.appendChild(subGroup);
      } else {
        const btn = document.createElement('button');
        btn.className = 'rm-item';
        btn.setAttribute('data-label', item.label);
        btn.innerHTML = item.icon;
        btn.style.setProperty('--x', `${x}px`);
        btn.style.setProperty('--y', `${y}px`);
        btn.style.transitionDelay = `${index * 0.04}s`;

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (item.url) navigateAjax(item.url);
          else if (item.action) item.action();
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
    
    // Canvasパーティクル層
    canvas = document.createElement('canvas');
    canvas.className = 'rm-canvas-layer';
    ctx = canvas.getContext('2d');
    menuEl.appendChild(canvas);

    // 回転外周HUDリング
    const hudRing = document.createElement('div');
    hudRing.className = 'rm-hud-ring';
    menuEl.appendChild(hudRing);

    const tree = buildMenuTree(RADIAL_MENU_DATA);
    menuEl.appendChild(tree);

    document.body.appendChild(menuEl);
  }

  function getAdjustedPosition(clientX, clientY) {
    const margin = 165; 
    return {
      x: Math.max(margin, Math.min(clientX, window.innerWidth - margin)),
      y: Math.max(margin, Math.min(clientY, window.innerHeight - margin))
    };
  }

  function openMenu(x, y) {
    const pos = getAdjustedPosition(x, y);
    menuEl.style.left = `${pos.x}px`;
    menuEl.style.top = `${pos.y}px`;
    menuEl.classList.add('active');
    isOpen = true;

    // 開いた瞬間に極太パーティクル衝撃波を爆発させる
    triggerParticleBurst();
  }

  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('active');
    menuEl.querySelectorAll('.rm-group').forEach(el => {
      el.classList.remove('is-expanded');
      if (el !== menuEl.querySelector('.rm-group')) el.classList.remove('open');
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
    document.addEventListener('DOMContentLoaded', () => {
      createMenuDOM();
      initEvents();
    });
  } else {
    createMenuDOM();
    initEvents();
  }
})();
