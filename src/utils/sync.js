// src/utils/sync.js
import { getDirtyContacts, clearDirty, applyPulled } from './db';

const PAGES = 'https://contact-manager-pwa-ab6.pages.dev';
export const API =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? `${PAGES}/api`
    : '/api';

// keep last sync marker in localStorage
const LS_KEY = 'lastSyncMs';

function getLastSync() {
  const n = Number(localStorage.getItem(LS_KEY) || '0');
  return Number.isFinite(n) ? n : 0;
}
function setLastSync(ms) {
  localStorage.setItem(LS_KEY, String(ms));
}

async function asJSON(res) {
  const t = await res.text();
  try { return JSON.parse(t); } catch { return { error: t || res.statusText }; }
}

/** Push local dirty contacts, pull server changes since last sync. */
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

  // Clear dirty that we successfully pushed
  await clearDirty(push.map(p => p.uuid));

  // Apply server changes locally
  await applyPulled(data.pull || []);

  // Move the sync clock
  if (typeof data.now === 'number') setLastSync(data.now);

  return { pushed: push.length, pulled: (data.pull || []).length };
}
