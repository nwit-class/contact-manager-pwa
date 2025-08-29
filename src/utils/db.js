// src/utils/db.js
import { openDB } from 'idb';

const DB_NAME = 'contactManagerDB';
const STORE_NAME = 'contacts';

// v4: add index on deletedAt (for Trash)
export const initDB = async () =>
  openDB(DB_NAME, 4, {
    upgrade(db, oldVersion, _newVersion, tx) {
      let store;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      } else {
        store = tx.objectStore(STORE_NAME);
      }
      // create index for deletedAt if missing
      if (!store.indexNames.contains('by_deletedAt')) {
        store.createIndex('by_deletedAt', 'deletedAt');
      }
    },
  });

export const addContact = async (contact) => {
  const db = await initDB();
  const normalized = {
    favorite: false,
    tags: [],
    notes: '',
    deletedAt: null,
    createdAt: Date.now(),
    ...contact,
  };
  await db.add(STORE_NAME, normalized);
};

export const updateContact = async (id, partial) => {
  const db = await initDB();
  const existing = await db.get(STORE_NAME, id);
  if (!existing) return;
  await db.put(STORE_NAME, { ...existing, ...partial, id });
};

export const getContacts = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

// Active = not soft-deleted
export const getActiveContacts = async () => {
  const all = await getContacts();
  return all.filter((c) => !c.deletedAt);
};

// Deleted = in Trash
export const getDeletedContacts = async () => {
  const db = await initDB();
  // If you want to use the index:
  // return db.getAllFromIndex(STORE_NAME, 'by_deletedAt', IDBKeyRange.lowerBound(1));
  const all = await db.getAll(STORE_NAME);
  return all.filter((c) => !!c.deletedAt);
};

// Soft delete: mark as deleted, keep data for undo/restore
export const softDeleteContact = async (id) => {
  await updateContact(id, { deletedAt: Date.now() });
};

// Restore from trash
export const restoreContact = async (id) => {
  await updateContact(id, { deletedAt: null });
};

// Hard delete: remove from DB permanently
export const hardDeleteContact = async (id) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};

// Empty entire trash
export const emptyTrash = async () => {
  const deleted = await getDeletedContacts();
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const c of deleted) {
    await tx.store.delete(c.id);
  }
  await tx.done;
};
