/*
 * MENU/MENU.js - Interaction fixes: precise positioning, scrim handling, stronger open/close animation control
 * This patch replaces openMenu/closeMenu and pointer event handling to ensure:
 *  - left/top is set to clientX/clientY so menu center aligns with finger
 *  - scrim only captures pointer events when active
 *  - close waits for transition end before fully removing active state
 */
(function (){
  // find existing functions/variables in file scope dynamically.
  // We'll patch by adding replacement implementations. Assumes original file declares certain names.
})();

/*
  BELOW: Implementation to be merged into MENU/MENU.js
  Replace the existing openMenu, closeMenu and pointerdown/pointerup/pointermove handlers with these
*/

// --- Replaced openMenu ---
function openMenu(x, y) {
  if (!menuEl) createMenuDOM();
  const margin = 80; // safe margin from edges
  const left = Math.max(margin, Math.min(x, window.innerWidth - margin));
  const top  = Math.max(margin, Math.min(y, window.innerHeight - margin));

  // Set center coordinates; CSS uses translate(-50%,-50%) to center on these coordinates
  menuEl.style.left = left + 'px';
  menuEl.style.top  = top  + 'px';

  // show menu and enable animated visuals slightly deferred for better entrance timing
  menuEl.classList.add('active');
  requestAnimationFrame(() => menuEl.classList.add('animated'));

  if (scrimEl) {
    scrimEl.classList.add('active');
    scrimEl.style.pointerEvents = 'auto';
  }

  isOpen = true;
  menuStack = [];
  renderMenuLevel(RADIAL_MENU_DATA);
  triggerParticleBurst();
}

// --- Replaced closeMenu ---
function closeMenu() {
  if (!menuEl) return;

  // begin closing animation by removing animated
  menuEl.classList.remove('animated');

  // ensure we remove active only after opacity transition finishes
  function onTransitionEnd(e) {
    if (e.target !== menuEl) return;
    if (e.propertyName && e.propertyName.indexOf('opacity') === -1) return;
    menuEl.classList.remove('active');
    if (scrimEl) {
      scrimEl.classList.remove('active');
      scrimEl.style.pointerEvents = 'none';
    }
    menuEl.removeEventListener('transitionend', onTransitionEnd);
  }

  menuEl.addEventListener('transitionend', onTransitionEnd);

  // fallback: after 550ms forcibly hide
  setTimeout(() => {
    if (menuEl.classList.contains('active')) {
      menuEl.classList.remove('active');
      if (scrimEl) {
        scrimEl.classList.remove('active');
        scrimEl.style.pointerEvents = 'none';
      }
      try { menuEl.removeEventListener('transitionend', onTransitionEnd); } catch (e) {}
    }
  }, 600);

  // visual state
  if (itemsContainer) itemsContainer.querySelectorAll('.rm-item').forEach(el => el.classList.remove('rendered'));
  if (coreBtn) coreBtn.classList.remove('visible');
  isOpen = false;
}

// --- Replaced event binding for pointer interactions ---
// Unbind previous handlers if any to avoid duplicates
try { document.removeEventListener('pointerdown', __menu_pointerdown_handler); } catch (e) {}

function __menu_pointerdown_handler(e) {
  if (isOpen && menuEl && menuEl.contains(e.target)) return;
  if (isOpen && menuEl && !menuEl.contains(e.target) && !(scrimEl && scrimEl.contains(e.target))) {
    closeMenu();
    return;
  }
  if (isOpen) return;

  startX = e.clientX; startY = e.clientY;
  tapCount++; clearTimeout(tapTimer);

  if (tapCount === 3) {
    clearTimeout(timer); timer = null; tapCount = 0; openMenu(startX, startY); return;
  }

  tapTimer = setTimeout(() => { tapCount = 0; }, TRIPLE_TAP_DELAY_MS);
  clearTimeout(timer);
  timer = setTimeout(() => { tapCount = 0; openMenu(startX, startY); }, LONG_PRESS_MS);
}

function __menu_pointermove_handler(e) {
  if (!timer || isOpen) return;
  if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD) { clearTimeout(timer); timer = null; }
}

function __menu_pointerup_handler() {
  if (timer && !isOpen) { clearTimeout(timer); timer = null; }
}

document.addEventListener('pointerdown', __menu_pointerdown_handler);
document.addEventListener('pointermove', __menu_pointermove_handler);
document.addEventListener('pointerup', __menu_pointerup_handler);
