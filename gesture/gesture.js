/**
 * 🌀 gesture.js - ストローク解析 & パターン判定エンジン
 */
(function () {
  function flattenPoints(strokes) {
    const pts = [];
    strokes.forEach(s => pts.push(...s));
    return pts;
  }

  function getBoundingBox(pts) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }

  function recognize(strokes) {
    if (!strokes || strokes.length === 0) return null;
    const pts = flattenPoints(strokes);
    if (pts.length < 5) return null;

    const bbox = getBoundingBox(pts);
    const strokeCount = strokes.length;
    const startPt = pts[0];
    const endPt = pts[pts.length - 1];
    const startEndDist = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y);
    const isClosed = startEndDist < Math.max(bbox.w, bbox.h) * 0.35;

    // 1. CLEAR ('C') 判定
    if (strokeCount === 1) {
      const mid = pts[Math.floor(pts.length / 2)];
      if (startPt.x > mid.x && endPt.x > mid.x && bbox.w > 30) {
        return 'CLEAR';
      }
    }

    // 2. HEART ('♡') 判定
    if (isClosed && bbox.h > bbox.w * 0.7) {
      const topPts = pts.filter(p => p.y < bbox.minY + bbox.h * 0.3);
      if (topPts.length > 4) return 'HEART';
    }

    // 3. TRIANGLE ('△') 判定
    if (isClosed && strokeCount <= 3) {
      const topPt = pts.reduce((min, p) => p.y < min.y ? p : min, pts[0]);
      if (topPt.y < bbox.minY + bbox.h * 0.25) return 'TRIANGLE';
    }

    // 4. STAR ('★') 判定
    if (strokeCount >= 3 || pts.length > 35) {
      const crossCount = countSelfIntersections(pts);
      if (crossCount >= 2) return 'STAR';
    }

    // 5. 'M' (クイックメモ) 判定
    if (strokeCount <= 2 && bbox.w > 35 && bbox.h > 35) {
      const startLeft = startPt.x < bbox.minX + bbox.w * 0.35;
      const endRight = endPt.x > bbox.maxX - bbox.w * 0.35;
      if (startLeft && endRight) return 'M';
    }

    // 6. 'QUESTION' ('?') 判定
    if (strokeCount >= 2) {
      const lastStroke = strokes[strokes.length - 1];
      const lastBbox = getBoundingBox(lastStroke);
      if (lastBbox.w < 25 && lastBbox.h < 25) return 'QUESTION';
    }

    // 7. 'SHARE' ('S') 判定
    if (strokeCount === 1) {
      const yMoves = countDirectionChangesY(pts);
      if (yMoves >= 2) return 'SHARE';
    }

    // フォールバック
    return strokeCount === 1 ? 'CLEAR' : 'TRIANGLE';
  }

  function countSelfIntersections(pts) {
    let count = 0;
    const step = 4;
    for (let i = 0; i < pts.length - step; i += step) {
      for (let j = i + step * 2; j < pts.length - step; j += step) {
        if (intersects(pts[i], pts[i + step], pts[j], pts[j + step])) count++;
      }
    }
    return count;
  }

  function intersects(p1, p2, p3, p4) {
    const ccw = (a, b, c) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
    return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
  }

  function countDirectionChangesY(pts) {
    let changes = 0, dir = 0;
    for (let i = 1; i < pts.length; i++) {
      const dy = pts[i].y - pts[i - 1].y;
      if (Math.abs(dy) < 3) continue;
      const newDir = dy > 0 ? 1 : -1;
      if (dir !== 0 && newDir !== dir) changes++;
      dir = newDir;
    }
    return changes;
  }

  window.GestureRecognizer = { recognize };
})();
