// src/utils/sync.js
import { initDB, getContacts, addContact } from './db';

// src/utils/sync.js (top of file)
const PAGES = 'https://contact-manager-pwa-ab6.pages.dev';
export const API =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? `${PAGES}/api`
    : '/api';


const lastKey = 'lastSyncAt';
const getLast = () => Number(localStorage.getItem(lastKey) || '0');
const setLast = (t) => localStorage.setItem(lastKey, String(t));

async function j(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const register = (email, password) => j(`${API}/register`, { email, password });
export const login = (email, password) => j(`${API}/login`, { email, password });
export const logout = () => j(`${API}/logout`, {});

export async function syncNow() {
  // Ensure each record has a uuid before syncing
  const db = await initDB();
  const all = await getContacts();

  for (const c of all) {
    if (!c.uuid) {
      c.uuid = crypto.randomUUID();
      c.updatedAt = Date.now();
      await db.put('contacts', c);
    }
  }

  const since = getLast();
  const changes = all.filter(
    (c) => Math.max(c.updatedAt || 0, c.createdAt || 0, c.deletedAt || 0) > since
  );

  const out = await j(`${API}/contacts`, {
    since,
    push: changes.map((c) => ({
      uuid: c.uuid,
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      tags: c.tags || [],
      notes: c.notes || '',
      favorite: !!c.favorite,
      createdAt: c.createdAt || 0,
      updatedAt: c.updatedAt || 0,
      deletedAt: c.deletedAt || null,
    })),
  });

  const pull = Array.isArray(out.pull) ? out.pull : [];
  for (const s of pull) {
    const idx = all.findIndex((c) => c.uuid === s.uuid);
    if (idx === -1) {
      // new to local
      await addContact({ ...s });
      const db2 = await initDB();
      const list = await db2.getAll('contacts');
      const newly = list.find((c) => c.uuid === s.uuid);
      if (newly) {
        newly.createdAt = s.createdAt;
        newly.updatedAt = s.updatedAt;
        newly.deletedAt = s.deletedAt || null;
        await db2.put('contacts', newly);
      }
    } else {
      // conflict resolution: last-write-wins
      const local = all[idx];
      if ((s.updatedAt || 0) >= (local.updatedAt || 0)) {
        const db2 = await initDB();
        await db2.put('contacts', { ...local, ...s, id: local.id });
      }
    }
  }

  setLast(Number(out.now || Date.now()));
  return { pushed: changes.length, pulled: pull.length };
}
