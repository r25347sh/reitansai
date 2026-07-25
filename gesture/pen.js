/**
 * ✏️ pen.js - 手書きジェスチャー描画エンジン
 */
(function () {
  let overlayEl = null;
  let canvas = null;
  let ctx = null;
  let isDrawing = false;
  let currentStroke = [];
  let allStrokes = [];
  let particles = [];
  let hue = 0;
  let recognizerTimer = null;
  let animFrameId = null;

  function createUI() {
    overlayEl = document.createElement('div');
    overlayEl.className = 'pen-overlay';

    canvas = document.createElement('canvas');
    canvas.className = 'pen-canvas';
    overlayEl.appendChild(canvas);

    const bottomBar = document.createElement('div');
    bottomBar.className = 'pen-bottom-bar';

    const statusText = document.createElement('span');
    statusText.className = 'pen-status-text';
    statusText.id = 'pen-status';
    statusText.textContent = '✨ 魔法陣（ジェスチャー）を描いてください';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'pen-btn';
    clearBtn.style.background = 'rgba(255,255,255,0.2)';
    clearBtn.style.color = '#fff';
    clearBtn.textContent = 'クリア';
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearCanvas();
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'pen-btn';
    closeBtn.textContent = '✕ 閉じる';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });

    bottomBar.appendChild(statusText);
    bottomBar.appendChild(clearBtn);
    bottomBar.appendChild(closeBtn);
    overlayEl.appendChild(bottomBar);

    document.body.appendChild(overlayEl);
    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw();
  }

  // ✨ 虹色ラメ粒子の追加
  function addParticle(x, y) {
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 1.5 + 0.5,
        size: Math.random() * 3 + 1,
        color: `hsl(${hue}, 100%, 75%)`,
        alpha: 1
      });
    }
  }

  function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.025;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawStroke(strokePoints) {
    if (strokePoints.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;

    for (let i = 1; i < strokePoints.length; i++) {
      const p1 = strokePoints[i - 1];
      const p2 = strokePoints[i];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = p2.color || `hsl(${p2.hue}, 95%, 65%)`;
      ctx.shadowBlur = 14;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.stroke();
    }
    ctx.restore();
  }

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    allStrokes.forEach(stroke => drawStroke(stroke));
    if (currentStroke.length > 0) drawStroke(currentStroke);
    updateAndDrawParticles();
  }

  function loop() {
    hue = (hue + 2) % 360;
    redraw();
    animFrameId = requestAnimationFrame(loop);
  }

  function initEvents() {
    overlayEl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.pen-bottom-bar')) return;
      isDrawing = true;
      clearTimeout(recognizerTimer);
      currentStroke = [{ x: e.clientX, y: e.clientY, hue: hue }];
      addParticle(e.clientX, e.clientY);
    });

    overlayEl.addEventListener('pointermove', (e) => {
      if (!isDrawing) return;
      const pt = { x: e.clientX, y: e.clientY, hue: hue };
      currentStroke.push(pt);
      addParticle(e.clientX, e.clientY);
    });

    const stopDrawing = () => {
      if (!isDrawing) return;
      isDrawing = false;
      if (currentStroke.length > 0) {
        allStrokes.push(currentStroke);
        currentStroke = [];
      }
      scheduleRecognition();
    };

    overlayEl.addEventListener('pointerup', stopDrawing);
    overlayEl.addEventListener('pointercancel', stopDrawing);
  }

  function scheduleRecognition() {
    clearTimeout(recognizerTimer);
    const statusEl = document.getElementById('pen-status');
    if (statusEl) statusEl.textContent = '⚡ 解析中...';

    recognizerTimer = setTimeout(() => {
      if (allStrokes.length === 0) return;
      const result = window.GestureRecognizer ? window.GestureRecognizer.recognize(allStrokes) : null;
      if (result && window.GestureActions) {
        window.GestureActions.execute(result);
      } else if (statusEl) {
        statusEl.textContent = '❌ ジェスチャーが認識できませんでした';
        setTimeout(() => {
          if (statusEl) statusEl.textContent = '✨ 魔法陣（ジェスチャー）を描いてください';
        }, 1500);
      }
    }, 750);
  }

  function open() {
    if (!overlayEl) createUI();
    overlayEl.classList.add('active');
    clearCanvas();
    if (!animFrameId) loop();
  }

  function close() {
    if (!overlayEl) return;
    overlayEl.classList.remove('active');
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function clearCanvas() {
    allStrokes = [];
    currentStroke = [];
    particles = [];
    clearTimeout(recognizerTimer);
    const statusEl = document.getElementById('pen-status');
    if (statusEl) statusEl.textContent = '✨ 魔法陣（ジェスチャー）を描いてください';
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function getCanvasDataURL() {
    return canvas ? canvas.toDataURL('image/png') : null;
  }

  window.PenEngine = { open, close, clearCanvas, getCanvasDataURL };

  document.addEventListener('DOMContentLoaded', () => {
    createUI();
    initEvents();
  });
})();
