/*! Reitansai CMS select */
(function () {
  var C = window.ASOBI_CMS, S = window.ASOBI_SESSION, API = window.ASOBI_API;
  var $ = function (id) { return document.getElementById(id); };
  var user = null;

  function switchTab(tab) {
    document.querySelectorAll('.seg').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
    document.querySelectorAll('.panel').forEach(function (p) {
      p.classList.toggle('hidden', p.id !== 'panel-' + tab);
    });
  }

  function labelForPath(path) {
    var g = C.groupByPath(path);
    if (g) return { kind: 'seminar', title: g.label + 'ゼミ', id: g.key, type: 'seminar' };
    if (/takimura_t\.html$/i.test(path)) {
      return { kind: 'teacher', title: '瀧村先生', id: 'takimura', type: 'teacher' };
    }
    return { kind: 'other', title: path.split('/').pop(), id: path, type: 'other' };
  }

  function openEditor(item) {
    if (item.type === 'other') {
      alert('このページはフォーム編集の対象外です: ' + item.title);
      return;
    }
    location.href = C.PAGES.editor + '?type=' + encodeURIComponent(item.type) + '&id=' + encodeURIComponent(item.id);
  }

  function renderPages(perms) {
    var grid = $('page-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var items = [], seen = {};
    (perms || []).forEach(function (path) {
      if (seen[path]) return;
      seen[path] = true;
      var meta = labelForPath(path);
      meta.path = path;
      items.push(meta);
    });
    if (user && (user.isAdmin || user.fullAccess)) {
      (C.SEMINARS || []).forEach(function (g) {
        if (!seen[g.htmlPath]) {
          seen[g.htmlPath] = true;
          items.push({ kind: 'seminar', title: g.label + 'ゼミ', id: g.key, type: 'seminar', path: g.htmlPath });
        }
      });
      if (!seen['pages/takimura_t.html']) {
        items.push({ kind: 'teacher', title: '瀧村先生', id: 'takimura', type: 'teacher', path: 'pages/takimura_t.html' });
      }
    }
    items = items.filter(function (it) { return it.type !== 'other'; });
    if ($('pages-status')) {
      $('pages-status').textContent = items.length ? (items.length + ' 件の編集可能ページ') : '編集可能なページがありません';
    }
    items.forEach(function (it, idx) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'page-card type-' + it.type;
      card.innerHTML = '<span class="badge">' + (it.type === 'teacher' ? '先生' : 'ゼミ') + '</span>' +
        '<span class="title"></span><span class="path mono"></span>';
      card.querySelector('.title').textContent = it.title;
      card.querySelector('.path').textContent = it.path;
      card.onclick = function () { openEditor(it); };
      grid.appendChild(card);
    });
  }

  function loadFiles() {
    var box = $('files-list');
    if (!box || !user) return;
    box.textContent = '読み込み中…';
    var path = 'users/' + user.id;
    if ($('files-path')) $('files-path').textContent = path + '/';
    API.listDir(path).then(function (items) {
      box.innerHTML = '';
      var uploadRow = document.createElement('div');
      uploadRow.className = 'files-upload-row';
      uploadRow.innerHTML = '<label class="btn ghost sm">端末から追加<input type="file" id="files-upload" multiple hidden></label><span id="files-upload-status" class="muted tiny"></span>';
      box.appendChild(uploadRow);
      var input = uploadRow.querySelector('#files-upload');
      var st = uploadRow.querySelector('#files-upload-status');
      if (input) {
        input.onchange = function () {
          if (!input.files || !input.files.length) return;
          st.textContent = 'アップロード中…';
          window.ASOBI_ATTACH.uploadUserFiles(user.id, input.files, 'link').then(function () {
            st.textContent = '完了'; loadFiles();
          }).catch(function (e) { st.textContent = e.message || String(e); });
        };
      }
      var files = (items || []).filter(function (it) { return it.type === 'file' && it.name && it.name[0] !== '.'; });
      if (!files.length) {
        box.appendChild(Object.assign(document.createElement('p'), { className: 'muted', textContent: 'まだファイルがありません。' }));
        return;
      }
      var grid = document.createElement('div');
      grid.className = 'file-cards';
      files.forEach(function (it) {
        var item = { name: it.name, path: it.path, ext: (it.name.split('.').pop() || '').toLowerCase(), size: it.size };
        var card = document.createElement('div');
        card.className = 'file-card';
        card.innerHTML = '<div class="file-card-head"><a href="' + it.path + '" target="_blank" rel="noopener">📄 ' + it.name + '</a>' +
          '<button type="button" class="btn ghost sm">プレビュー</button></div><div class="file-card-preview hidden"></div>';
        var body = card.querySelector('.file-card-preview');
        var btn = card.querySelector('button');
        btn.onclick = function () {
          if (!body.classList.contains('hidden')) { body.classList.add('hidden'); body.innerHTML=''; btn.textContent='プレビュー'; return; }
          body.classList.remove('hidden'); btn.textContent = '閉じる';
          body.innerHTML = window.ASOBI_ATTACH.previewHtml(item, 0);
        };
        grid.appendChild(card);
      });
      box.appendChild(grid);
    }).catch(function (e) { box.textContent = '一覧を取得できません: ' + (e.message || e); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    user = S.require(true);
    if (!user) return;
    if ($('user-pill')) $('user-pill').textContent = (user.name || user.id) + (user.semi_name ? ' · ' + user.semi_name : '');
    if ($('btn-logout')) $('btn-logout').onclick = function () { S.clear(); location.href = C.PAGES.login; };
    document.querySelectorAll('.seg').forEach(function (b) {
      b.onclick = function () {
        var tab = b.getAttribute('data-tab');
        switchTab(tab);
        if (tab === 'files') loadFiles();
      };
    });
    if ($('btn-refresh-pages')) $('btn-refresh-pages').onclick = function () { renderPages(user.permissions || []); };
    if ($('btn-refresh-files')) $('btn-refresh-files').onclick = loadFiles;
    renderPages(user.permissions || []);
  });
})();
