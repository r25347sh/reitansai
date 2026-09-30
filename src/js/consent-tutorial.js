(function () {
  'use strict';
  var U = window.ReitansaiUser;
  if (!U) { console.warn('[onboarding] ReitansaiUser missing'); return; }

  var STEPS = [
    { icon: '🏠', title: 'ようこそ・麗探祭サイトへ', body: '5年生の探究ゼミ成果発表の案内サイトです。' },
    { icon: '📅', title: 'スケジュールを探す', body: '絞り込み検索と「保存」で Myスケジュール に追加できます。' },
    { icon: '⭐', title: 'Myスケジュール', body: '保存した発表を時間順に確認できます。時間の重複時は確認が出ます。' },
    { icon: '🎨', title: 'テーマ', body: 'ヘッダー右からダーク / クラシック / グリーン（深緑） / システムを選べます。' }
  ];

  function track(n, p) {
    try { if (window.ReitansaiAnalytics) window.ReitansaiAnalytics.track(n, p || {}); } catch (e) {}
  }

  function css() {
    if (document.getElementById('rt-consent-tutorial-css')) return;
    var l = document.createElement('link');
    l.id = 'rt-consent-tutorial-css';
    l.rel = 'stylesheet';
    l.href = '/reitansai/src/css/consent-tutorial.css';
    document.head.appendChild(l);
  }

  function lock(on) { document.body.classList.toggle('rt-modal-open', !!on); }

  function root() {
    var r = document.createElement('div');
    r.className = 'rt-overlay-root';
    r.id = 'rt-onboarding-root';
    document.documentElement.appendChild(r);
    return r;
  }

  function open(r) { void r.offsetHeight; r.classList.add('is-open'); lock(true); }
  function close(r) {
    r.classList.remove('is-open'); lock(false);
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 280);
  }

  function showConsent() {
    return new Promise(function (resolve) {
      css();
      var r = root();
      var m = document.createElement('div');
      m.className = 'rt-modal';
      m.setAttribute('role', 'dialog');
      m.setAttribute('aria-modal', 'true');
      m.innerHTML =
        '<h2>当サイトへようこそ！ 🚀</h2>' +
        '<p>利用状況の統計のため、ランダムな識別ID・アクセス履歴・スケジュール登録を記録します。個人特定情報は取得しません。</p>' +
        '<div class="rt-modal-section">' +
        '<h3>📊 分析にご協力ください（任意）</h3>' +
        '<p>年齢・性別は<strong>任意</strong>です。未選択のまま進められます。</p>' +
        '<div class="rt-field"><label for="rt-age">年齢（任意）</label>' +
        '<select id="rt-age"><option value="">選択しない</option>' +
        '<option value="10s">10代</option><option value="20s">20代</option>' +
        '<option value="30s">30代</option><option value="40s">40代</option>' +
        '<option value="50s">50代以上</option></select></div>' +
        '<div class="rt-field"><label for="rt-gender">性別（任意）</label>' +
        '<select id="rt-gender"><option value="">選択しない</option>' +
        '<option value="male">男性</option><option value="female">女性</option>' +
        '<option value="other">その他</option><option value="na">回答しない</option></select></div>' +
        '</div>' +
        '<div class="rt-modal-actions">' +
        '<button type="button" class="rt-btn rt-btn-primary" id="rt-consent-ok">同意して進む</button></div>';
      r.appendChild(m);
      open(r);
      m.querySelector('#rt-consent-ok').onclick = function () {
        var age = (m.querySelector('#rt-age') || {}).value || '';
        var gender = (m.querySelector('#rt-gender') || {}).value || '';
        var id = U.ensureLocalId();
        var profile = { age: age || null, gender: gender || null, consentedAt: new Date().toISOString() };
        U.setProfile(profile);
        U.setConsented();
        if (window.ReitansaiSupabase) {
          window.ReitansaiSupabase.upsertVisitorProfile(id, profile).catch(function (e) {
            console.warn('[onboarding] upsert failed', e);
          });
        }
        track('consent_done', { age_band: profile.age, gender: profile.gender });
        close(r);
        resolve({ localId: id, profile: profile });
      };
    });
  }

  function showTutorial() {
    return new Promise(function (resolve) {
      if (U.hasTutorialDone()) { resolve(); return; }
      css();
      var r = root();
      var step = 0;
      function paint() {
        var s = STEPS[step];
        var last = step >= STEPS.length - 1;
        var dots = STEPS.map(function (_, i) {
          return '<span class="rt-tut-dot' + (i === step ? ' is-active' : '') + '"></span>';
        }).join('');
        r.innerHTML = '';
        var m = document.createElement('div');
        m.className = 'rt-modal';
        m.innerHTML =
          '<div class="rt-tut-dots">' + dots + '</div>' +
          '<div class="rt-tut-step-icon">' + s.icon + '</div>' +
          '<h2>' + s.title + '</h2><div class="rt-tut-step-body"><p>' + s.body + '</p></div>' +
          '<div class="rt-modal-actions">' +
          '<button type="button" class="rt-btn rt-btn-ghost" id="rt-tut-skip">スキップ</button>' +
          '<button type="button" class="rt-btn rt-btn-primary" id="rt-tut-next">' +
          (last ? 'はじめる' : '次へ') + '</button></div>';
        r.appendChild(m);
        m.querySelector('#rt-tut-skip').onclick = function () {
          U.setTutorialDone(); track('tutorial_skip', { step: step }); close(r); resolve();
        };
        m.querySelector('#rt-tut-next').onclick = function () {
          if (last) { U.setTutorialDone(); track('tutorial_complete', {}); close(r); resolve(); }
          else { step++; paint(); }
        };
      }
      open(r); paint();
    });
  }

  function boot() {
    try {
      if (U.isAdminMode && U.isAdminMode()) {
        U.ensureLocalId();
        track('admin_session', {});
        return;
      }
      if (U.hasConsented()) {
        U.ensureLocalId();
        if (!U.hasTutorialDone()) showTutorial();
        return;
      }
      showConsent().then(function () { return showTutorial(); });
    } catch (e) { console.error('[onboarding]', e); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.ReitansaiOnboarding = { showConsent: showConsent, showTutorial: showTutorial };
})();
