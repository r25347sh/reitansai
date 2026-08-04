/**
 * 麗探祭 404 Specialized Menu Controller
 */
(function () {
  "use strict";

  const toggle = document.getElementById("menuToggle");
  const panel = document.getElementById("menuPanel");
  if (!toggle || !panel) return;

  function openMenu() {
    toggle.setAttribute("aria-expanded", "true");
    panel.classList.add("open");
    document.addEventListener("click", onOutside, true);
    document.addEventListener("keydown", onKey);
  }

  function closeMenu() {
    toggle.setAttribute("aria-expanded", "false");
    panel.classList.remove("open");
    document.removeEventListener("click", onOutside, true);
    document.removeEventListener("keydown", onKey);
  }

  function onOutside(e) {
    if (!panel.contains(e.target) && !toggle.contains(e.target)) {
      closeMenu();
    }
  }

  function onKey(e) {
    if (e.key === "Escape") {
      closeMenu();
      toggle.focus();
    }
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // keyboard accessibility for links
  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });
})();
