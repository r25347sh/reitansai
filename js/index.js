/**
 * トップページ：ゼミカード一覧を生成（アイコン対応）
 */
(function () {
  const grid = document.getElementById("seminar-grid");
  if (!grid || typeof SEMINARS === "undefined") return;

  const ICON_MAP = {
    "asobi-tankyu": "public/images/seminars/Asobi seminar logo.svg",
    "data-science-ai": "public/images/seminars/data-science-ai.svg",
    "digital-content": "public/images/seminars/digital-content.svg",
    "event-planning": "public/images/seminars/event-planning.svg",
    "creative-writing": "public/images/seminars/creative-writing.svg",
    "video-editing": "public/images/seminars/video-editing.svg",
    "media": "public/images/seminars/media.svg",
    "chemistry": "public/images/seminars/chemistry.svg",
    "international-area": "public/images/seminars/international-area.svg",
    "education": "public/images/seminars/education.svg",
    "literature": "public/images/seminars/literature.svg",
    "sociology": "public/images/seminars/sociology.svg",
    "tourism": "public/images/seminars/tourism.svg",
    "language": "public/images/seminars/language.svg",
    "agriculture": "public/images/seminars/agriculture.svg"
  };

  SEMINARS.forEach((s) => {
    const iconSrc = ICON_MAP[s.id] || "";
    const article = document.createElement("article");
    article.className = "seminar-card";
    article.innerHTML = `
      <a href="seminars/${s.page}" class="seminar-card-link">
        <div class="seminar-card-head">
          ${iconSrc ? `<img class="seminar-card-icon" src="${escapeAttr(iconSrc)}" alt="" width="48" height="48" loading="lazy" decoding="async">` : ""}
          <h3 class="seminar-card-title">${escapeHtml(s.title)}</h3>
        </div>
        <p class="seminar-card-desc">${escapeHtml(s.description || "")}</p>
        <span class="seminar-card-more">詳しく見る →</span>
      </a>
    `;
    grid.appendChild(article);
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
})();
