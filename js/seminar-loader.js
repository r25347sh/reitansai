/**
 * ゼミ詳細ページ共通ローダー
 * - YAML frontmatter（簡易パーサ）を解析
 * - marked.js で Markdown 本文を HTML 化
 * - sections（text_block / image_text_block）に対応
 *
 * 使い方:
 *   <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
 *   <script src="../js/seminar-loader.js"></script>
 *   <script>loadSeminar("遊びの探求ゼミ", "遊びの探究ゼミ");</script>
 */

function loadSeminar(mdFileName, fallbackTitle) {
  const titleEl = document.getElementById("seminar-title");
  const teacherEl = document.getElementById("seminar-teacher");
  const descEl = document.getElementById("seminar-description");
  const bodyEl = document.getElementById("seminar-body");
  const iconEl = document.getElementById("seminar-icon");
  const imageEl = document.getElementById("seminar-image");
  const sectionsEl = document.getElementById("seminar-sections");

  const path = `../content/seminars/${encodeURIComponent(mdFileName)}.md`;

  fetch(path)
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then((text) => {
      const { frontmatter, body } = parseFrontmatter(text);

      if (titleEl) {
        titleEl.textContent = frontmatter.title || fallbackTitle || mdFileName;
      }
      if (teacherEl) {
        teacherEl.textContent = frontmatter.teacher || "-";
      }
      if (descEl) {
        descEl.textContent = frontmatter.description || "";
      }

      if (iconEl && frontmatter.icon) {
        iconEl.src = resolveAssetPath(frontmatter.icon);
        iconEl.style.display = "block";
      }
      if (imageEl && frontmatter.image) {
        imageEl.src = resolveAssetPath(frontmatter.image);
        imageEl.style.display = "block";
      }

      // 本文（frontmatter の body 優先、なければ Markdown 本体）
      const bodyContent = frontmatter.body || body || "";
      if (bodyEl) {
        if (typeof marked !== "undefined" && bodyContent) {
          bodyEl.innerHTML = marked.parse(bodyContent);
        } else {
          bodyEl.textContent = bodyContent;
        }
      }

      // sections ブロック
      if (sectionsEl && Array.isArray(frontmatter.sections)) {
        sectionsEl.innerHTML = "";
        frontmatter.sections.forEach((sec) => {
          const section = document.createElement("section");
          section.className = "content-section";

          if (sec.type === "text_block") {
            if (sec.heading) {
              const h = document.createElement("h2");
              h.textContent = sec.heading;
              section.appendChild(h);
            }
            if (sec.body) {
              const p = document.createElement("p");
              p.textContent = sec.body;
              section.appendChild(p);
            }
          } else if (sec.type === "image_text_block") {
            if (sec.image) {
              const img = document.createElement("img");
              img.src = resolveAssetPath(sec.image);
              img.alt = sec.caption || "";
              img.className = "section-image";
              section.appendChild(img);
            }
            if (sec.caption) {
              const cap = document.createElement("p");
              cap.className = "image-caption";
              cap.textContent = sec.caption;
              section.appendChild(cap);
            }
          }

          sectionsEl.appendChild(section);
        });
      }

      document.title =
        (frontmatter.title || fallbackTitle || mdFileName) + " - ゼミ紹介｜麗探祭";
    })
    .catch((err) => {
      console.error(err);
      if (titleEl) titleEl.textContent = "データの読み込みに失敗しました";
    });
}

/**
 * 簡易 YAML frontmatter パーサ
 * --- で囲まれた先頭ブロックを key: value として解析
 * sections は簡易リスト対応
 */
function parseFrontmatter(text) {
  const parts = text.split(/^---\s*$/m);
  if (parts.length < 3) {
    return { frontmatter: {}, body: text.trim() };
  }

  const yamlText = parts[1] || "";
  const body = parts.slice(2).join("---").trim();
  const frontmatter = {};

  const lines = yamlText.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);

    if (!match) {
      i++;
      continue;
    }

    const key = match[1].trim();
    let value = match[2].trim();

    // リスト開始（sections: など）
    if (value === "" && i + 1 < lines.length && /^\s+-\s/.test(lines[i + 1])) {
      const list = [];
      i++;
      let current = null;

      while (i < lines.length) {
        const l = lines[i];
        const itemStart = l.match(/^\s+-\s+(.*)$/);
        const prop = l.match(/^\s{2,}([A-Za-z0-9_]+):\s*(.*)$/);

        if (itemStart) {
          if (current) list.push(current);
          current = {};
          const rest = itemStart[1];
          const kv = rest.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
          if (kv) {
            current[kv[1]] = unquote(kv[2].trim());
          }
          i++;
        } else if (prop && current) {
          current[prop[1]] = unquote(prop[2].trim());
          i++;
        } else if (/^[A-Za-z0-9_]+:/.test(l) && !/^\s/.test(l)) {
          // 次のトップレベルキー
          break;
        } else {
          i++;
        }
      }
      if (current) list.push(current);
      frontmatter[key] = list;
      continue;
    }

    frontmatter[key] = unquote(value);
    i++;
  }

  return { frontmatter, body };
}

function unquote(s) {
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }
  return s;
}

function resolveAssetPath(path) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  // /images/... → ../images/...（seminars/ から見た相対）
  if (path.startsWith("/")) return ".." + path;
  return path;
}
