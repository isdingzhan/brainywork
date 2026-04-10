const apiBaseUrl = window.APP_CONFIG?.apiBaseUrl?.replace(/\/+$/, "");

if (!apiBaseUrl) {
  throw new Error("APP_CONFIG.apiBaseUrl is not defined.");
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
