/*! CMS sanitize */
(function (g) {
  var ALLOWED_TAGS = {
    P:1, BR:1, B:1, STRONG:1, I:1, EM:1, U:1, S:1, STRIKE:1, SPAN:1, DIV:1,
    UL:1, OL:1, LI:1, A:1, H1:1, H2:1, H3:1, H4:1, BLOCKQUOTE:1, SUB:1, SUP:1
  };
  var ALLOWED_ATTR = { HREF:1, TARGET:1, REL:1, STYLE:1, CLASS:1 };
  function text(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function cleanStyle(style) {
    if (!style) return '';
    var out = [];
    String(style).split(';').forEach(function (part) {
      var kv = part.split(':');
      if (kv.length < 2) return;
      var k = kv[0].trim().toLowerCase();
      var v = kv.slice(1).join(':').trim();
      if (!k || !v) return;
      if (k === 'color' || k === 'background-color' || k === 'font-size' || k === 'font-weight' || k === 'font-style' || k === 'text-decoration') {
        if (/expression|javascript|url\s*\(/i.test(v)) return;
        out.push(k + ':' + v);
      }
    });
    return out.join(';');
  }
  function walk(node, out) {
    if (!node) return;
    if (node.nodeType === 3) { out.push(text(node.nodeValue)); return; }
    if (node.nodeType !== 1) return;
    var tag = node.tagName;
    if (!ALLOWED_TAGS[tag]) {
      var kids = node.childNodes;
      for (var i = 0; i < kids.length; i++) walk(kids[i], out);
      return;
    }
    out.push('<' + tag.toLowerCase());
    if (node.attributes) {
      for (var a = 0; a < node.attributes.length; a++) {
        var at = node.attributes[a];
        var an = at.name.toUpperCase();
        if (!ALLOWED_ATTR[an]) continue;
        var av = at.value || '';
        if (an === 'HREF' && /^\s*javascript:/i.test(av)) continue;
        if (an === 'STYLE') av = cleanStyle(av);
        if (an === 'TARGET') av = '_blank';
        if (an === 'REL') av = 'noopener noreferrer';
        out.push(' ' + at.name.toLowerCase() + '="' + text(av) + '"');
      }
    }
    out.push('>');
    var ch = node.childNodes;
    for (var j = 0; j < ch.length; j++) walk(ch[j], out);
    if (tag !== 'BR') out.push('</' + tag.toLowerCase() + '>');
  }
  function html(raw) {
    if (!raw) return '';
    var doc = new DOMParser().parseFromString('<div id="r">' + raw + '</div>', 'text/html');
    var root = doc.getElementById('r');
    var out = [];
    if (root) {
      var kids = root.childNodes;
      for (var i = 0; i < kids.length; i++) walk(kids[i], out);
    }
    return out.join('');
  }
  g.ASOBI_SANITIZE = { html: html, text: text };
})(typeof window !== 'undefined' ? window : this);
