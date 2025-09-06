// src/utils/sync.js
import { getDirtyContacts, clearDirty, applyPulled } from './db';

// Decide API base: local dev points to your Pages domain, prod uses same origin
const PAGES = 'https://contact-manager-pwa-ab6.pages.dev';
export const API =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? `${PAGES}/api`
    : '/api';

// ------- helpers -------
async function asJSON(res) {
  const t = await res.text();
  try { return JSON.parse(t); } catch { return { error: t || res.statusText }; }
}

const LS_KEY = 'lastSyncMs';
function getLastSync() {
  const n = Number(localStorage.getItem(LS_KEY) || '0');
  return Number.isFinite(n) ? n : 0;
}
function setLastSync(ms) { localStorage.setItem(LS_KEY, String(ms)); }

// ------- AUTH (named exports used by AuthBar.jsx) -------
export async function register(username, password) {
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  const data = await asJSON(res);
  if (!res.ok) throw new Error(data.error || 'register-failed');
  return data;
}

export async function login(username, password) {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  const data = await asJSON(res);
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

// ------- SYNC (push/pull) -------
export async function syncNow() {
  const since = getLastSync();
  const push = await getDirtyContacts();

  const res = await fetch(`${API}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      since,
      push: push.map(c => ({
        uuid: c.uuid,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        tags: c.tags,
        notes: c.notes,
        favorite: !!c.favorite,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        deletedAt: c.deletedAt || null
      }))
    })
  });

  const data = await asJSON(res);
  if (!res.ok) throw new Error(data.error || 'sync-failed');

  await clearDirty(push.map(p => p.uuid));
  await applyPulled(data.pull || []);
  if (typeof data.now === 'number') setLastSync(data.now);

  return { pushed: push.length, pulled: (data.pull || []).length };
}
