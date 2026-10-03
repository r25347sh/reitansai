/**
 * Home — after 11:30 JST: MAX 振り返り push
 */
(function () {
  'use strict';

  var EVENT_Y = 2026, EVENT_M = 10, EVENT_D = 3;
  var PUSH_FROM_MIN = 11 * 60 + 30;

  function nowJST() {
    try {
      var fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
      var map = {};
      fmt.formatToParts(new Date()).forEach(function (p) { map[p.type] = p.value; });
      var h = parseInt(map.hour, 10); if (h === 24) h = 0;
      return { y: parseInt(map.year, 10), m: parseInt(map.month, 10), d: parseInt(map.day, 10), minutes: h * 60 + parseInt(map.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function shouldPushFeedback() {
    var n = nowJST();
    if (n.y > EVENT_Y) return true;
    if (n.y === EVENT_Y && n.m > EVENT_M) return true;
    if (n.y === EVENT_Y && n.m === EVENT_M && n.d > EVENT_D) return true;
    if (n.y === EVENT_Y && n.m === EVENT_M && n.d === EVENT_D && n.minutes >= PUSH_FROM_MIN) return true;
    return false;
  }

  var cards = document.querySelectorAll('.card-grid .card');
  if (cards.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (en.isIntersecting) {
          en.target.style.transitionDelay = (i % 8) * 0.04 + 's';
          en.target.classList.add('in-view');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    cards.forEach(function (c) {
      c.style.opacity = '0';
      c.style.transform = 'translateY(18px)';
      c.style.transition = 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.34,1.2,0.64,1)';
      io.observe(c);
    });
    var st = document.createElement('style');
    st.textContent = '.card.in-view{opacity:1!important;transform:translateY(0)!important}';
    document.head.appendChild(st);
  }

  var banner = document.querySelector('.feedback-banner');
  var closeBtn = document.querySelector('[data-feedback-banner-close]');
  var KEY = 'rt-feedback-banner-dismissed';
  if (banner) {
    try {
      if (sessionStorage.getItem(KEY) === '1' && !shouldPushFeedback()) banner.classList.add('is-hidden');
    } catch (e) {}
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        banner.classList.add('is-hidden');
        try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
      });
    }
  }

  function feedbackHref() {
    return 'pages/feedback.html';
  }

  function showModal(force) {
    var MODAL_KEY = 'rt-feedback-modal-shown';
    var lastKey = 'rt-feedback-modal-last';
    if (!force) {
      try {
        var last = parseInt(sessionStorage.getItem(lastKey) || '0', 10);
        if (last && Date.now() - last < 2 * 60 * 1000) return; // min 2 min between
        if (sessionStorage.getItem(MODAL_KEY) === '1' && last && Date.now() - last < 3 * 60 * 1000) return;
      } catch (e) {}
    }
    if (document.getElementById('rt-feedback-modal')) return;

    var overlay = document.createElement('div');
    overlay.id = 'rt-feedback-modal';
    overlay.className = 'rt-feedback-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="rt-feedback-modal-card">' +
      '<div class="rt-feedback-modal-emoji" aria-hidden="true">📝</div>' +
      '<p class="rt-feedback-modal-kicker">発表枠は終了しました</p>' +
      '<h2 class="rt-feedback-modal-title">振り返りフォームに<br>ご協力ください！！</h2>' +
      '<p class="rt-feedback-modal-body">保護者・外部見学者・大学教員の方へ。<strong>数分で完了</strong>します。感想が生徒の大きな励みになります。</p>' +
      '<a class="rt-feedback-modal-cta" href="' + feedbackHref() + '">📝 今すぐ振り返る</a>' +
      '<button type="button" class="rt-feedback-modal-later" data-rt-modal-close>閉じる（また表示されます）</button>' +
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });

    function closeModal() {
      overlay.classList.remove('is-open');
      setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 280);
      try {
        sessionStorage.setItem(MODAL_KEY, '1');
        sessionStorage.setItem(lastKey, String(Date.now()));
      } catch (e) {}
    }
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    var later = overlay.querySelector('[data-rt-modal-close]');
    if (later) later.addEventListener('click', closeModal);
  }

  function ensureBottomBar() {
    if (document.getElementById('rt-feedback-bottom')) return;
    var bar = document.createElement('div');
    bar.id = 'rt-feedback-bottom';
    bar.className = 'rt-feedback-bottom';
    bar.innerHTML =
      '<a class="rt-feedback-bottom-cta" href="' + feedbackHref() + '">' +
      '<span class="rt-feedback-bottom-icon" aria-hidden="true">📝</span>' +
      '<span class="rt-feedback-bottom-text"><strong>振り返りフォーム</strong><small>発表は終了 — ご協力をお願いします</small></span>' +
      '<span class="rt-feedback-bottom-go">開く →</span></a>';
    document.body.appendChild(bar);
    document.documentElement.classList.add('rt-has-feedback-bottom');
  }

  function activatePushMode() {
    document.documentElement.classList.add('rt-push-feedback');
    document.body.classList.add('rt-push-feedback');

    if (banner) {
      banner.classList.remove('is-hidden');
      banner.classList.add('feedback-banner-push');
      try { sessionStorage.removeItem(KEY); } catch (e) {}
      var strong = banner.querySelector('.feedback-banner-text strong');
      var sub = banner.querySelector('.feedback-banner-sub');
      if (strong) strong.textContent = '【重要】発表枠終了 — 振り返りにご協力を！！';
      if (sub) sub.textContent = '保護者・外部見学者・大学教員の方 — 今すぐ数分で送れます';
      var btn = banner.querySelector('.feedback-banner-btn:not(.feedback-banner-btn-site)');
      if (btn) btn.textContent = '今すぐ振り返る！！';
    }

    var heroBtn = document.querySelector('.btn-feedback-hero');
    if (heroBtn) {
      heroBtn.textContent = '📝 振り返りフォーム（今すぐ！！）';
      heroBtn.classList.add('btn-feedback-mega');
    }

    var fabLabel = document.querySelector('.feedback-fab-label');
    if (fabLabel) fabLabel.textContent = '振り返り！！';

    ensureBottomBar();
    showModal(true);

    // Re-show modal every 3 minutes while on home
    setInterval(function () {
      if (shouldPushFeedback()) showModal(false);
    }, 3 * 60 * 1000);
  }

  function schedulePush() {
    if (shouldPushFeedback()) {
      activatePushMode();
      return;
    }
    var n = nowJST();
    if (n.y === EVENT_Y && n.m === EVENT_M && n.d === EVENT_D && n.minutes < PUSH_FROM_MIN) {
      setInterval(function () {
        if (shouldPushFeedback() && !document.documentElement.classList.contains('rt-push-feedback')) {
          activatePushMode();
        }
      }, 15000);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedulePush);
  else schedulePush();
})();
