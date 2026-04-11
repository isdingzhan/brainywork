const localApiBaseUrl = "http://localhost:3001/api";
const productionApiBaseUrl = "https://seashell-app-kch93.ondigitalocean.app/api";
const hostname = window.location.hostname;
const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
const configuredApiBaseUrl =
  window.APP_CONFIG?.apiBaseUrl ||
  window.APP_CONFIG?.API_BASE_URL ||
  (isLocalhost ? localApiBaseUrl : productionApiBaseUrl);
const apiBaseUrl = configuredApiBaseUrl?.replace(/\/+$/, "");

if (!apiBaseUrl) {
  throw new Error("API base URL is not defined.");
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message || "请求失败");
  }

  return payload;
}

export async function getHealth() {
  return request("/health");
}

export async function getHomeworkList() {
  const payload = await request("/homework");
  return payload.items || [];
}

export async function getHomeworkDetail(id) {
  return request(`/homework/${id}`);
}

export async function createHomework(data) {
  return request("/homework", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateHomework(id, data) {
  return request(`/homework/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}
