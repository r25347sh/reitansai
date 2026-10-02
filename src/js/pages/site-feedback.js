/**
 * Site Feedback form — client validation + UX
 * Posts to Google Forms (entry IDs extracted from form HTML)
 */
(function () {
  'use strict';

  var form = document.getElementById('site-feedback-form');
  if (!form) return;

  var impression = document.getElementById('entry-impression');
  var submitBtn = document.getElementById('submit-btn');
  var btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  var btnLoading = submitBtn ? submitBtn.querySelector('.btn-loading') : null;
  var successPanel = document.getElementById('success-panel');
  var errorEl = document.querySelector('.field-error[data-for="entry-impression"]');

  function setInvalid(isInvalid) {
    if (!impression) return;
    impression.classList.toggle('is-invalid', isInvalid);
    if (errorEl) errorEl.hidden = !isInvalid;
  }

  function setSubmitting(on) {
    if (!submitBtn) return;
    submitBtn.disabled = on;
    if (btnText) btnText.hidden = on;
    if (btnLoading) btnLoading.hidden = !on;
  }

  if (impression) {
    impression.addEventListener('input', function () {
      if (impression.value.trim()) setInvalid(false);
    });
    impression.addEventListener('blur', function () {
      if (!impression.value.trim()) setInvalid(true);
    });
  }

  form.addEventListener('submit', function (e) {
    var val = (impression && impression.value || '').trim();
    if (!val) {
      e.preventDefault();
      setInvalid(true);
      if (impression) impression.focus();
      return;
    }
    setInvalid(false);
    setSubmitting(true);

    // Google Forms opens in new tab; restore button after short delay
    setTimeout(function () {
      setSubmitting(false);
      if (form && successPanel) {
        form.hidden = true;
        successPanel.hidden = false;
        successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 900);
  });

  form.addEventListener('reset', function () {
    setInvalid(false);
    setSubmitting(false);
    if (successPanel) successPanel.hidden = true;
    form.hidden = false;
  });
})();
