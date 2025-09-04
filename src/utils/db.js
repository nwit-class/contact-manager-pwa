// src/utils/db.js
import { openDB } from 'idb';

const DB_NAME = 'contactManagerDB';
const STORE_NAME = 'contacts';

export const initDB = async () =>
  openDB(DB_NAME, 5, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });

export const getContacts = async () => (await initDB()).getAll(STORE_NAME);

export const addContact = async (contact) => {
  const db = await initDB();
  const now = Date.now();
  await db.add(STORE_NAME, {
    uuid: contact.uuid || crypto.randomUUID(),
    favorite: false,
    tags: [],
    notes: '',
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    ...contact,
  });
};
