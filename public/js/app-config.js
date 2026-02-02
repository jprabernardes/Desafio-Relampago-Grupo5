(function () {
  const rawConfig = window.__APP_CONFIG__ || {};
  const appBasePath = rawConfig.APP_BASE_PATH || "";
  const apiBaseUrl = rawConfig.API_BASE_URL || "/api";

  function resolveAppPath(path) {
    const cleanPath = (path || "").trim();
    if (!cleanPath || cleanPath === "/") {
      return appBasePath || "/";
    }
    const normalized = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    return `${appBasePath}${normalized}`;
  }

  function buildApiUrl(path) {
    const cleanPath = (path || "").trim();
    if (!cleanPath) return apiBaseUrl;
    const normalized = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    return `${apiBaseUrl}${normalized}`;
  }

  window.AppConfig = {
    appBasePath,
    apiBaseUrl,
    resolveAppPath,
    buildApiUrl,
  };
})();
