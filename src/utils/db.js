// src/utils/db.js
import { openDB } from 'idb';

const DB_NAME = 'contactManagerDB';
const STORE_NAME = 'contacts';

export const initDB = async () =>
  openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });

export const getContacts = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

export const addContact = async (contact) => {
  const db = await initDB();
  await db.add(STORE_NAME, contact);
};

export const updateContact = async (id, patch) => {
  const db = await initDB();
  const existing = await db.get(STORE_NAME, id);
  if (!existing) return;
  await db.put(STORE_NAME, { ...existing, ...patch, id });
};

export const deleteContact = async (id) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};

export const clearContacts = async () => {
  const db = await initDB();
  await db.clear(STORE_NAME);
};


