(() => {
  const BASE_PATH = "/reitansai";

  const normalizePath = (pathname) => {
    const path = pathname || "/";
    const normalized = path.startsWith(BASE_PATH)
      ? path.slice(BASE_PATH.length) || "/"
      : path;

    return normalized.replace(/\/+$/, "") || "/";
  };

  const pageKeyFromLocation = () => {
    const path = normalizePath(window.location.pathname);
    const noTrailingSlash = path === "/" ? "/reitansai/" : `${BASE_PATH}${path}`;
    const htmlPath = noTrailingSlash.replace(/\.html$/, "");

    if (htmlPath.endsWith("/index")) {
      return htmlPath.replace(/\/index$/, "/index");
    }

    return htmlPath.replace(/\/$/, "") || "/reitansai";
  };

  const toAssetPath = (value) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    if (value.startsWith("/")) return value;
    return `${BASE_PATH}${value.startsWith("./") ? value.slice(2) : `/${value}`}`;
  };

  const alreadyAdded = new Set();

  const appendLink = (filePath) => {
    const href = toAssetPath(filePath);
    if (!href || alreadyAdded.has(`link:${href}`)) return;

    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) {
      alreadyAdded.add(`link:${href}`);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
    alreadyAdded.add(`link:${href}`);
  };

  const appendScript = (filePath) => {
    const src = toAssetPath(filePath);
    if (!src || alreadyAdded.has(`script:${src}`)) return;

    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      alreadyAdded.add(`script:${src}`);
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
    alreadyAdded.add(`script:${src}`);
  };

  const loadAssets = (mapping) => {
    const currentPath = pageKeyFromLocation();
    const fallbackKeys = [
      currentPath,
      currentPath.replace(/\/index$/, ""),
      currentPath + "/index",
      currentPath + ".html",
      currentPath.replace(/\/$/, ""),
      `${BASE_PATH}${normalizePath(currentPath)}`,
      `${BASE_PATH}/index`,
      `${BASE_PATH}/`
    ];

    const pageFiles = [];
    for (const key of fallbackKeys) {
      const value = mapping[key];
      if (Array.isArray(value)) {
        pageFiles.push(...value);
      }
    }

    if (Array.isArray(mapping.ALL)) {
      pageFiles.push(...mapping.ALL);
    }

    const uniqueFiles = [...new Set(pageFiles)];

    for (const filePath of uniqueFiles) {
      if (filePath.endsWith(".css")) {
        appendLink(filePath);
      }
      if (filePath.endsWith(".js")) {
        appendScript(filePath);
      }
    }
  };

  const init = () => {
    const jsonPath = `${BASE_PATH}/src/json/linking_files.json`;

    fetch(jsonPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load mapping: ${response.status}`);
        }
        return response.json();
      })
      .then((mapping) => {
        loadAssets(mapping);
      })
      .catch((error) => {
        console.warn("loader.js: failed to load linking_files.json", error);
      });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
