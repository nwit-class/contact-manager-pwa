// src/components/ContactManager.jsx
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { getContacts, addContact, updateContact, deleteContact } from '../utils/db';
import { useToast } from '../App';

function toCSV(rows, columns) {
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.join(',');
  const body = rows.map((r) => columns.map((c) => esc(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}

function parseCSV(text) {
  const rows = [];
  let i = 0, field = '', inQuotes = false, row = [];
  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { rows.push(row); row = []; };
  while (i < text.length) {
    const ch = text[i++];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') pushField();
      else if (ch === '\n') { pushField(); pushRow(); }
      else if (ch === '\r') {}
      else field += ch;
    }
  }
  pushField();
  if (row.length > 1 || row[0] !== '') pushRow();
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => (h || '').trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => { if (h) obj[h.toLowerCase()] = r[idx] ?? ''; });
    return obj;
  });
}

export default function ContactManager() {
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const jsonInputRef = useRef(null);
  const csvInputRef = useRef(null);

  useEffect(() => { refresh(); }, []);
  const refresh = async () => {
    const all = await getContacts();
    all.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    setContacts(all);
  };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const clearForm = () => setForm({ name: '', phone: '', email: '', address: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast('Name is required', 'warn'); return; }
    await addContact({ ...form });
    clearForm(); toast('Contact added', 'success'); refresh();
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name || '', phone: row.phone || '', email: row.email || '', address: row.address || '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    await updateContact(editingId, { ...form });
    setEditingId(null); clearForm(); toast('Contact updated', 'success'); refresh();
  };

  const handleDelete = async (id) => { await deleteContact(id); toast('Contact deleted', 'success'); refresh(); };

  // JSON
  const exportJSON = async () => {
    const list = await getContacts();
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'contacts-backup.json' });
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast('Exported JSON', 'info');
  };
  const importJSON = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('Invalid JSON');
      for (const c of data) {
        const { id, ...rest } = c || {};
        if (rest.name || rest.email || rest.phone || rest.address) await addContact(rest);
      }
      await refresh(); e.target.value = ''; toast('Imported JSON', 'success');
    } catch { toast('Failed to import JSON', 'error'); }
  };

  // CSV
  const exportCSV = async () => {
    const list = await getContacts();
    const cols = ['name', 'phone', 'email', 'address'];
    const csv = toCSV(list, cols);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'contacts.csv' });
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast('Exported CSV', 'info');
  };
  const importCSV = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      let count = 0;
      for (const r of rows) {
        const rest = { name: r.name || r.fullname || r.fn || '', phone: r.phone || r.tel || '', email: r.email || '', address: r.address || r.adr || '' };
        if (rest.name || rest.email || rest.phone || rest.address) { await addContact(rest); count++; }
      }
      await refresh(); e.target.value = ''; toast(`Imported ${count} from CSV`, 'success');
    } catch { toast('Failed to import CSV', 'error'); }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const hay = `${c.name || ''} ${c.email || ''} ${c.phone || ''} ${c.address || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [contacts, query]);

  function makeVCard(c) {
    const lines = [
      'BEGIN:VCARD', 'VERSION:3.0', `FN:${c.name || ''}`,
      c.phone ? `TEL;TYPE=CELL:${c.phone}` : '',
      c.email ? `EMAIL;TYPE=INTERNET:${c.email}` : '',
      c.address ? `ADR;TYPE=HOME:;;${String(c.address).replace(/,/g, '\\,')}` : '',
      'END:VCARD',
    ].filter(Boolean);
    return lines.join('\r\n');
  }
  async function shareVCard(c) {
    const vcf = makeVCard(c);
    const blob = new Blob([vcf], { type: 'text/vcard' });
    const file = new File([blob], `${(c.name || 'contact').replace(/\s+/g, '_')}.vcf`, { type: 'text/vcard' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: c.name || 'Contact', text: 'Contact card' }); return; }
      catch {}
    }
    const url = URL.createObjectURL(file);
    const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  return (
    <section>
      <div className="card">
        <div className="row gap" style={{ alignItems: 'stretch', flexWrap: 'wrap' }}>
          <input id="search" name="search" value={query} onChange={(e) => setQuery(e.target.value)}
                 placeholder="Search contacts…" aria-label="Search contacts"
                 style={{ flex: 1, minWidth: 220 }} />
          <button type="button" className="btn" onClick={exportJSON}>Export JSON</button>
          <button type="button" className="btn" onClick={() => jsonInputRef.current?.click()}>Import JSON</button>
          <input ref={jsonInputRef} type="file" accept="application/json" onChange={importJSON} style={{ display: 'none' }} />
          <button type="button" className="btn" onClick={exportCSV}>Export CSV</button>
          <button type="button" className="btn" onClick={() => csvInputRef.current?.click()}>Import CSV</button>
          <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={importCSV} style={{ display: 'none' }} />
        </div>
      </div>

      <form className="card" onSubmit={editingId ? handleUpdate : handleAdd} aria-label="Contact form">
        <div className="grid">
          <div className="field"><label htmlFor="name">Name *</label>
            <input id="name" name="name" value={form.name} onChange={onChange} placeholder="Jane Doe" required />
          </div>
          <div className="field"><label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" value={form.phone} onChange={onChange} placeholder="(555) 123-4567" />
          </div>
          <div className="field"><label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={onChange} placeholder="jane@example.com" />
          </div>
          <div className="field field-wide"><label htmlFor="address">Address</label>
            <input id="address" name="address" value={form.address} onChange={onChange} placeholder="123 Main St, City, ST" />
          </div>
        </div>
        <div className="row gap">
          <button className="btn primary" type="submit">{editingId ? 'Update' : 'Add'}</button>
          {editingId && <button type="button" className="btn" onClick={() => { setEditingId(null); clearForm(); }}>Cancel</button>}
        </div>
      </form>

      <ul className="list" aria-label="Contacts list">
        {filtered.map((row) => (
          <li key={row.id} className="list-row">
            <div className="who">
              <div className="name">{row.name}</div>
              <div className="muted small">{row.email || '—'} · {row.phone || '—'}</div>
              <div className="muted small">{row.address || ''}</div>
            </div>
            <div className="row gap">
              <button className="btn" onClick={() => shareVCard(row)}>Share</button>
              <button className="btn" onClick={() => startEdit(row)}>Edit</button>
              <button className="btn danger" onClick={() => handleDelete(row.id)}>Delete</button>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="empty">{query ? 'No contacts match your search.' : 'No contacts yet. Add your first one above.'}</li>
        )}
      </ul>
    </section>
  );
}
