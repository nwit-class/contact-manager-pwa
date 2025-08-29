// src/utils/db.js
import { openDB } from 'idb';

const DB_NAME = 'contactManagerDB';
const STORE_NAME = 'contacts';

// bump version to 3 (we'll store new fields: favorite, tags, notes)
// No breaking change: existing records keep working.
export const initDB = async () =>
  openDB(DB_NAME, 3, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      } else if (oldVersion < 2) {
        // v2 migration placeholder
      } else if (oldVersion < 3) {
        // v3: nothing structural to do; new fields are stored inline per record
      }
    },
  });

export const getContacts = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const addContact = async (contact) => {
  const db = await initDB();
  // ensure new fields exist for consistency
  const normalized = {
    favorite: false,
    tags: [],
    notes: '',
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

export const deleteContact = async (id) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};

