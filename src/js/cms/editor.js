/*! Reitansai CMS editor */
(function () {
  var C = window.ASOBI_CMS, S = window.ASOBI_SESSION, API = window.ASOBI_API;
  var San = window.ASOBI_SANITIZE, Render = window.ASOBI_RENDER;
  var $ = function (id) { return document.getElementById(id); };
  var state = { user: null, type: null, id: null, path: null, data: { attachments: [] }, saving: false };

  function qs(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }
  function setStatus(t, isErr) {
    var el = $('save-status');
    if (!el) return;
    el.textContent = t || '';
    el.className = 'status-line' + (isErr ? ' err' : '');
  }
  function showErr(t) {
    var el = $('form-error');
    if (!el) return;
    if (!t) { el.classList.add('hidden'); el.textContent = ''; return; }
    el.classList.remove('hidden'); el.textContent = t;
  }

  function ensureAttachList() {
    if (!state.data) state.data = {};
    if (!state.data.attachments) state.data.attachments = [];
    return state.data.attachments;
  }
  function renderAttachList() {
    document.querySelectorAll('.attach-list').forEach(function (ul) {
      ul.innerHTML = '';
      ensureAttachList().forEach(function (a, idx) {
        var li = document.createElement('li');
        li.innerHTML = '<span class="mono">' + (a.name || a.path) + '</span> ' +
          '<select data-i="' + idx + '"><option value="link">リンク</option><option value="inline">インライン</option></select> ' +
          '<button type="button" class="btn ghost sm" data-del="' + idx + '">削除</button>';
        li.querySelector('select').value = a.mode || 'link';
        li.querySelector('select').onchange = function (e) { ensureAttachList()[idx].mode = e.target.value; };
        li.querySelector('[data-del]').onclick = function () { ensureAttachList().splice(idx, 1); renderAttachList(); };
        ul.appendChild(li);
      });
    });
  }
  function openLibraryPicker() {
    var modal = $('attach-lib-modal'), list = $('attach-lib-list');
    if (!modal || !list) return;
    modal.classList.remove('hidden');
    list.textContent = '読み込み中…';
    (window.ASOBI_ATTACH && window.ASOBI_ATTACH.listUserFiles ? window.ASOBI_ATTACH.listUserFiles(state.user.id) : Promise.resolve([])).then(function (files) {
      if (!files.length) { list.innerHTML = '<p class="muted">ライブラリは空です</p>'; return; }
      list.innerHTML = '';
      files.forEach(function (f) {
        var row = document.createElement('div');
        row.className = 'lib-row';
        row.innerHTML = '<span>' + f.name + '</span><button type="button" class="btn ghost sm">追加</button>';
        row.querySelector('button').onclick = function () {
          var mode = (document.querySelector('.attach-mode') || {}).value || 'link';
          ensureAttachList().push({ id: f.id || f.path, name: f.name, path: f.path, ext: f.ext, mode: mode, size: f.size || 0 });
          renderAttachList();
        };
        list.appendChild(row);
      });
    }).catch(function (e) { list.textContent = e.message || String(e); });
  }
  function wireAttachUI() {
    document.querySelectorAll('.attach-file-input').forEach(function (input) {
      if (input._wired) return;
      input._wired = true;
      input.addEventListener('change', function () {
        if (!input.files || !input.files.length) return;
        var box = input.closest('.attach-box');
        var mode = (box && box.querySelector('.attach-mode') || {}).value || 'link';
        var st = box && box.querySelector('.attach-pending');
        if (st) { st.classList.remove('hidden'); st.textContent = 'アップロード中…'; }
        var folder = 'users/' + state.user.id;
        (window.ASOBI_ATTACH && window.ASOBI_ATTACH.uploadFiles
          ? window.ASOBI_ATTACH.uploadFiles(folder, input.files, mode)
          : Promise.reject(new Error('attachments モジュール未読込'))).then(function (rows) {
          rows.forEach(function (r) { ensureAttachList().push(r); });
          renderAttachList();
          if (st) st.textContent = rows.length + ' 件追加';
          input.value = '';
        }).catch(function (e) { if (st) st.textContent = e.message || String(e); });
      });
    });
    document.querySelectorAll('.attach-from-lib').forEach(function (btn) {
      if (btn._wired) return;
      btn._wired = true;
      btn.onclick = openLibraryPicker;
    });
    if ($('attach-lib-close')) $('attach-lib-close').onclick = function () {
      $('attach-lib-modal').classList.add('hidden');
    };
  }

  function addRoleRow(value) {
    var host = $('t-roles');
    if (!host) return;
    var row = document.createElement('div');
    row.className = 'dyn-row';
    row.innerHTML = '<input type="text" class="t-role-input" placeholder="役職">' +
      '<button type="button" class="btn ghost sm t-role-del">×</button>';
    if (value) row.querySelector('input').value = value;
    row.querySelector('.t-role-del').onclick = function () { row.remove(); };
    host.appendChild(row);
  }
  function collectRoles() {
    var out = [];
    document.querySelectorAll('#t-roles .t-role-input').forEach(function (inp) {
      var v = inp.value.trim(); if (v) out.push(v);
    });
    return out;
  }

  function applySeminarForm(j) {
    state.data = j;
    if (!state.data.attachments) state.data.attachments = [];
    var lab = (C.groupByKey(state.id) || {}).label || state.id;
    $('ed-title').textContent = lab + 'ゼミ';
    $('ed-path').textContent = state.path;
    if ($('s-goal')) $('s-goal').value = j.goal || '';
    if ($('s-desc')) $('s-desc').innerHTML = j.descriptionHtml || '';
    $('form-seminar').classList.remove('hidden');
    $('form-teacher').classList.add('hidden');
    renderAttachList();
    if (window.ASOBI_RT && window.ASOBI_RT.mountAll) window.ASOBI_RT.bindRtToolbars();
  }
  function applyTeacherForm(j) {
    state.data = j;
    if (!state.data.attachments) state.data.attachments = [];
    $('ed-title').textContent = '瀧村先生';
    $('ed-path').textContent = state.path;
    if ($('t-roles')) $('t-roles').innerHTML = '';
    (j.roles || []).forEach(function (r) { addRoleRow(r); });
    if (!(j.roles || []).length) addRoleRow('');
    if ($('t-message')) $('t-message').innerHTML = j.messageHtml || '';
    $('form-teacher').classList.remove('hidden');
    $('form-seminar').classList.add('hidden');
    renderAttachList();
    if (window.ASOBI_RT && window.ASOBI_RT.mountAll) window.ASOBI_RT.bindRtToolbars();
  }

  function collectSeminar() {
    return {
      schemaVersion: 1, type: 'seminar', seminarKey: state.id,
      label: (C.groupByKey(state.id) || {}).label || state.id,
      goal: ($('s-goal') && $('s-goal').value.trim()) || '',
      descriptionHtml: San.html(($('s-desc') && $('s-desc').innerHTML) || ''),
      attachments: ensureAttachList().slice(),
      htmlPath: state.path,
      updatedAt: new Date().toISOString(),
      updatedBy: state.user.id
    };
  }
  function collectTeacher() {
    return {
      schemaVersion: 1, type: 'teacher', teacherId: 'takimura',
      roles: collectRoles(),
      messageHtml: San.html(($('t-message') && $('t-message').innerHTML) || ''),
      attachments: ensureAttachList().slice(),
      htmlPath: 'pages/takimura_t.html',
      updatedAt: new Date().toISOString(),
      updatedBy: state.user.id
    };
  }

  function bootstrapSeminar(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var goalEl = doc.querySelector('[data-cms-slot="goal"]');
    var descEl = doc.querySelector('[data-cms-slot="description"]');
    return {
      schemaVersion: 1, type: 'seminar', seminarKey: state.id,
      label: (C.groupByKey(state.id) || {}).label || state.id,
      goal: goalEl ? goalEl.textContent.trim() : '',
      descriptionHtml: descEl ? descEl.innerHTML : '',
      attachments: [], htmlPath: state.path,
      updatedAt: new Date().toISOString(), updatedBy: state.user.id
    };
  }
  function bootstrapTeacher(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var roles = [];
    doc.querySelectorAll('[data-cms-slot="roles"] li').forEach(function (li) {
      var t = li.textContent.trim(); if (t && t !== '—') roles.push(t);
    });
    var msg = doc.querySelector('[data-cms-slot="message"]');
    return {
      schemaVersion: 1, type: 'teacher', teacherId: 'takimura',
      roles: roles, messageHtml: msg ? msg.innerHTML : '',
      attachments: [], htmlPath: state.path,
      updatedAt: new Date().toISOString(), updatedBy: state.user.id
    };
  }

  function loadSeminar(id) {
    state.path = 'pages/seminars/' + id + '.html';
    var jsonPath = 'src/cms/pages/seminar/' + id + '.json';
    return API.loadJson(jsonPath).then(function (j) {
      applySeminarForm(j); setStatus('ゼミページを読み込みました');
    }).catch(function () {
      return API.loadText(state.path).then(function (html) {
        applySeminarForm(bootstrapSeminar(html));
        setStatus('公開HTMLから初期化（初回保存でJSON作成）');
      });
    });
  }
  function loadTeacher() {
    state.path = 'pages/takimura_t.html';
    state.id = 'takimura';
    var jsonPath = 'src/cms/pages/teacher/takimura.json';
    return API.loadJson(jsonPath).then(function (j) {
      applyTeacherForm(j); setStatus('先生ページを読み込みました');
    }).catch(function () {
      return API.loadText(state.path).then(function (html) {
        applyTeacherForm(bootstrapTeacher(html));
        setStatus('公開HTMLから初期化（初回保存でJSON作成）');
      });
    });
  }

  function onSave() {
    if (state.saving) return;
    var cm = ($('commit-msg') && $('commit-msg').value.trim()) || '';
    if (!cm) { setStatus('コミットメッセージを入力してください', true); return; }
    if (!S.canEditPath(state.user, state.path) && !(state.user.isAdmin || state.user.fullAccess)) {
      setStatus('権限がありません', true); return;
    }
    state.saving = true;
    if ($('btn-save')) $('btn-save').disabled = true;
    showErr('');
    var payload = state.type === 'teacher' ? collectTeacher() : collectSeminar();
    state.data = payload;
    var jsonPath = state.type === 'teacher'
      ? 'src/cms/pages/teacher/takimura.json'
      : 'src/cms/pages/seminar/' + state.id + '.json';
    setStatus('JSON を保存中…');
    API.saveText(jsonPath, JSON.stringify(payload, null, 2) + '\n', cm, true)
      .then(function () {
        setStatus('公開HTMLを生成・保存中…');
        return API.loadText(state.path).then(function (baseHtml) {
          var html = state.type === 'teacher'
            ? Render.teacher(baseHtml, payload)
            : Render.seminar(baseHtml, payload);
          return API.saveText(state.path, html, cm, true);
        });
      })
      .then(function () { setStatus('保存しました。 ' + C.SITE + state.path); })
      .catch(function (e) {
        var msg = e && e.message ? e.message : String(e);
        setStatus('保存失敗: ' + msg, true); showErr(msg);
      })
      .then(function () {
        state.saving = false;
        if ($('btn-save')) $('btn-save').disabled = false;
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    state.user = S.require(true);
    if (!state.user) return;
    if ($('user-pill')) $('user-pill').textContent = state.user.name || state.user.id;
    if ($('btn-logout')) $('btn-logout').onclick = function () { S.clear(); location.href = C.PAGES.login; };
    if ($('btn-back')) $('btn-back').onclick = function () { location.href = C.PAGES.select; };
    if ($('btn-save')) $('btn-save').onclick = onSave;
    if ($('t-role-add')) $('t-role-add').onclick = function () { addRoleRow(''); };
    wireAttachUI();

    state.type = qs('type');
    state.id = qs('id');
    if (!state.type || !state.id || (state.type !== 'seminar' && state.type !== 'teacher')) {
      showErr('不正なURLです。select から開き直してください。');
      setStatus('パラメータ不足', true);
      return;
    }
    var loader = state.type === 'teacher' ? loadTeacher() : loadSeminar(state.id);
    loader.catch(function (e) {
      showErr(e.message || String(e));
      setStatus('読込失敗', true);
    });
  });
})();
