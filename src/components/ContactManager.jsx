// src/components/ContactManager.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getActiveContacts,
  getDeletedContacts,
  addContact,
  updateContact,
  softDeleteContact,
  restoreContact,
  hardDeleteContact,
  emptyTrash,
} from '../utils/db';
import { useToast } from '../App';

/* ---------- CSV helpers ---------- */
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

/* ---------- vCard share ---------- */
function makeVCard(c) {
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${c.name || ''}`,
    c.phone ? `TEL;TYPE=CELL:${c.phone}` : '',
    c.email ? `EMAIL;TYPE=INTERNET:${c.email}` : '',
    c.address ? `ADR;TYPE=HOME:;;${String(c.address).replace(/,/g, '\\,')}` : '',
    'END:VCARD',
  ].filter(Boolean);
  return lines.join('\r\n');
}

export default function ContactManager() {
  const toast = useToast();

  // Data
  const [active, setActive] = useState([]);
  const [trash, setTrash] = useState([]);

  // Form + UI state
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '',
    tagsInput: '', notes: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name-asc'); // name-asc | name-desc | recent-desc
  const [showTrash, setShowTrash] = useState(false);

  const jsonInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const refresh = async () => {
    const [a, t] = await Promise.all([getActiveContacts(), getDeletedContacts()]);
    // ensure shapes from older records
    const norm = (r) => ({ favorite: false, tags: [], notes: '', ...r });
    setActive(a.map(norm));
    setTrash(t.map(norm));
  };

  useEffect(() => { refresh(); }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const clearForm = () => setForm({ name: '', phone: '', email: '', address: '', tagsInput: '', notes: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast('Name is required', 'warn'); return; }
    const tags = (form.tagsInput || '').split(',').map(t => t.trim()).filter(Boolean);
    await addContact({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      tags,
      notes: form.notes.trim(),
    });
    clearForm(); toast('Contact added', 'success'); refresh();
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
      tagsInput: (row.tags || []).join(', '),
      notes: row.notes || '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    const tags = (form.tagsInput || '').split(',').map(t => t.trim()).filter(Boolean);
    await updateContact(editingId, {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      tags,
      notes: form.notes.trim(),
    });
    setEditingId(null); clearForm(); toast('Contact updated', 'success'); refresh();
  };

  // Confirm + Undo (soft delete)
  const handleDelete = async (row) => {
    const ok = window.confirm(`Delete "${row.name || 'this contact'}"?\nIt will go to Trash and can be restored.`);
    if (!ok) return;
    await softDeleteContact(row.id);
    refresh();

    // Undo action (soft restore)
    const undo = async () => { await restoreContact(row.id); toast('Restored', 'success'); refresh(); };
    // If your useToast supports actions, great. If not, show a second button or just inform.
    toast('Moved to Trash. Undo?', 'info', { actionLabel: 'Undo', action: undo });
  };

  const handleRestore = async (row) => {
    await restoreContact(row.id);
    toast('Restored from Trash', 'success');
    refresh();
  };

  const handleHardDelete = async (row) => {
    const ok = window.confirm(`Permanently delete "${row.name || 'this contact'}"?\nThis cannot be undone.`);
    if (!ok) return;
    await hardDeleteContact(row.id);
    toast('Deleted permanently', 'success');
    refresh();
  };

  const handleEmptyTrash = async () => {
    if (trash.length === 0) { toast('Trash is already empty', 'info'); return; }
    const ok = window.confirm(`Empty Trash (${trash.length} contacts)? This cannot be undone.`);
    if (!ok) return;
    await emptyTrash();
    toast('Trash emptied', 'success');
    refresh();
  };

  const toggleFavorite = async (row) => {
    await updateContact(row.id, { favorite: !row.favorite });
    refresh();
  };

  /* ---------- Export / Import JSON ---------- */
  const exportJSON = async () => {
    const data = [...active, ...trash]; // full backup includes trash
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
        if (rest && (rest.name || rest.email || rest.phone || rest.address || rest.tags || rest.notes)) {
          await addContact(rest);
        }
      }
      await refresh(); e.target.value = ''; toast('Imported JSON', 'success');
    } catch { toast('Failed to import JSON', 'error'); }
  };

  /* ---------- Export / Import CSV ---------- */
  const exportCSV = async () => {
    const list = [...active, ...trash];
    const cols = ['name', 'phone', 'email', 'address', 'favorite', 'tags', 'notes', 'deletedAt'];
    const flattened = list.map((r) => ({
      ...r,
      tags: (r.tags || []).join('; ')
    }));
    const csv = toCSV(flattened, cols);
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
        const tags = (r.tags || r.tag || '')
          .split(/[,;]/)
          .map(t => t.trim())
          .filter(Boolean);
        const rest = {
          name: r.name || r.fullname || r.fn || '',
          phone: r.phone || r.tel || '',
          email: r.email || '',
          address: r.address || r.adr || '',
          favorite: String(r.favorite).toLowerCase() === 'true',
          notes: r.notes || '',
          tags
        };
        if (String(r.deletedat || '').trim()) {
          // If CSV row was marked deleted, keep it in active import but not deleted
          // (choose your policy; here we import as active)
        }
        if (rest.name || rest.email || rest.phone || rest.address || rest.notes || rest.tags?.length) {
          await addContact(rest);
          count++;
        }
      }
      await refresh(); e.target.value = ''; toast(`Imported ${count} from CSV`, 'success');
    } catch { toast('Failed to import CSV', 'error'); }
  };

  /* ---------- Share vCard ---------- */
  const shareVCard = async (c) => {
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
  };

  /* ---------- Search, filter, sort ---------- */
  const filteredActive = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = active;
    if (favoritesOnly) list = list.filter(c => c.favorite);
    if (q) {
      list = list.filter((c) => {
        const hay = [
          c.name, c.email, c.phone, c.address,
          (c.tags || []).join(' '), c.notes
        ].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    if (sortBy === 'name-asc') list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sortBy === 'name-desc') list = [...list].sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    if (sortBy === 'recent-desc') list = [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return list;
  }, [active, query, favoritesOnly, sortBy]);

  const filteredTrash = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = trash;
    if (q) {
      list = list.filter((c) => {
        const hay = [
          c.name, c.email, c.phone, c.address,
          (c.tags || []).join(' '), c.notes
        ].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    if (sortBy.startsWith('name-')) {
      const asc = sortBy === 'name-asc';
      list = [...list].sort((a, b) => (asc ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || '')));
    } else if (sortBy === 'recent-desc') {
      list = [...list].sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    }
    return list;
  }, [trash, query, sortBy]);

  const list = showTrash ? filteredTrash : filteredActive;

  return (
    <section>
      {/* Top bar */}
      <div className="card">
        <div className="row gap" style={{ alignItems: 'stretch', flexWrap: 'wrap' }}>
          <input
            id="search" name="search" value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${showTrash ? 'Trash' : 'Contacts'}…`}
            aria-label="Search contacts"
            style={{ flex: 1, minWidth: 260 }}
          />

          <select aria-label="Sort contacts" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="btn">
            <option value="name-asc">Sort: Name A→Z</option>
            <option value="name-desc">Sort: Name Z→A</option>
            <option value="recent-desc">Sort: Most recent</option>
          </select>

          {!showTrash && (
            <label className="btn" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
              Favorites
            </label>
          )}

          <button type="button" className={`btn ${showTrash ? '' : 'primary'}`} onClick={() => setShowTrash(false)}>
            Contacts
          </button>
          <button type="button" className={`btn ${showTrash ? 'primary' : ''}`} onClick={() => setShowTrash(true)}>
            Trash ({trash.length})
          </button>
          {showTrash && (
            <button type="button" className="btn danger" onClick={handleEmptyTrash}>Empty Trash</button>
          )}

          <button type="button" className="btn" onClick={exportJSON}>Export JSON</button>
          <button type="button" className="btn" onClick={() => jsonInputRef.current?.click()}>Import JSON</button>
          <input ref={jsonInputRef} type="file" accept="application/json" onChange={importJSON} style={{ display: 'none' }} />

          <button type="button" className="btn" onClick={exportCSV}>Export CSV</button>
          <button type="button" className="btn" onClick={() => csvInputRef.current?.click()}>Import CSV</button>
          <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={importCSV} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Form (hidden in Trash view) */}
      {!showTrash && (
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
            <div className="field">
              <label htmlFor="tagsInput">Tags</label>
              <input id="tagsInput" name="tagsInput" value={form.tagsInput} onChange={onChange} placeholder="family, work, vip" />
            </div>
            <div className="field field-wide">
              <label htmlFor="notes">Notes</label>
              <textarea id="notes" name="notes" value={form.notes} onChange={onChange} placeholder="Birthday, preferences, etc." rows={3} />
            </div>
          </div>

          <div className="row gap">
            <button className="btn primary" type="submit">{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button type="button" className="btn" onClick={() => { setEditingId(null); clearForm(); }}>Cancel</button>}
          </div>
        </form>
      )}

      {/* List */}
      <ul className="list" aria-label={showTrash ? 'Trash list' : 'Contacts list'}>
        {list.map((row) => (
          <li key={row.id} className="list-row">
            <div className="who">
              <div className="name">
                {!showTrash && (
                  <button
                    className={`star ${row.favorite ? 'on' : ''}`}
                    title={row.favorite ? 'Unfavorite' : 'Favorite'}
                    onClick={() => toggleFavorite(row)}
                    aria-label={row.favorite ? `Unfavorite ${row.name}` : `Favorite ${row.name}`}
                  >
                    ★
                  </button>
                )}
                {row.name}
              </div>
              <div className="muted small">{row.email || '—'} · {row.phone || '—'}</div>
              <div className="muted small">{row.address || ''}</div>
              {row.tags?.length > 0 && (
                <div className="tags">
                  {row.tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
                </div>
              )}
              {row.notes && <div className="muted small notes">{row.notes}</div>}
              {showTrash && row.deletedAt && (
                <div className="muted small">Deleted {new Date(row.deletedAt).toLocaleString()}</div>
              )}
            </div>

            <div className="row gap">
              {!showTrash && (
                <>
                  <button className="btn" onClick={() => shareVCard(row)}>Share</button>
                  <button className="btn" onClick={() => startEdit(row)}>Edit</button>
                  <button className="btn danger" onClick={() => handleDelete(row)}>Delete</button>
                </>
              )}
              {showTrash && (
                <>
                  <button className="btn" onClick={() => handleRestore(row)}>Restore</button>
                  <button className="btn danger" onClick={() => handleHardDelete(row)}>Delete forever</button>
                </>
              )}
            </div>
          </li>
        ))}
        {list.length === 0 && (
          <li className="empty">{showTrash ? 'Trash is empty.' : (query ? 'No contacts match your search.' : 'No contacts yet. Add your first one above.')}</li>
        )}
      </ul>
    </section>
  );
}
