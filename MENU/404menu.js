/**
 * 麗探祭 404 Specialized Menu Controller
 * 項目は MENU/MENU.js の RADIAL_MENU_DATA と同じ構成
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
    panel.querySelectorAll(".sub-list.open").forEach((el) => el.classList.remove("open"));
    panel.querySelectorAll(".sub-toggle[aria-expanded='true']").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
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

  panel.querySelectorAll(".sub-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const expanded = btn.getAttribute("aria-expanded") === "true";
      const subList = btn.nextElementSibling;
      if (!subList || !subList.classList.contains("sub-list")) return;

      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      if (expanded) {
        subList.classList.remove("open");
      } else {
        subList.classList.add("open");
      }
    });
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });
})();
