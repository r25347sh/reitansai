/**
 * 🔮 GestureRecognizer - インフィニティ精度超強化 ＆ 全形状ラスターエンジン
 */
(function () {
  'use strict';

  const GRID_SIZE = 32;
  const CANVAS_SIZE = 128;
  const MIN_SCORE_THRESHOLD = 0.52; // 判定域を最適調整

  const offCanvas = document.createElement('canvas');
  offCanvas.width = CANVAS_SIZE;
  offCanvas.height = CANVAS_SIZE;
  const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

  const TEMPLATES = [
    // ♾️ インフィニティの認識精度向上のための極太2パターン
    { name: '♾️ インフィニティ', draw: drawInfinityTemplateHorizontal },
    { name: '♾️ インフィニティ', draw: drawInfinityTemplateVertical },
    
    // ✅ チェックの多角精度向上
    { name: '✅ チェック', draw: drawCheckTemplateStandard },
    { name: '✅ チェック', draw: drawCheckTemplateSharp },

    // 🎁 その他イースターエッグ＆基本ジェスチャー
    { name: '🌀 ヴォイド', draw: drawSpiralTemplate },
    { name: '🎆 花火', draw: drawBurstTemplate },
    { name: '♡ ハート', draw: drawHeartTemplate },
    { name: '★ 星', draw: drawStarTemplate },
    { name: '◯ 円', draw: drawCircleTemplate },
    { name: '△ 三角', draw: drawTriangleTemplate },
    { name: '□ 四角', draw: drawSquareTemplate },
    { name: '⚡ 稲妻', draw: drawLightningTemplate },
    { name: '❌ バツ', draw: drawCrossTemplate },
    { name: '↑ 上矢印', draw: drawArrowUpTemplate },
    { name: '↓ 下矢印', draw: drawArrowDownTemplate }
  ];

  let compiledTemplates = null;

  function initTemplates() {
    compiledTemplates = TEMPLATES.map(tpl => {
      offCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      offCtx.fillStyle = '#000000';
      offCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      offCtx.strokeStyle = '#ffffff';
      offCtx.fillStyle = '#ffffff';
      offCtx.lineWidth = 18; // 線幅を18pxに太くして線の掠れを完全防止！
      offCtx.lineCap = 'round';
      offCtx.lineJoin = 'round';

      tpl.draw(offCtx, CANVAS_SIZE);

      const grid = extractBlurredGrid();
      return { name: tpl.name, grid };
    });
  }

  function renderStrokesToGrid(strokes) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    strokes.forEach(stroke => {
      stroke.forEach(pt => {
        minX = Math.min(minX, pt.x);
        maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y);
        maxY = Math.max(maxY, pt.y);
      });
    });

    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const scale = (CANVAS_SIZE * 0.72) / Math.max(width, height);
    const offsetX = (CANVAS_SIZE - width * scale) / 2;
    const offsetY = (CANVAS_SIZE - height * scale) / 2;

    offCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    offCtx.fillStyle = '#000000';
    offCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    offCtx.strokeStyle = '#ffffff';
    offCtx.lineWidth = 18;
    offCtx.lineCap = 'round';
    offCtx.lineJoin = 'round';

    strokes.forEach(stroke => {
      if (stroke.length < 2) return;
      offCtx.beginPath();
      offCtx.moveTo((stroke[0].x - minX) * scale + offsetX, (stroke[0].y - minY) * scale + offsetY);
      for (let i = 1; i < stroke.length; i++) {
        offCtx.lineTo((stroke[i].x - minX) * scale + offsetX, (stroke[i].y - minY) * scale + offsetY);
      }
      offCtx.stroke();
    });

    return extractBlurredGrid();
  }

  function extractBlurredGrid() {
    const imgData = offCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
    const rawGrid = new Float32Array(GRID_SIZE * GRID_SIZE);
    const ratio = CANVAS_SIZE / GRID_SIZE;

    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        let sum = 0;
        const startY = Math.floor(gy * ratio);
        const startX = Math.floor(gx * ratio);

        for (let py = 0; py < ratio; py++) {
          for (let px = 0; px < ratio; px++) {
            const idx = ((startY + py) * CANVAS_SIZE + (startX + px)) * 4;
            sum += imgData[idx];
          }
        }
        rawGrid[gy * GRID_SIZE + gx] = sum / (ratio * ratio * 255);
      }
    }

    const blurredGrid = new Float32Array(GRID_SIZE * GRID_SIZE);
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        let val = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              val += rawGrid[ny * GRID_SIZE + nx];
              count++;
            }
          }
        }
        blurredGrid[y * GRID_SIZE + x] = val / count;
      }
    }
    return blurredGrid;
  }

  function compareGrids(gridA, gridB) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < gridA.length; i++) {
      dot += gridA[i] * gridB[i];
      normA += gridA[i] * gridA[i];
      normB += gridB[i] * gridB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // --- ♾️ 横向きインフィニティ（ベジェ曲線で交差部を美しく太描画） ---
  function drawInfinityTemplateHorizontal(ctx, sz) {
    ctx.beginPath();
    ctx.moveTo(sz * 0.5, sz * 0.5);
    ctx.bezierCurveTo(sz * 0.7, sz * 0.1, sz * 0.95, sz * 0.2, sz * 0.95, sz * 0.5);
    ctx.bezierCurveTo(sz * 0.95, sz * 0.8, sz * 0.7, sz * 0.9, sz * 0.5, sz * 0.5);
    ctx.bezierCurveTo(sz * 0.3, sz * 0.1, sz * 0.05, sz * 0.2, sz * 0.05, sz * 0.5);
    ctx.bezierCurveTo(sz * 0.05, sz * 0.8, sz * 0.3, sz * 0.9, sz * 0.5, sz * 0.5);
    ctx.stroke();
  }

  // --- ♾️ 縦向きインフィニティ (数字の8) ---
  function drawInfinityTemplateVertical(ctx, sz) {
    ctx.beginPath();
    ctx.arc(sz * 0.5, sz * 0.3, sz * 0.22, 0, Math.PI * 2);
    ctx.arc(sz * 0.5, sz * 0.7, sz * 0.24, 0, Math.PI * 2);
    ctx.stroke();
  }

  // チェック・その他
  function drawCheckTemplateStandard(ctx, sz) {
    ctx.beginPath();
    ctx.moveTo(sz * 0.12, sz * 0.52);
    ctx.lineTo(sz * 0.38, sz * 0.82);
    ctx.lineTo(sz * 0.88, sz * 0.18);
    ctx.stroke();
  }
  function drawCheckTemplateSharp(ctx, sz) {
    ctx.beginPath();
    ctx.moveTo(sz * 0.20, sz * 0.60);
    ctx.lineTo(sz * 0.42, sz * 0.85);
    ctx.lineTo(sz * 0.82, sz * 0.25);
    ctx.stroke();
  }
  function drawSpiralTemplate(ctx, sz) {
    const cx = sz / 2, cy = sz / 2;
    ctx.beginPath();
    for (let i = 0; i < 50; i++) {
      const angle = 0.38 * i;
      const x = cx + (1.3 * i) * Math.cos(angle);
      const y = cy + (1.3 * i) * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  function drawBurstTemplate(ctx, sz) {
    const cx = sz / 2, cy = sz / 2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * sz * 0.42, cy + Math.sin(a) * sz * 0.42);
    }
    ctx.stroke();
  }
  function drawHeartTemplate(ctx, sz) {
    ctx.beginPath();
    ctx.moveTo(sz / 2, sz * 0.82);
    ctx.bezierCurveTo(sz * 0.05, sz * 0.5, sz * 0.05, sz * 0.15, sz * 0.32, sz * 0.15);
    ctx.bezierCurveTo(sz * 0.45, sz * 0.15, sz * 0.5, sz * 0.3, sz / 2, sz * 0.35);
    ctx.bezierCurveTo(sz * 0.5, sz * 0.3, sz * 0.55, sz * 0.15, sz * 0.68, sz * 0.15);
    ctx.bezierCurveTo(sz * 0.95, sz * 0.15, sz * 0.95, sz * 0.5, sz / 2, sz * 0.82);
    ctx.stroke();
  }
  function drawStarTemplate(ctx, sz) {
    const cx = sz / 2, cy = sz / 2, r = sz * 0.42;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  function drawCircleTemplate(ctx, sz) {
    ctx.beginPath();
    ctx.arc(sz / 2, sz / 2, sz * 0.36, 0, Math.PI * 2);
    ctx.stroke();
  }
  function drawTriangleTemplate(ctx, sz) {
    ctx.beginPath();
    ctx.moveTo(sz / 2, sz * 0.15);
    ctx.lineTo(sz * 0.85, sz * 0.85);
    ctx.lineTo(sz * 0.15, sz * 0.85);
    ctx.closePath();
    ctx.stroke();
  }
  function drawSquareTemplate(ctx, sz) {
    ctx.strokeRect(sz * 0.18, sz * 0.18, sz * 0.64, sz * 0.64);
  }
  function drawLightningTemplate(ctx, sz) {
    ctx.beginPath();
    ctx.moveTo(sz * 0.6, sz * 0.12);
    ctx.lineTo(sz * 0.25, sz * 0.5);
    ctx.lineTo(sz * 0.5, sz * 0.5);
    ctx.lineTo(sz * 0.4, sz * 0.88);
    ctx.lineTo(sz * 0.75, sz * 0.48);
    ctx.lineTo(sz * 0.5, sz * 0.48);
    ctx.closePath();
    ctx.stroke();
  }
  function drawCrossTemplate(ctx, sz) {
    ctx.beginPath();
    ctx.moveTo(sz * 0.2, sz * 0.2); ctx.lineTo(sz * 0.8, sz * 0.8);
    ctx.moveTo(sz * 0.8, sz * 0.2); ctx.lineTo(sz * 0.2, sz * 0.8);
    ctx.stroke();
  }
  function drawArrowUpTemplate(ctx, sz) {
    ctx.beginPath();
    ctx.moveTo(sz * 0.2, sz * 0.45); ctx.lineTo(sz / 2, sz * 0.15); ctx.lineTo(sz * 0.8, sz * 0.45);
    ctx.moveTo(sz / 2, sz * 0.15); ctx.lineTo(sz / 2, sz * 0.85);
    ctx.stroke();
  }
  function drawArrowDownTemplate(ctx, sz) {
    ctx.beginPath();
    ctx.moveTo(sz * 0.2, sz * 0.55); ctx.lineTo(sz / 2, sz * 0.85); ctx.lineTo(sz * 0.8, sz * 0.55);
    ctx.moveTo(sz / 2, sz * 0.85); ctx.lineTo(sz / 2, sz * 0.15);
    ctx.stroke();
  }

  function recognize(strokes) {
    if (!strokes || strokes.length === 0) return null;
    if (!compiledTemplates) initTemplates();

    const userGrid = renderStrokesToGrid(strokes);

    let bestMatch = null;
    let maxScore = 0;

    compiledTemplates.forEach(tpl => {
      const score = compareGrids(userGrid, tpl.grid);
      if (score > maxScore) {
        maxScore = score;
        bestMatch = tpl;
      }
    });

    console.log(`✨ Gesture: ${bestMatch ? bestMatch.name : 'None'} (Score: ${(maxScore * 100).toFixed(1)}%)`);

    if (maxScore >= MIN_SCORE_THRESHOLD && bestMatch) {
      return bestMatch.name;
    }
    return null;
  }

  window.GestureRecognizer = { recognize };
})();
