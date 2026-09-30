/**
 * Stable numeric schedule IDs for every presentation row.
 * Pure digits (16 chars), deterministic from content — not regenerated on reload.
 * Format example: "3847291056184732"
 */
(function (global) {
  'use strict';

  function fnv1a(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /**
   * @param {object} r - { s, title, sp, t, e, form, v, vn, no? }
   * @returns {string} 16-digit numeric id
   */
  function makeScheduleId(r) {
    if (r && r.id != null && String(r.id).length > 0) {
      var existing = String(r.id).replace(/\D/g, '');
      if (existing.length >= 8) return existing.slice(0, 16);
      if (/^\d+$/.test(String(r.id))) return String(r.id);
    }
    var no = r && (r.no != null ? String(r.no) : '');
    var base =
      (r && r.s ? r.s : '') +
      '|' +
      no +
      '|' +
      (r && r.t ? r.t : '') +
      '|' +
      (r && r.e ? r.e : '') +
      '|' +
      (r && r.title ? r.title : '') +
      '|' +
      (r && r.sp ? r.sp : '') +
      '|' +
      (r && r.v ? r.v : '');
    var h1 = fnv1a(base);
    var h2 = fnv1a(base + '#rt2');
    var h3 = fnv1a(base + '#rt3');
    /* 16 digits, avoid leading zero */
    var a = String(100000000 + (h1 % 900000000));
    var b = String(10000000 + (h2 % 90000000));
    var c = String(h3 % 100);
    var id = (a + b + c).slice(0, 16);
    while (id.length < 16) id += '0';
    return id;
  }

  function attachIds(rows) {
    return (rows || []).map(function (r) {
      var copy = {};
      for (var k in r) {
        if (Object.prototype.hasOwnProperty.call(r, k)) copy[k] = r[k];
      }
      copy.id = makeScheduleId(r);
      return copy;
    });
  }

  /** minutes overlap: [aStart,aEnd) vs [bStart,bEnd) */
  function rangesOverlap(aStart, aEnd, bStart, bEnd) {
    if (aStart < 0 || bStart < 0) return false;
    var ae = aEnd >= 0 ? aEnd : aStart + 1;
    var be = bEnd >= 0 ? bEnd : bStart + 1;
    return aStart < be && bStart < ae;
  }

  global.ReitansaiScheduleId = {
    makeScheduleId: makeScheduleId,
    attachIds: attachIds,
    rangesOverlap: rangesOverlap
  };
})(typeof window !== 'undefined' ? window : this);
