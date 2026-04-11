(() => {
  const apiBaseUrlPlaceholder = "__API_BASE_URL__";
  const injectedApiBaseUrl = "__API_BASE_URL__";
  const localApiBaseUrl = "http://localhost:3001/api";
  const productionApiBaseUrl = "https://seashell-app-kch93.ondigitalocean.app/api";
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const defaultApiBaseUrl = isLocalhost ? localApiBaseUrl : productionApiBaseUrl;
  const normalizedInjectedApiBaseUrl =
    typeof injectedApiBaseUrl === "string"
      ? injectedApiBaseUrl.trim().replace(/\/+$/, "")
      : "";

  const apiBaseUrl =
    normalizedInjectedApiBaseUrl && normalizedInjectedApiBaseUrl !== apiBaseUrlPlaceholder
      ? normalizedInjectedApiBaseUrl
      : defaultApiBaseUrl;

  window.APP_CONFIG = {
    apiBaseUrl,
    API_BASE_URL: apiBaseUrl
  };
})();
