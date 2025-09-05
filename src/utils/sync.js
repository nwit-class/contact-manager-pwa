// src/utils/sync.js
const PAGES = 'https://contact-manager-pwa-ab6.pages.dev';
export const API =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? `${PAGES}/api`
    : '/api';

async function j(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { error: text || res.statusText }; }
}

export async function register(username, password) {
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',              // <-- send/receive cookies
    body: JSON.stringify({ username, password })
  });
  const data = await j(res);
  if (!res.ok) throw new Error(data.error || 'register-failed');
  return data;
}

export async function login(username, password) {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',              // <-- send/receive cookies
    body: JSON.stringify({ username, password })
  });
  const data = await j(res);
  if (!res.ok) throw new Error(data.error || 'login-failed');
  return data;
}

export async function logout() {
  const res = await fetch(`${API}/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('logout-failed');
  return { ok: true };
}
