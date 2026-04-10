(() => {
  const marker = "__API_BASE_URL_MARKER__";
  const injectedApiBaseUrl = "__API_BASE_URL__";
  const localApiBaseUrl = "http://localhost:3001/api";
  const productionApiBaseUrl = "https://seashell-app-kch93.ondigitalocean.app/api";
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const apiBaseUrl = injectedApiBaseUrl === marker
    ? (isLocalhost ? localApiBaseUrl : productionApiBaseUrl)
    : injectedApiBaseUrl;

  window.APP_CONFIG = {
    apiBaseUrl
  };
})();
