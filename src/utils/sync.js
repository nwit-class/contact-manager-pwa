// src/utils/sync.js

// --- Configure your Cloudflare Pages domain here (no trailing slash) ---
const PAGES = 'https://00415912.contact-manager-pwa-ab6.pages.dev';

// When running locally, point to the deployed API; in production use same-origin
export const API =
  (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'))
    ? `${PAGES}/api`
    : '/api';

// ---------- small helpers ----------
async function asJSON(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { error: text || res.statusText }; }
}

function assertCreds(u, p) {
  if (!u || !p) throw new Error('username and password required');
}

// ---------- AUTH ----------
export async function register(username, password) {
  assertCreds(username, password);
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  const data = await asJSON(res);
  if (!res.ok) throw new Error(data.error || `register failed (${res.status})`);
  return data; // { username, ok: true } (your function may return slightly different)
}

export async function login(username, password) {
  assertCreds(username, password);
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  const data = await asJSON(res);
  if (!res.ok) throw new Error(data.error || `login failed (${res.status})`);
  return data; // { username, ok: true }
}

export async function logout() {
  const res = await fetch(`${API}/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  if (!res.ok) {
    const data = await asJSON(res);
    throw new Error(data.error || `logout failed (${res.status})`);
  }
  return { ok: true };
}

// ---------- SYNC (placeholder) ----------
// This keeps your UI working now. We’ll replace with real push/pull later.
export async function syncNow() {
  // Try /api/sync first; if your backend only has /api/contacts, we fallback.
  // Both calls include credentials for your session cookie.
  let res;
  try {
    res = await fetch(`${API}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
  } catch (e) {
    // network error while calling /api/sync; try /api/contacts as a fallback
  }

  if (!res || !res.ok) {
    // Try /api/contacts with a harmless minimal payload so server can just return 200
    const res2 = await fetch(`${API}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ since: 0, push: [] })
    });
    const data2 = await asJSON(res2);
    if (!res2.ok) {
      throw new Error(data2.error || `sync failed (${res2.status})`);
    }
    return {
      ok: true,
      pushed: 0,
      pulled: Array.isArray(data2.pull) ? data2.pull.length : 0
    };
  }

  const data = await asJSON(res);
  if (!res.ok) throw new Error(data.error || `sync failed (${res.status})`);

  // normalize return so your UI can show something sensible
  return {
    ok: true,
    pushed: Number(data.pushed || 0),
    pulled: Number(data.pulled || 0)
  };
}


