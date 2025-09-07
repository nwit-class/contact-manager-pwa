// src/utils/sync.js
const PAGES = 'https://00415912.contact-manager-pwa-ab6.pages.dev';

export const API =
  (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'))
    ? `${PAGES}/api`
    : '/api';

async function asJSON(res) {
  const t = await res.text();
  try { return JSON.parse(t); } catch { return { error: t || res.statusText }; }
}

function assertCreds(id, pw) {
  if (!id || !pw) throw new Error('email/username and password required');
}

export async function register(emailOrUsername, password) {
  assertCreds(emailOrUsername, password);
  const body = { email: emailOrUsername, username: emailOrUsername, password };
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await asJSON(res);
  if (!res.ok) throw new Error(data.error || `register failed (${res.status})`);
  return data;
}

export async function login(emailOrUsername, password) {
  assertCreds(emailOrUsername, password);
  const body = { email: emailOrUsername, username: emailOrUsername, password };
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await asJSON(res);
  if (!res.ok) throw new Error(data.error || `login failed (${res.status})`);
  return data;
}

export async function logout() {
  const res = await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' });
  const data = await asJSON(res);
  if (!res.ok) throw new Error(data.error || `logout failed (${res.status})`);
  return data;
}

export async function syncNow() {
  const res = await fetch(`${API}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await asJSON(res);
  if (!res.ok) throw new Error(data.error || `sync failed (${res.status})`);
  return { ok: true, pushed: Number(data.pushed || 0), pulled: Number(data.pulled || 0) };
}

