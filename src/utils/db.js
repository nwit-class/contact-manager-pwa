// src/utils/db.js
import { openDB } from 'idb';

const DB_NAME = 'contactManagerDB';
const STORE_NAME = 'contacts';

/**
 * v2 schema adds: uuid (string), updatedAt (number), deletedAt (number|null), dirty (boolean)
 */
export const initDB = async () => {
  return openDB(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_uuid', 'uuid', { unique: false });
        store.createIndex('by_updatedAt', 'updatedAt', { unique: false });
        store.createIndex('by_deletedAt', 'deletedAt', { unique: false });
        store.createIndex('by_dirty', 'dirty', { unique: false });
      }
      if (oldVersion === 1) {
        const store = db.transaction.objectStore(STORE_NAME);
        store.createIndex('by_uuid', 'uuid', { unique: false });
        store.createIndex('by_updatedAt', 'updatedAt', { unique: false });
        store.createIndex('by_deletedAt', 'deletedAt', { unique: false });
        store.createIndex('by_dirty', 'dirty', { unique: false });
      }
    }
  });
};

// Helpers
const newUUID = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export const getAllContacts = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const getDirtyContacts = async () => {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'by_dirty', true);
};

export const upsertContact = async (partial) => {
  const db = await initDB();
  const now = Date.now();
  const record = {
    id: partial.id ?? undefined,
    uuid: partial.uuid || newUUID(),
    name: partial.name || '',
    email: partial.email || '',
    phone: partial.phone || '',
    address: partial.address || '',
    tags: Array.isArray(partial.tags) ? partial.tags : [],
    notes: partial.notes || '',
    favorite: !!partial.favorite,
    createdAt: partial.createdAt ?? now,
    updatedAt: now,            // bump on any local change
    deletedAt: partial.deletedAt ?? null,
    dirty: true                // mark dirty so sync will push
  };
  if (record.id) {
    await db.put(STORE_NAME, record);
    return record;
  } else {
    const id = await db.add(STORE_NAME, record);
    record.id = id;
    return record;
  }
};

export const markDeleted = async (idOrUuid) => {
  const db = await initDB();
  // Try by id first
  let rec = await db.get(STORE_NAME, idOrUuid);
  if (!rec) {
    // Try by uuid index
    const idx = db.transaction(STORE_NAME).store.index('by_uuid');
    rec = await idx.get(idOrUuid);
  }
  if (!rec) return;
  rec.deletedAt = Date.now();
  rec.updatedAt = rec.deletedAt;
  rec.dirty = true;
  await db.put(STORE_NAME, rec);
};

export const hardDeleteByUuid = async (uuid) => {
  const db = await initDB();
  const idx = db.transaction(STORE_NAME).store.index('by_uuid');
  const rec = await idx.get(uuid);
  if (rec) await db.delete(STORE_NAME, rec.id);
};

export const clearDirty = async (uuids) => {
  if (!uuids || uuids.length === 0) return;
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const idx = tx.store.index('by_uuid');
  for (const u of uuids) {
    const rec = await idx.get(u);
    if (!rec) continue;
    rec.dirty = false;
    await tx.store.put(rec);
  }
  await tx.done;
};

export const applyPulled = async (pulled = []) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const idx = tx.store.index('by_uuid');

  for (const r of pulled) {
    const existing = await idx.get(r.uuid);
    if (!existing) {
      // New from server
      const toPut = { ...r, dirty: false, id: undefined };
      await tx.store.add(toPut);
    } else {
      // Conflict: latest updatedAt wins
      if ((r.updatedAt || 0) >= (existing.updatedAt || 0)) {
        const toPut = { ...existing, ...r, dirty: false };
        await tx.store.put(toPut);
      }
    }
    // If server says deleted and we have it, we can hard-delete to keep store tidy
    if (r.deletedAt) {
      const local = await idx.get(r.uuid);
      if (local) await tx.store.delete(local.id);
    }
  }
  await tx.done;
};
