/**
 * ✏️ pen.js - 手書きジェスチャー描画エンジン（複数筆対応版）
 */
(function () {
  'use strict';

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
    if (overlayEl) return;

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
    statusText.textContent = '✨ 魔法陣を描いてください（複数筆OK）';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'pen-btn';
    clearBtn.style.background = 'rgba(255, 255, 255, 0.15)';
    clearBtn.style.color = '#ffffff';
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
    initEvents();
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw();
  }

  function addParticle(x, y) {
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2 + 0.5,
        size: Math.random() * 4 + 1.5,
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
      p.alpha -= 0.022;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 12;
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
      ctx.strokeStyle = p2.color || `hsl(${p2.hue}, 95%, 68%)`;
      ctx.shadowBlur = 18;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.stroke();
    }
    ctx.restore();
  }

  function redraw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    allStrokes.forEach(stroke => drawStroke(stroke));
    if (currentStroke.length > 0) drawStroke(currentStroke);
    updateAndDrawParticles();
  }

  function loop() {
    hue = (hue + 2.5) % 360;
    redraw();
    animFrameId = requestAnimationFrame(loop);
  }

  function initEvents() {
    overlayEl.addEventListener('pointerdown', (e) => {
      if (!overlayEl.classList.contains('active')) return;
      if (e.target.closest('.pen-bottom-bar')) return;

      e.preventDefault();
      try { overlayEl.setPointerCapture(e.pointerId); } catch (err) {}

      isDrawing = true;
      clearTimeout(recognizerTimer); // 書き足している間は解析タイマーをストップ！
      currentStroke = [{ x: e.clientX, y: e.clientY, hue: hue }];
      addParticle(e.clientX, e.clientY);
    });

    overlayEl.addEventListener('pointermove', (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      currentStroke.push({ x: e.clientX, y: e.clientY, hue: hue });
      addParticle(e.clientX, e.clientY);
    });

    const stopDrawing = (e) => {
      if (!isDrawing) return;
      isDrawing = false;
      try { overlayEl.releasePointerCapture(e.pointerId); } catch (err) {}

      if (currentStroke.length > 0) {
        allStrokes.push(currentStroke);
        currentStroke = [];
      }
      scheduleRecognition(); // 手が離れてから900ms待って解析！
    };

    overlayEl.addEventListener('pointerup', stopDrawing);
    overlayEl.addEventListener('pointercancel', stopDrawing);
  }

  function scheduleRecognition() {
    clearTimeout(recognizerTimer);
    const statusEl = document.getElementById('pen-status');
    if (statusEl) statusEl.textContent = `⚡ 魔法陣解析中... (${allStrokes.length} 筆)`;

    // 複数筆を最後まで描き切れるよう900ms待機
    recognizerTimer = setTimeout(() => {
      if (allStrokes.length === 0) return;
      const result = window.GestureRecognizer ? window.GestureRecognizer.recognize(allStrokes) : null;

      if (result && window.GestureActions) {
        if (statusEl) statusEl.textContent = `🎯 属性発動: 【${result}】`;
        window.GestureActions.execute(result);
      } else if (statusEl) {
        statusEl.textContent = '❌ 魔法陣が判定できませんでした';
        setTimeout(() => {
          if (statusEl) statusEl.textContent = '✨ 魔法陣を描いてください（複数筆OK）';
        }, 1600);
      }
    }, 900);
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
    if (statusEl) statusEl.textContent = '✨ 魔法陣を描いてください（複数筆OK）';
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  window.PenEngine = { open, close, clearCanvas };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }
})();
