/**
 * 麗探祭 限定公開ゲート（少しおもしろ版）
 * username: gentei / password: hiroike2026
 *
 * - 「次回から自動でログインする」ON → localStorage 永続
 * - OFF → sessionStorage のみ
 */
(function () {
  'use strict';

  if (window.__REITANSAI_PR_BOOTED__) return;
  window.__REITANSAI_PR_BOOTED__ = true;

  const USER = 'gentei';
  const PASS = 'hiroike2026';

  const KEY_AUTH = 'reitansai-pr-auth';
  const KEY_REMEMBER = 'reitansai-pr-remember';
  const KEY_SESSION = 'reitansai-pr-session';

  const FAIL_LINES = [
    '……違う。探究の道はまだ遠い。',
    'アクセス拒否。麗澤の門はまだ開かない。',
    'パスワードが迷子になっているようです。',
    'それ、昨日の仮パスワードでは？',
    'ERROR: curiosity_level_insufficient',
    '門番「もう一度、よく考えてみて」',
    '認証失敗。でも失敗は探究の一部です。',
    'ヒントは出しません。それが祭りです。'
  ];

  const STATUS_LINES = [
    'スキャン中… 入場資格を確認しています',
    '麗探祭プロトコル待機中',
    '関係者のみ入場可',
    'Inquiry EXPO 2026 — restricted area'
  ];

  function isAuthenticated() {
    try {
      if (sessionStorage.getItem(KEY_SESSION) === '1') return true;
      if (localStorage.getItem(KEY_REMEMBER) === '1' && localStorage.getItem(KEY_AUTH) === '1') {
        return true;
      }
    } catch (e) { /* private mode */ }
    return false;
  }

  function markAuthenticated(remember) {
    try {
      sessionStorage.setItem(KEY_SESSION, '1');
      if (remember) {
        localStorage.setItem(KEY_AUTH, '1');
        localStorage.setItem(KEY_REMEMBER, '1');
      } else {
        localStorage.removeItem(KEY_AUTH);
        localStorage.removeItem(KEY_REMEMBER);
      }
    } catch (e) { /* ignore */ }
  }

  function unlock() {
    document.documentElement.classList.remove('reitansai-pr-locked');
    const overlay = document.querySelector('.reitansai-pr-overlay');
    if (overlay) {
      overlay.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      overlay.style.opacity = '0';
      overlay.style.transform = 'scale(1.03)';
      setTimeout(function () { overlay.remove(); }, 420);
    }
  }

  function lockBodyEarly() {
    document.documentElement.classList.add('reitansai-pr-locked');
  }

  function spawnParticles(host, count) {
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'reitansai-pr-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = 6 + Math.random() * 10 + 's';
      p.style.animationDelay = Math.random() * 6 + 's';
      p.style.width = 3 + Math.random() * 6 + 'px';
      p.style.height = p.style.width;
      if (Math.random() > 0.55) p.style.background = '#ff8c42';
      host.appendChild(p);
    }
  }

  function showGate() {
    lockBodyEarly();
    if (document.querySelector('.reitansai-pr-overlay')) return;

    var overlay = document.createElement('div');
    overlay.className = 'reitansai-pr-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '麗探祭 限定公開認証');

    overlay.innerHTML =
      '<div class="reitansai-pr-particles" aria-hidden="true"></div>' +
      '<div class="reitansai-pr-flash" aria-hidden="true"></div>' +
      '<div class="reitansai-pr-card">' +
      '  <div class="reitansai-pr-brand-wrap"><span class="reitansai-pr-badge">Restricted</span></div>' +
      '  <h1 class="reitansai-pr-title">麗探祭</h1>' +
      '  <p class="reitansai-pr-sub">この先は関係者エリアです。<br>ユーザー名とパスワードで入場してください。</p>' +
      '  <p class="reitansai-pr-status" id="reitansai-pr-status"></p>' +
      '  <form class="reitansai-pr-form" novalidate>' +
      '    <div class="reitansai-pr-field">' +
      '      <label for="reitansai-pr-user">ユーザー名</label>' +
      '      <input id="reitansai-pr-user" name="username" type="text" autocomplete="username" required />' +
      '    </div>' +
      '    <div class="reitansai-pr-field">' +
      '      <label for="reitansai-pr-pass">パスワード</label>' +
      '      <input id="reitansai-pr-pass" name="password" type="password" autocomplete="current-password" required />' +
      '    </div>' +
      '    <label class="reitansai-pr-remember">' +
      '      <input type="checkbox" id="reitansai-pr-remember" />' +
      '      <span>次回から自動でログインする</span>' +
      '    </label>' +
      '    <p class="reitansai-pr-error" id="reitansai-pr-error" aria-live="polite"></p>' +
      '    <button type="submit" class="reitansai-pr-submit">入場する</button>' +
      '  </form>' +
      '  <p class="reitansai-pr-foot">Reitaku Inquiry EXPO 2026<br><span class="reitansai-pr-hint">失敗しても、探究は続く。</span></p>' +
      '</div>';

    function mount() {
      if (!document.body) {
        document.addEventListener('DOMContentLoaded', mount, { once: true });
        return;
      }
      document.body.appendChild(overlay);

      var particles = overlay.querySelector('.reitansai-pr-particles');
      spawnParticles(particles, 18);

      var form = overlay.querySelector('.reitansai-pr-form');
      var userInput = overlay.querySelector('#reitansai-pr-user');
      var passInput = overlay.querySelector('#reitansai-pr-pass');
      var rememberInput = overlay.querySelector('#reitansai-pr-remember');
      var errorEl = overlay.querySelector('#reitansai-pr-error');
      var statusEl = overlay.querySelector('#reitansai-pr-status');
      var submitBtn = overlay.querySelector('.reitansai-pr-submit');
      var flash = overlay.querySelector('.reitansai-pr-flash');

      var statusIdx = 0;
      statusEl.textContent = STATUS_LINES[0];
      var statusTimer = setInterval(function () {
        statusIdx = (statusIdx + 1) % STATUS_LINES.length;
        statusEl.textContent = STATUS_LINES[statusIdx];
      }, 3200);

      setTimeout(function () { userInput && userInput.focus(); }, 80);

      var failCount = 0;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var u = (userInput.value || '').trim();
        var p = passInput.value || '';
        var remember = !!(rememberInput && rememberInput.checked);

        if (u === USER && p === PASS) {
          clearInterval(statusTimer);
          errorEl.textContent = '';
          statusEl.textContent = '認証成功 — 門が開きます';
          submitBtn.disabled = true;
          submitBtn.classList.add('is-success');
          submitBtn.textContent = 'ようこそ、探究者へ';
          if (flash) {
            flash.classList.add('is-on');
            setTimeout(function () { flash.classList.remove('is-on'); }, 400);
          }
          // confetti-ish burst of particles
          spawnParticles(particles, 24);
          markAuthenticated(remember);
          setTimeout(unlock, 550);
        } else {
          failCount++;
          var line = FAIL_LINES[Math.floor(Math.random() * FAIL_LINES.length)];
          if (failCount >= 3) {
            line = '連続失敗 ' + failCount + ' 回。深呼吸してから再挑戦を。';
          }
          errorEl.textContent = line;
          statusEl.textContent = '認証失敗ログを記録しました…（気のせい）';
          passInput.value = '';
          passInput.classList.remove('is-shake');
          void passInput.offsetWidth;
          passInput.classList.add('is-shake');
          userInput.classList.remove('is-shake');
          void userInput.offsetWidth;
          userInput.classList.add('is-shake');
          passInput.focus();
        }
      });

      overlay.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') e.preventDefault();
      });
    }

    mount();
  }

  window.ReitansaiPR = {
    logout: function () {
      try {
        localStorage.removeItem(KEY_AUTH);
        localStorage.removeItem(KEY_REMEMBER);
        sessionStorage.removeItem(KEY_SESSION);
      } catch (e) { /* ignore */ }
      location.reload();
    },
    isAuthenticated: isAuthenticated
  };

  if (isAuthenticated()) {
    document.documentElement.classList.remove('reitansai-pr-locked');
    return;
  }

  lockBodyEarly();
  showGate();
})();
