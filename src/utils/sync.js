// src/utils/sync.js
const API_BASE =
  (import.meta.env?.VITE_API_BASE?.replace(/\/$/, "")) ||
  ""; // same-origin on Pages; keep blank

async function jsonFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data ?? { ok: true };
}

export async function register(email, password) {
  const out = await jsonFetch("/api/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return { ok: true, message: out.message || "Registered successfully" };
}

export async function login(email, password) {
  const out = await jsonFetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return { ok: true, message: out.message || "Logged in" };
}

export async function logout() {
  const out = await jsonFetch("/api/logout", { method: "POST" });
  return { ok: true, message: out.message || "Logged out" };
}

export async function me() {
  // who am I? (optional but nice for showing current user)
  return jsonFetch("/api/me", { method: "GET" }); // expects { ok:true, email?: string }
}

// Optional sync hook you already wired later:
// export async function syncNow(payload) {
//   return jsonFetch("/api/sync", { method: "POST", body: JSON.stringify(payload) });
// }
export async function syncNow(payload = {}) {
  // Sends your local contacts to the server for syncing
  const res = await fetch("/api/sync", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* if not JSON, ignore */
  }

  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data ?? { ok: true, message: "Synced successfully" };
}

