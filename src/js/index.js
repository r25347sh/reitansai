/**
 * Home page — entrance animations + feedback banner
 * After 11:30 JST on event day → extreme 振り返り CTA mode
 */
(function () {
  'use strict';

  var EVENT_Y = 2026;
  var EVENT_M = 10;
  var EVENT_D = 3;
  var PUSH_FROM_MIN = 11 * 60 + 30; // 11:30

  function nowJST() {
    try {
      var fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      var parts = fmt.formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var h = parseInt(map.hour, 10);
      if (h === 24) h = 0;
      return {
        y: parseInt(map.year, 10),
        m: parseInt(map.month, 10),
        d: parseInt(map.day, 10),
        minutes: h * 60 + parseInt(map.minute, 10)
      };
    } catch (e) {
      var d = new Date();
      return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function shouldPushFeedback() {
    var n = nowJST();
    // After event day entirely
    if (n.y > EVENT_Y) return true;
    if (n.y === EVENT_Y && n.m > EVENT_M) return true;
    if (n.y === EVENT_Y && n.m === EVENT_M && n.d > EVENT_D) return true;
    // Event day after 11:30
    if (n.y === EVENT_Y && n.m === EVENT_M && n.d === EVENT_D && n.minutes >= PUSH_FROM_MIN) return true;
    return false;
  }

  // Card entrance
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

    var style = document.createElement('style');
    style.textContent = '.card.in-view{opacity:1!important;transform:translateY(0)!important}';
    document.head.appendChild(style);
  }

  // Feedback banner: dismiss + sessionStorage (before 11:30)
  var banner = document.querySelector('.feedback-banner');
  var closeBtn = document.querySelector('[data-feedback-banner-close]');
  var KEY = 'rt-feedback-banner-dismissed';
  if (banner) {
    try {
      if (sessionStorage.getItem(KEY) === '1' && !shouldPushFeedback()) {
        banner.classList.add('is-hidden');
      }
    } catch (e) {}
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        // After 11:30: allow close but only hide for this session briefly; still keep FAB
        banner.classList.add('is-hidden');
        try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
      });
    }
  }

  function activatePushMode() {
    document.documentElement.classList.add('rt-push-feedback');
    document.body.classList.add('rt-push-feedback');

    // Force banner visible with stronger copy
    if (banner) {
      banner.classList.remove('is-hidden');
      banner.classList.add('feedback-banner-push');
      try { sessionStorage.removeItem(KEY); } catch (e) {}
      var strong = banner.querySelector('.feedback-banner-text strong');
      var sub = banner.querySelector('.feedback-banner-sub');
      if (strong) strong.textContent = '発表枠は終了しました — 振り返りにご協力ください';
      if (sub) sub.textContent = '保護者・外部見学者・大学教員の方 — ご感想が生徒の励みになります';
      var btn = banner.querySelector('.feedback-banner-btn:not(.feedback-banner-btn-site)');
      if (btn) btn.textContent = '今すぐ振り返る';
    }

    // Hero primary button
    var heroBtn = document.querySelector('.btn-feedback-hero');
    if (heroBtn) {
      heroBtn.textContent = '📝 振り返りフォーム（ご協力ください）';
      heroBtn.classList.add('btn-feedback-mega');
    }

    // FAB label
    var fabLabel = document.querySelector('.feedback-fab-label');
    if (fabLabel) fabLabel.textContent = '今すぐ振り返り';

    // One-time modal nudge (session)
    var MODAL_KEY = 'rt-feedback-modal-shown';
    var shown = false;
    try { shown = sessionStorage.getItem(MODAL_KEY) === '1'; } catch (e) {}
    if (!shown && !document.getElementById('rt-feedback-modal')) {
      var overlay = document.createElement('div');
      overlay.id = 'rt-feedback-modal';
      overlay.className = 'rt-feedback-modal';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', '振り返りフォームのご案内');
      overlay.innerHTML =
        '<div class="rt-feedback-modal-card">' +
        '<p class="rt-feedback-modal-kicker">発表枠 終了</p>' +
        '<h2 class="rt-feedback-modal-title">振り返りフォームへ<br>ご協力ください</h2>' +
        '<p class="rt-feedback-modal-body">見学の感想・印象に残った発表など、<strong>数分で送れます</strong>。生徒への大きな励みになります。</p>' +
        '<a class="rt-feedback-modal-cta" href="pages/feedback.html">📝 振り返りフォームを開く</a>' +
        '<button type="button" class="rt-feedback-modal-later" data-rt-modal-close>あとで</button>' +
        '</div>';
      document.body.appendChild(overlay);
      requestAnimationFrame(function () {
        overlay.classList.add('is-open');
      });
      function closeModal() {
        overlay.classList.remove('is-open');
        setTimeout(function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 280);
        try { sessionStorage.setItem(MODAL_KEY, '1'); } catch (e) {}
      }
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
      });
      var later = overlay.querySelector('[data-rt-modal-close]');
      if (later) later.addEventListener('click', closeModal);
    }
  }

  function schedulePush() {
    if (shouldPushFeedback()) {
      activatePushMode();
      return;
    }
    // Poll until 11:30 on event day (every 20s)
    var n = nowJST();
    if (n.y === EVENT_Y && n.m === EVENT_M && n.d === EVENT_D && n.minutes < PUSH_FROM_MIN) {
      setInterval(function () {
        if (shouldPushFeedback() && !document.documentElement.classList.contains('rt-push-feedback')) {
          activatePushMode();
        }
      }, 20000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedulePush);
  } else {
    schedulePush();
  }
})();
