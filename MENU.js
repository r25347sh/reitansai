/**
 * ======================================================
 * 📋 多次元配列データ（`url`指定でAjax非同期遷移）
 * ======================================================
 */
const RADIAL_MENU_DATA = [
  { label: 'ホーム', icon: '🏠', url: 'index.html' },
  { label: '会社概要', icon: '🏢', url: 'about.html' },
  {
    label: 'サービス',
    icon: '⚡',
    items: [
      { label: 'Web開発', icon: '💻', url: 'web.html' },
      { label: 'アプリ制作', icon: '📱', url: 'app.html' },
      {
        label: '詳細設定',
        icon: '⚙️',
        items: [
          { label: 'デザイン', icon: '🎨', action: () => alert('デザイン設定') },
          { label: '通知', icon: '🔔', action: () => alert('通知設定') }
        ]
      }
    ]
  },
  { label: 'お問い合わせ', icon: '✉️', url: 'contact.html' }
];

(function () {
  const LONG_PRESS_MS = 400;
  const MOVE_THRESHOLD = 8;
  const PARTICLE_COUNT = 8;
  const PARTICLE_RADIUS = 140;

  let menuEl = null;
  let particleContainer = null;
  let timer = null;
  let startX = 0, startY = 0;
  let isOpen = false;

  // 🚀 1. Ajax非同期遷移
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
        targetContainer.style.transition = 'opacity 0.2s ease';
        
        setTimeout(() => {
          targetContainer.innerHTML = newContent.innerHTML;
          targetContainer.style.opacity = '1';
          history.pushState({ path: url }, '', url);
        }, 200);
      } else {
        location.href = url;
      }
    } catch (err) {
      console.warn('Ajax遷移失敗のため、通常のページ遷移を実行します:', err);
      location.href = url;
    }
  }

  window.addEventListener('popstate', () => {
    navigateAjax(location.pathname);
  });

  // ✨ 2. 粒子集束演出（位置計算と発火の修正）
  function playGatheringParticles(centerX, centerY, callback) {
    particleContainer.innerHTML = '';

    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * 2 * Math.PI;
      const sX = Math.cos(angle) * PARTICLE_RADIUS;
      const sY = Math.sin(angle) * PARTICLE_RADIUS;

      const p = document.createElement('div');
      p.className = 'rm-particle';
      p.style.setProperty('--start-x', `${sX}px`);
      p.style.setProperty('--start-y', `${sY}px`);
      
      particleContainer.appendChild(p);
      particles.push(p);
    }

    // ブラウザのレンダリングを挟んで確実にアニメーションを発火させる
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        particles.forEach(p => p.classList.add('gathering'));
      });
    });

    setTimeout(() => {
      particleContainer.innerHTML = '';
      if (callback) callback();
    }, 320);
  }

  // 3. 多次元メニュー構築
  function buildMenuTree(items, depth = 0, parentAngle = null) {
    const groupEl = document.createElement('div');
    groupEl.className = 'rm-group' + (depth === 0 ? ' open' : '');

    const total = items.length;
    const radius = 110 + (depth * 50);

    items.forEach((item, index) => {
      let angle = 0;
      if (depth === 0) {
        angle = (index / total) * 2 * Math.PI - (Math.PI / 2);
      } else {
        const spread = Math.PI * 0.65;
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
        btn.style.transitionDelay = `${index * 0.035}s`;

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isExpanded = subGroup.classList.contains('is-expanded');
          groupEl.querySelectorAll(':scope > .rm-group').forEach(el => {
            el.classList.remove('is-expanded', 'open');
          });
          if (!isExpanded) subGroup.classList.add('is-expanded', 'open');
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
        btn.style.transitionDelay = `${index * 0.035}s`;

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (item.url) {
            navigateAjax(item.url);
          } else if (item.action) {
            item.action();
          }
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
    
    particleContainer = document.createElement('div');
    particleContainer.className = 'rm-particle-container';
    menuEl.appendChild(particleContainer);

    const centerIndicator = document.createElement('div');
    centerIndicator.className = 'radial-menu-center-indicator';
    menuEl.appendChild(centerIndicator);

    const tree = buildMenuTree(RADIAL_MENU_DATA);
    menuEl.appendChild(tree);

    document.body.appendChild(menuEl);
  }

  function getAdjustedPosition(clientX, clientY) {
    const margin = 160; 
    return {
      x: Math.max(margin, Math.min(clientX, window.innerWidth - margin)),
      y: Math.max(margin, Math.min(clientY, window.innerHeight - margin))
    };
  }

  function openMenu(x, y) {
    const pos = getAdjustedPosition(x, y);
    
    // まずコンテナを画面上に配置して有効化
    menuEl.style.left = `${pos.x}px`;
    menuEl.style.top = `${pos.y}px`;
    menuEl.classList.add('active');

    // コンテナが表示されてから粒子集束アニメーションを開始
    playGatheringParticles(pos.x, pos.y, () => {
      isOpen = true;
    });
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
