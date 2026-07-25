/**
 * 🔮 GestureRecognizer - 複数筆（マルチストローク）＆高精度ハイブリッド認識エンジン
 */
(function () {
  'use strict';

  const NUM_POINTS = 64;
  const SQUARE_SIZE = 250.0;
  const MIN_SCORE_THRESHOLD = 0.65; // 65%未満は未認識（ハート誤判定防止！）

  // 🌟 対応ジェスチャーテンプレート（マルチ筆記対応）
  const TEMPLATES = [
    { name: '♡ ハート', type: 'heart', points: generateHeartPoints() },
    { name: '★ 星', type: 'star', points: generateStarPoints() },
    { name: '◯ 円', type: 'circle', points: generateCirclePoints() },
    { name: '△ 三角', type: 'triangle', points: generatePolygonPoints(3) },
    { name: '□ 四角', type: 'square', points: generatePolygonPoints(4) },
    { name: '⚡ 稲妻', type: 'lightning', points: generateLightningPoints() },
    { name: '❌ バツ', type: 'cross', points: generateCrossPoints() },
    { name: '✅ チェック', type: 'check', points: generateCheckPoints() },
    { name: '↑ 上矢印', type: 'arrow_up', points: generateArrowPoints('up') },
    { name: '↓ 下矢印', type: 'arrow_down', points: generateArrowPoints('down') }
  ];

  // 1. 複数ストローク（複数筆）を1つの連続した点列に自動統合
  function combineStrokes(strokes) {
    const points = [];
    strokes.forEach(stroke => {
      stroke.forEach(pt => {
        points.push({ x: pt.x, y: pt.y });
      });
    });
    return points;
  }

  // 2. 点群のリサンプリング（全64点に均等化）
  function resample(points, n) {
    if (points.length === 0) return [];
    const I = pathLength(points) / (n - 1);
    if (I === 0) return points;

    let D = 0;
    const newPoints = [{ x: points[0].x, y: points[0].y }];

    for (let i = 1; i < points.length; i++) {
      const d = distance(points[i - 1], points[i]);
      if (D + d >= I) {
        const qx = points[i - 1].x + ((I - D) / d) * (points[i].x - points[i - 1].x);
        const qy = points[i - 1].y + ((I - D) / d) * (points[i].y - points[i - 1].y);
        const q = { x: qx, y: qy };
        newPoints.push(q);
        points.splice(i, 0, q);
        D = 0;
      } else {
        D += d;
      }
    }
    while (newPoints.length < n) {
      newPoints.push({ x: points[points.length - 1].x, y: points[points.length - 1].y });
    }
    return newPoints;
  }

  // 3. 重心を原点(0,0)に移動
  function centroid(points) {
    let x = 0, y = 0;
    points.forEach(p => { x += p.x; y += p.y; });
    return { x: x / points.length, y: y / points.length };
  }

  function translateToOrigin(points) {
    const c = centroid(points);
    return points.map(p => ({ x: p.x - c.x, y: p.y - c.y }));
  }

  // 4. バウンディングボックス正方形スケーリング
  function scaleToSquare(points, size) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    return points.map(p => ({
      x: (p.x * size) / width,
      y: (p.y * size) / height
    }));
  }

  // 5. 点群間の距離計測（パス類似度計算）
  function pathDistance(pts1, pts2) {
    let d = 0;
    for (let i = 0; i < pts1.length; i++) {
      d += distance(pts1[i], pts2[i]);
    }
    return d / pts1.length;
  }

  function distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function pathLength(points) {
    let d = 0;
    for (let i = 1; i < points.length; i++) {
      d += distance(points[i - 1], points[i]);
    }
    return d;
  }

  // --- 📐 テンプレート生成用関数群 ---
  function generateHeartPoints() {
    const pts = [];
    for (let i = 0; i < NUM_POINTS; i++) {
      const t = (i / NUM_POINTS) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
      pts.push({ x, y });
    }
    return pts;
  }

  function generateStarPoints() {
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const aOuter = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      pts.push({ x: Math.cos(aOuter) * 100, y: Math.sin(aOuter) * 100 });
    }
    return resample(pts, NUM_POINTS);
  }

  function generateCirclePoints() {
    const pts = [];
    for (let i = 0; i < NUM_POINTS; i++) {
      const a = (i / NUM_POINTS) * Math.PI * 2;
      pts.push({ x: Math.cos(a) * 100, y: Math.sin(a) * 100 });
    }
    return pts;
  }

  function generatePolygonPoints(sides) {
    const pts = [];
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
      pts.push({ x: Math.cos(a) * 100, y: Math.sin(a) * 100 });
    }
    return resample(pts, NUM_POINTS);
  }

  function generateLightningPoints() {
    const raw = [
      {x: 20, y: -100}, {x: -30, y: -10}, {x: 10, y: 0},
      {x: -20, y: 100}, {x: 30, y: 10}, {x: -10, y: 0}
    ];
    return resample(raw, NUM_POINTS);
  }

  function generateCrossPoints() {
    const raw = [{x: -80, y: -80}, {x: 80, y: 80}, {x: 80, y: -80}, {x: -80, y: 80}];
    return resample(raw, NUM_POINTS);
  }

  function generateCheckPoints() {
    const raw = [{x: -80, y: 0}, {x: -20, y: 60}, {x: 80, y: -80}];
    return resample(raw, NUM_POINTS);
  }

  function generateArrowPoints(dir) {
    let raw = [];
    if (dir === 'up') raw = [{x: -50, y: 50}, {x: 0, y: -80}, {x: 50, y: 50}, {x: 0, y: -80}, {x: 0, y: 100}];
    else raw = [{x: -50, y: -50}, {x: 0, y: 80}, {x: 50, y: -50}, {x: 0, y: 80}, {x: 0, y: -100}];
    return resample(raw, NUM_POINTS);
  }

  // --- 🎯 メイン判定メソッド ---
  function recognize(strokes) {
    if (!strokes || strokes.length === 0) return null;

    let points = combineStrokes(strokes);
    if (points.length < 8) return null;

    points = resample(points, NUM_POINTS);
    points = scaleToSquare(points, SQUARE_SIZE);
    points = translateToOrigin(points);

    let bestMatch = null;
    let bestDistance = Infinity;

    TEMPLATES.forEach(tpl => {
      let tplPoints = resample(tpl.points, NUM_POINTS);
      tplPoints = scaleToSquare(tplPoints, SQUARE_SIZE);
      tplPoints = translateToOrigin(tplPoints);

      const d = pathDistance(points, tplPoints);
      if (d < bestDistance) {
        bestDistance = d;
        bestMatch = tpl;
      }
    });

    // スコア計算 (1 - distance / (正方形対角線))
    const maxDist = Math.sqrt(SQUARE_SIZE * SQUARE_SIZE + SQUARE_SIZE * SQUARE_SIZE);
    const score = Math.max(0, 1 - bestDistance / maxDist);

    console.log(`✨ Gesture Match: ${bestMatch ? bestMatch.name : 'None'} (Score: ${(score * 100).toFixed(1)}%)`);

    // 65%以上のスコアが出た場合のみ認定！
    if (score >= MIN_SCORE_THRESHOLD && bestMatch) {
      return bestMatch.name;
    }
    return null;
  }

  window.GestureRecognizer = { recognize };
})();
