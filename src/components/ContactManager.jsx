// src/components/ContactManager.jsx
import React, { useEffect, useRef, useState } from 'react';
import { getContacts, addContact, updateContact, deleteContact } from '../utils/db';

export default function ContactManager() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    const all = await getContacts();
    // sort by name for nicer display
    all.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    setContacts(all);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const clearForm = () => setForm({ name: '', phone: '', email: '', address: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await addContact({ ...form });
    clearForm();
    refresh();
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    await updateContact(editingId, { ...form });
    setEditingId(null);
    clearForm();
    refresh();
  };

  const handleDelete = async (id) => {
    await deleteContact(id);
    refresh();
  };

  // --- Export / Import ---
  const exportContacts = async () => {
    const list = await getContacts();
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: 'contacts-backup.json',
    });
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importContacts = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid file format');

      // insert without reusing ids to avoid collisions
      for (const c of data) {
        const { id, ...rest } = c || {};
        if (rest && (rest.name || rest.email || rest.phone || rest.address)) {
          await addContact(rest);
        }
      }
      await refresh();
      e.target.value = '';
      alert('Imported contacts successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to import. Please select a valid JSON backup.');
    }
  };

  return (
    <section>
      <form className="card" onSubmit={editingId ? handleUpdate : handleAdd} aria-label="Contact form">
        <div className="grid">
          <div className="field">
            <label htmlFor="name">Name *</label>
            <input id="name" name="name" value={form.name} onChange={onChange} placeholder="Jane Doe" required />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" value={form.phone} onChange={onChange} placeholder="(555) 123-4567" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={onChange} placeholder="jane@example.com" />
          </div>
          <div className="field field-wide">
            <label htmlFor="address">Address</label>
            <input id="address" name="address" value={form.address} onChange={onChange} placeholder="123 Main St, City, ST" />
          </div>
        </div>

        <div className="row gap">
          <button className="btn primary" type="submit">
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button type="button" className="btn" onClick={() => { setEditingId(null); clearForm(); }}>
              Cancel
            </button>
          )}
          <div className="spacer" />
          <button type="button" className="btn" onClick={exportContacts}>Export</button>
          <button
            type="button"
            className="btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Import contacts from JSON file"
          >
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={importContacts}
            style={{ display: 'none' }}
          />
        </div>
      </form>

      <ul className="list" aria-label="Contacts list">
        {contacts.map((row) => (
          <li key={row.id} className="list-row">
            <div className="who">
              <div className="name">{row.name}</div>
              <div className="muted small">{row.email || '—'} · {row.phone || '—'}</div>
              <div className="muted small">{row.address || ''}</div>
            </div>
            <div className="row gap">
              <button className="btn" onClick={() => startEdit(row)} aria-label={`Edit ${row.name}`}>Edit</button>
              <button className="btn danger" onClick={() => handleDelete(row.id)} aria-label={`Delete ${row.name}`}>Delete</button>
            </div>
          </li>
        ))}
        {contacts.length === 0 && (
          <li className="empty">No contacts yet. Add your first one above.</li>
        )}
      </ul>
    </section>
  );
}
