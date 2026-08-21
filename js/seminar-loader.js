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

  // 日本語ファイル名は encodeURIComponent 必須
  // GitHub Pages では .nojekyll が必要（Jekyll が frontmatter 付き .md を食うため）
  const path = "../content/seminars/" + encodeURIComponent(mdFileName) + ".md";

  fetch(path)
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " " + path);
      return res.text();
    })
    .then(function (text) {
      var parsed = parseFrontmatter(text);
      var frontmatter = parsed.frontmatter;
      var body = parsed.body;

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

      var bodyContent = frontmatter.body || body || "";
      if (bodyEl) {
        if (typeof marked !== "undefined" && bodyContent) {
          bodyEl.innerHTML = marked.parse(bodyContent);
        } else {
          bodyEl.textContent = bodyContent;
        }
      }

      if (sectionsEl && Array.isArray(frontmatter.sections)) {
        sectionsEl.innerHTML = "";
        frontmatter.sections.forEach(function (sec) {
          var section = document.createElement("section");
          section.className = "content-section";

          if (sec.type === "text_block") {
            if (sec.heading) {
              var h = document.createElement("h2");
              h.textContent = sec.heading;
              section.appendChild(h);
            }
            if (sec.body) {
              var p = document.createElement("p");
              p.textContent = sec.body;
              section.appendChild(p);
            }
          } else if (sec.type === "image_text_block") {
            if (sec.image) {
              var img = document.createElement("img");
              img.src = resolveAssetPath(sec.image);
              img.alt = sec.caption || "";
              img.className = "section-image";
              section.appendChild(img);
            }
            if (sec.caption) {
              var cap = document.createElement("p");
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
    .catch(function (err) {
      console.error("[seminar-loader]", err);
      if (titleEl) {
        titleEl.textContent = "データの読み込みに失敗しました";
      }
      if (bodyEl) {
        bodyEl.innerHTML =
          "<p style=\"color:#f87171;\">コンテンツを取得できませんでした。<br>" +
          "<code style=\"font-size:0.85em;\">" +
          path +
          "</code></p>";
      }
    });
}

function parseFrontmatter(text) {
  var parts = text.split(/^---\s*$/m);
  if (parts.length < 3) {
    return { frontmatter: {}, body: text.trim() };
  }

  var yamlText = parts[1] || "";
  var body = parts.slice(2).join("---").trim();
  var frontmatter = {};

  var lines = yamlText.split("\n");
  var i = 0;
  while (i < lines.length) {
    var line = lines[i];
    var match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);

    if (!match) {
      i++;
      continue;
    }

    var key = match[1].trim();
    var value = match[2].trim();

    if (value === "" && i + 1 < lines.length && /^\s+-\s/.test(lines[i + 1])) {
      var list = [];
      i++;
      var current = null;

      while (i < lines.length) {
        var l = lines[i];
        var itemStart = l.match(/^\s+-\s+(.*)$/);
        var prop = l.match(/^\s{2,}([A-Za-z0-9_]+):\s*(.*)$/);

        if (itemStart) {
          if (current) list.push(current);
          current = {};
          var rest = itemStart[1];
          var kv = rest.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
          if (kv) {
            current[kv[1]] = unquote(kv[2].trim());
          }
          i++;
        } else if (prop && current) {
          current[prop[1]] = unquote(prop[2].trim());
          i++;
        } else if (/^[A-Za-z0-9_]+:/.test(l) && !/^\s/.test(l)) {
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

  return { frontmatter: frontmatter, body: body };
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

/**
 * アセットパス解決
 * - /images/... → ../public/images/...（実体は public/ 配下）
 * - 相対パスはそのまま
 */
function resolveAssetPath(path) {
  if (!path) return "";
  if (path.indexOf("http") === 0 || path.indexOf("data:") === 0) return path;

  // CMS の output: /images/seminars → 実ファイルは public/images/seminars
  if (path.indexOf("/images/") === 0) {
    return "../public" + path;
  }
  if (path.charAt(0) === "/") {
    return ".." + path;
  }
  return path;
}
