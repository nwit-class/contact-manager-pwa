// src/components/ContactManager.jsx
import React, { useEffect, useState } from 'react';
import {
  getAllContacts,
  upsertContact,
  markDeleted
} from '../utils/db';
import { syncNow } from '../utils/sync';

export default function ContactManager() {
  const empty = { id: null, name: '', email: '', phone: '', address: '', notes: '', tags: [] };
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);
  async function load() {
    setContacts(await getAllContacts());
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function onSave() {
    setBusy(true);
    try {
      await upsertContact(form);
      setForm(empty);
      await load();
      setMsg('Saved locally (dirty). Click Sync now to push.');
    } finally {
      setBusy(false);
    }
  }

  async function onEdit(row) {
    setForm(row);
  }

  async function onDelete(row) {
    setBusy(true);
    try {
      await markDeleted(row.id ?? row.uuid);
      await load();
      setMsg('Marked deleted locally. Click Sync now to push.');
    } finally {
      setBusy(false);
    }
  }

  async function onSync() {
    setBusy(true);
    setMsg('Syncing…');
    try {
      const res = await syncNow();
      await load();
      setMsg(`Synced! Pushed ${res.pushed}, pulled ${res.pulled}.`);
    } catch (e) {
      setMsg('Sync failed: ' + (e?.message || 'unknown'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-semibold">Contact Manager</h1>
        <button
          className="px-3 py-2 rounded-lg border"
          onClick={onSync}
          disabled={busy}
          title="Push local changes and pull server updates"
        >
          {busy ? 'Syncing…' : 'Sync now'}
        </button>
      </div>

      {msg && <div className="mb-3 text-sm opacity-80">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <input className="border p-2 rounded" name="name"    placeholder="Name"    value={form.name}    onChange={onChange} />
        <input className="border p-2 rounded" name="email"   placeholder="Email"   value={form.email}   onChange={onChange} />
        <input className="border p-2 rounded" name="phone"   placeholder="Phone"   value={form.phone}   onChange={onChange} />
        <input className="border p-2 rounded" name="address" placeholder="Address" value={form.address} onChange={onChange} />
        <textarea className="border p-2 rounded md:col-span-2" name="notes" placeholder="Notes" value={form.notes} onChange={onChange} />
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-lg border" onClick={onSave} disabled={busy}>
            {form.id ? 'Update (local)' : 'Add (local)'}
          </button>
          <button className="px-3 py-2 rounded-lg border" onClick={() => setForm(empty)} disabled={busy}>
            Clear
          </button>
        </div>
      </div>

      <ul className="divide-y">
        {contacts.map(row => (
          <li key={row.id ?? row.uuid} className="py-2 flex items-center justify-between">
            <div>
              <div className="font-medium">{row.name || <em>(no name)</em>}</div>
              <div className="text-sm opacity-70">
                {[row.email, row.phone, row.address].filter(Boolean).join(' • ')}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded-lg border" onClick={() => onEdit(row)}>Edit</button>
              <button className="px-3 py-2 rounded-lg border text-red-600" onClick={() => onDelete(row)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
