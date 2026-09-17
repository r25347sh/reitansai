/*! Reitansai CMS render */
(function (g) {
  var San = g.ASOBI_SANITIZE;
  function setSlot(doc, name, htmlOrText, asText) {
    var els = doc.querySelectorAll('[data-cms-slot="' + name + '"]');
    els.forEach(function (el) {
      if (asText) el.textContent = htmlOrText == null ? '' : String(htmlOrText);
      else el.innerHTML = htmlOrText || '';
    });
  }
  function serialize(doc) {
    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML + '\n';
  }
  function ensureAttachmentsHost(doc) {
    var host = doc.querySelector('[data-cms-slot="attachments"]');
    if (host) return host;
    var sec = doc.createElement('section');
    sec.className = 'cms-block cms-attachments';
    sec.innerHTML = '<h2 data-lock="true">添付ファイル</h2><div data-cms-slot="attachments"></div>';
    var main = doc.querySelector('main') || doc.body;
    main.appendChild(sec);
    return sec.querySelector('[data-cms-slot="attachments"]');
  }
  function fillAttachments(doc, data, depth) {
    var host = ensureAttachmentsHost(doc);
    if (!host) return;
    host.innerHTML = (g.ASOBI_ATTACH && g.ASOBI_ATTACH.publicRender)
      ? (g.ASOBI_ATTACH.publicRender(data.attachments, depth) || '')
      : '';
  }
  function renderSeminarHtml(baseHtml, data) {
    var doc = new DOMParser().parseFromString(baseHtml, 'text/html');
    setSlot(doc, 'goal', data.goal || '', true);
    setSlot(doc, 'description', San ? San.html(data.descriptionHtml) : (data.descriptionHtml || ''));
    fillAttachments(doc, data, 2);
    return serialize(doc);
  }
  function renderRolesList(roles) {
    var list = roles || [];
    if (!list.length) return '<li>—</li>';
    return list.map(function (r) {
      return '<li>' + (San ? San.text(r) : String(r)) + '</li>';
    }).join('');
  }
  function renderTeacherHtml(baseHtml, data) {
    var doc = new DOMParser().parseFromString(baseHtml, 'text/html');
    var rolesHost = doc.querySelector('[data-cms-slot="roles"]');
    if (rolesHost) {
      if (rolesHost.tagName === 'UL' || rolesHost.tagName === 'OL') {
        rolesHost.innerHTML = renderRolesList(data.roles);
      } else {
        rolesHost.innerHTML = '<ul class="role-list">' + renderRolesList(data.roles) + '</ul>';
      }
    }
    setSlot(doc, 'message', San ? San.html(data.messageHtml) : (data.messageHtml || ''));
    fillAttachments(doc, data, 1);
    return serialize(doc);
  }
  g.ASOBI_RENDER = {
    seminar: renderSeminarHtml,
    teacher: renderTeacherHtml,
    group: renderSeminarHtml,
    member: renderSeminarHtml
  };
})(typeof window !== 'undefined' ? window : this);
