(function () {
  function apiFetch(path, options) {
    const url = window.AppConfig ? window.AppConfig.buildApiUrl(path) : path;
    return fetch(url, options);
  }

  window.apiFetch = apiFetch;
})();
