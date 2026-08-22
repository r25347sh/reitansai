/**
 * Pages CMS 用ゼミ詳細ローダー（純化版）
 * - YAML frontmatter を解析
 * - marked.js で Markdown を HTML 化
 * - 結果を <section class="pages_cms" id="pages_cms"></section> にのみ挿入
 *
 * 使い方:
 *   <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
 *   <script src="../js/seminar-loader.js"></script>
 *   <script>loadSeminar("遊びの探求ゼミ", "遊びの探求ゼミ");</script>
 */

function loadSeminar(mdFileName, fallbackTitle) {
  var container = document.getElementById("pages_cms");
  if (!container) {
    console.error("[seminar-loader] #pages_cms が見つかりません");
    return;
  }

  var path = "../content/seminars/" + encodeURIComponent(mdFileName) + ".md";

  fetch(path)
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status + " " + path);
      return res.text();
    })
    .then(function (text) {
      var parsed = parseFrontmatter(text);
      var fm = parsed.frontmatter;
      var body = parsed.body;

      var title = fm.title || fallbackTitle || mdFileName;
      document.title = title + "｜麗探祭";

      if (fm.icon) {
        setFavicon(resolveAssetPath(fm.icon));
      }

      var html = "";

      // タイトル
      html += "<h1>" + escapeHtml(title) + "</h1>";

      // 担当
      if (fm.teacher) {
        html += '<p class="teacher">担当：' + escapeHtml(fm.teacher) + "</p>";
      }

      // アイコン
      if (fm.icon) {
        html +=
          '<p class="icon"><img src="' +
          escapeAttr(resolveAssetPath(fm.icon)) +
          '" alt="" width="80" height="80"></p>';
      }

      // 一言概要
      if (fm.description) {
        html += '<p class="description">' + escapeHtml(fm.description) + "</p>";
      }

      // 画像
      if (fm.image) {
        html +=
          '<p class="image"><img src="' +
          escapeAttr(resolveAssetPath(fm.image)) +
          '" alt=""></p>';
      }

      // 本文（frontmatter.body 優先、なければ Markdown body）
      var bodyContent = fm.body || body || "";
      if (bodyContent) {
        if (typeof marked !== "undefined") {
          html += '<div class="body">' + marked.parse(bodyContent) + "</div>";
        } else {
          html +=
            '<div class="body"><pre>' + escapeHtml(bodyContent) + "</pre></div>";
        }
      }

      // sections
      if (Array.isArray(fm.sections)) {
        fm.sections.forEach(function (sec) {
          html += '<section class="cms-section">';
          if (sec.type === "text_block") {
            if (sec.heading) {
              html += "<h2>" + escapeHtml(sec.heading) + "</h2>";
            }
            if (sec.body) {
              html += "<p>" + escapeHtml(sec.body) + "</p>";
            }
          } else if (sec.type === "image_text_block") {
            if (sec.image) {
              html +=
                '<img src="' +
                escapeAttr(resolveAssetPath(sec.image)) +
                '" alt="' +
                escapeAttr(sec.caption || "") +
                '">';
            }
            if (sec.caption) {
              html += "<p>" + escapeHtml(sec.caption) + "</p>";
            }
          }
          html += "</section>";
        });
      }

      container.innerHTML = html;
    })
    .catch(function (err) {
      console.error("[seminar-loader]", err);
      container.innerHTML =
        "<p>データの読み込みに失敗しました。</p><code>" +
        escapeHtml(path) +
        "</code>";
    });
}

function setFavicon(href) {
  if (!href) return;
  var type = "image/png";
  if (/\.svg(\?|$)/i.test(href)) type = "image/svg+xml";
  else if (/\.ico(\?|$)/i.test(href)) type = "image/x-icon";
  else if (/\.jpe?g(\?|$)/i.test(href)) type = "image/jpeg";
  else if (/\.webp(\?|$)/i.test(href)) type = "image/webp";

  var links = document.querySelectorAll("link[rel~='icon']");
  if (links.length > 0) {
    links.forEach(function (link) {
      link.href = href;
      link.type = type;
    });
    return;
  }
  var link = document.createElement("link");
  link.rel = "icon";
  link.type = type;
  link.href = href;
  document.head.appendChild(link);
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

function resolveAssetPath(path) {
  if (!path) return "";
  if (path.indexOf("http") === 0 || path.indexOf("data:") === 0) return path;
  if (path.indexOf("/images/") === 0) {
    return "../public" + path;
  }
  if (path.charAt(0) === "/") {
    return ".." + path;
  }
  return path;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
