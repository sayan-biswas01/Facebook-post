const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const TOKEN_KEY = "fp_token";

export const auth = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function http(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth.get() ? { Authorization: `Bearer ${auth.get()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/auth/login") {
    auth.clear();
    window.location.href = "/login";
  }
  if (!res.ok) throw new Error(data.error || `ত্রুটি (${res.status})`);
  return data;
}
