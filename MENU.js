:root {
  /* ==============================================
     ⚛️ 電子殻 (Electron Shell) カラー＆変数
     ============================================== */
  --rm-font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;

  --rm-bg-glass: rgba(10, 15, 30, 0.88);
  --rm-bg-hover: rgba(20, 35, 65, 0.95);
  --rm-border-color: rgba(56, 189, 248, 0.35);
  --rm-text-main: #f8fafc;

  --rm-neon-cyan: #00f0ff;
  --rm-neon-magenta: #ff007f;
  --rm-neon-glow-cyan: rgba(0, 240, 255, 0.5);
  --rm-neon-glow-magenta: rgba(255, 0, 127, 0.6);

  --rm-label-bg: rgba(5, 10, 20, 0.95);
  --rm-label-border: #00f0ff;
  --rm-label-text: #ffffff;

  --rm-item-size: 52px;
  --rm-spring-physics: cubic-bezier(0.34, 1.56, 0.64, 1);
  --rm-z-index: 9999999;
}

body {
  user-select: none;
  -webkit-user-select: none;
  font-family: var(--rm-font-family);
}

.radial-menu-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  z-index: var(--rm-z-index);
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
  perspective: 1000px;
  transition: visibility 0s linear 0.3s, opacity 0.25s ease;
}

.radial-menu-wrapper.active {
  pointer-events: auto;
  visibility: visible;
  opacity: 1;
  transition: visibility 0s linear 0s, opacity 0.2s ease;
}

.rm-canvas-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}

/* ⚛️ 電子殻軌道（オービットリング） */
.rm-shell-orbit {
  position: absolute;
  border-radius: 50%;
  border: 1px dashed rgba(0, 240, 255, 0.25);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.1);
  pointer-events: none;
  z-index: 2;
  transform: scale(0);
  opacity: 0;
  transition: transform 0.5s var(--rm-spring-physics), opacity 0.3s ease;
}

.radial-menu-wrapper.active .rm-shell-orbit {
  transform: scale(1);
  opacity: 1;
}

/* ⚛️ 階層切替時の「中央・閉じる/戻る」コアボタン */
.rm-core-close-btn {
  position: absolute;
  width: 44px;
  height: 44px;
  margin-top: -22px;
  margin-left: -22px;
  border-radius: 50%;
  border: 1px solid var(--rm-neon-magenta);
  background: rgba(255, 0, 127, 0.15);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 0 15px var(--rm-neon-glow-magenta);
  
  opacity: 0;
  pointer-events: none;
  transform: scale(0) rotate(-90deg);
  transition: transform 0.4s var(--rm-spring-physics), opacity 0.25s ease;
}

.rm-core-close-btn.visible {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1) rotate(0deg);
}

.rm-core-close-btn:hover {
  background: rgba(255, 0, 127, 0.4);
  transform: scale(1.15) rotate(90deg) !important;
}

/* 🌀 メニューアイテム */
.rm-item {
  position: absolute;
  width: var(--rm-item-size);
  height: var(--rm-item-size);
  margin-top: calc(-1 * var(--rm-item-size) / 2);
  margin-left: calc(-1 * var(--rm-item-size) / 2);
  border-radius: 50%;
  border: 1px solid var(--rm-border-color);
  background: var(--rm-bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--rm-text-main);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;

  /* 出現/消滅アニメーション（収縮・消滅） */
  opacity: 0;
  pointer-events: none;
  transform: translate3d(0, 0, -100px) scale(0) rotate(-180deg);
  transition: 
    transform 0.45s var(--rm-spring-physics),
    opacity 0.25s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.radial-menu-wrapper.active .rm-item.rendered {
  opacity: 1;
  pointer-events: auto;
  transform: translate3d(var(--x), var(--y), 0) scale(1) rotate(0deg);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5), 0 0 10px var(--rm-neon-glow-cyan);
}

.rm-item:hover, .rm-item:active {
  background: var(--rm-bg-hover);
  border-color: var(--rm-neon-magenta);
  color: #ffffff;
  box-shadow: 0 0 25px var(--rm-neon-glow-magenta), inset 0 0 10px var(--rm-neon-glow-magenta);
  transform: translate3d(var(--x), var(--y), 20px) scale(1.2) !important;
}

/* 🏷️ ラベル表示 */
.rm-item::after {
  content: attr(data-label);
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%) translateY(-6px) scale(0.8);
  background: var(--rm-label-bg);
  color: var(--rm-label-text);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--rm-label-border);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  box-shadow: 0 0 10px var(--rm-neon-glow-cyan);
  transition: all 0.25s var(--rm-spring-physics);
}

.radial-menu-wrapper.active .rm-item.rendered::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}

/* サブメニュー保有のノード（親） */
.rm-item.has-sub {
  border-color: var(--rm-neon-cyan);
  background: radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, var(--rm-bg-glass) 100%);
    }
