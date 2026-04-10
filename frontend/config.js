(() => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const defaultApiBaseUrl = isLocalhost
    ? "http://localhost:3001/api"
    : "https://seashell-app-kch93.ondigitalocean.app/api";

  window.APP_CONFIG = {
    apiBaseUrl: defaultApiBaseUrl
  };
})();
