/**
 * Inject Myスケジュール into .nav-desktop on every page.
 */
(function () {
  function url(path) {
    var p = location.pathname || '';
    var base = (p.indexOf('/reitansai/') === 0 || p === '/reitansai') ? '/reitansai/' : '/reitansai/';
    if (path.charAt(0) === '/') return path.indexOf('/reitansai') === 0 ? path : '/reitansai' + path;
    return base + path.replace(/^\.\//, '');
  }
  function ensureHeaderNav() {
    var nav = document.querySelector('.site-header .nav-desktop');
    if (!nav) return;
    var hrefMy = url('pages/my/my_schedule.html');
    var has = false;
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {
      if ((a.getAttribute('href') || '').indexOf('my_schedule') >= 0) has = true;
    });
    if (has) return;
    var a = document.createElement('a');
    a.href = hrefMy;
    a.textContent = 'Myスケジュール';
    var after = null;
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (el) {
      var h = el.getAttribute('href') || '';
      if (h.indexOf('schedule.html') >= 0 && h.indexOf('my_schedule') < 0) after = el;
    });
    if (after && after.nextSibling) nav.insertBefore(a, after.nextSibling);
    else if (after) after.parentNode.appendChild(a);
    else nav.appendChild(a);
    if ((location.pathname || '').indexOf('my_schedule') >= 0) a.classList.add('is-active');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureHeaderNav);
  } else {
    ensureHeaderNav();
  }
})();
