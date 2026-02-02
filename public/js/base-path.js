(function () {
  var basePath =
    (window.__APP_CONFIG__ && window.__APP_CONFIG__.APP_BASE_PATH) || "";
  if (!basePath) return;
  if (!basePath.startsWith("/")) basePath = "/" + basePath;
  if (basePath.endsWith("/")) basePath = basePath.slice(0, -1);
  if (window.location.pathname.indexOf(basePath) !== 0) return;

  var base = document.createElement("base");
  base.href = basePath + "/";
  document.head.insertBefore(base, document.head.firstChild);
})();
