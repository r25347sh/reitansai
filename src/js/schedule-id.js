/**
 * Stable schedule IDs for every presentation row.
 * Format: sch_<seminarSlug>_<no>_<start>_<hash8>
 */
(function (global) {
  'use strict';

  function slug(s) {
    return String(s || '')
      .replace(/\s+/g, '')
      .replace(/[^\w\u3040-\u30ff\u3400-\u9fff\-]/g, '')
      .slice(0, 24) || 'x';
  }

  function simpleHash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, '0').slice(0, 8);
  }

  function makeScheduleId(r) {
    if (r && r.id) return r.id;
    var no = r && (r.no != null ? String(r.no) : '');
    var base =
      (r && r.s ? r.s : '') +
      '|' +
      no +
      '|' +
      (r && r.t ? r.t : '') +
      '|' +
      (r && r.title ? r.title : '') +
      '|' +
      (r && r.sp ? r.sp : '');
    var h = simpleHash(base);
    var start = String((r && r.t) || '0000').replace(/:/g, '');
    return 'sch_' + slug(r && r.s) + '_' + (no || '0') + '_' + start + '_' + h;
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

  function rangesOverlap(aStart, aEnd, bStart, bEnd) {
    if (aStart < 0 || bStart < 0) return false;
    var ae = aEnd >= 0 ? aEnd : aStart + 1;
    var be = bEnd >= 0 ? bEnd : bStart + 1;
    return aStart < be && bStart < ae;
  }

  global.ReitansaiScheduleId = {
    makeScheduleId: makeScheduleId,
    attachIds: attachIds,
    rangesOverlap: rangesOverlap,
    slug: slug
  };
})(typeof window !== 'undefined' ? window : this);
