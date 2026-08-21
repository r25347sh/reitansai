/**
 * トップページ：ゼミカード一覧を生成
 */
(function () {
  const grid = document.getElementById("seminar-grid");
  if (!grid || typeof SEMINARS === "undefined") return;

  SEMINARS.forEach((s) => {
    const article = document.createElement("article");
    article.className = "seminar-card";
    article.innerHTML = `
      <a href="seminars/${s.page}" class="seminar-card-link">
        <h3 class="seminar-card-title">${escapeHtml(s.title)}</h3>
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
})();
