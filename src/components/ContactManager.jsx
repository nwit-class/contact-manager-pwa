// src/components/ContactManager.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  clearContacts,
} from "../utils/db";

/* ---------------- vCard helpers ---------------- */
function buildVCard(c) {
  const safe = (s = "") => String(s).replace(/\r?\n/g, "\\n");
  const now = new Date().toISOString();
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${safe(c.name)};;;;`,
    `FN:${safe(c.name)}`,
    c.email ? `EMAIL;TYPE=INTERNET:${safe(c.email)}` : null,
    c.phone ? `TEL;TYPE=CELL:${safe(c.phone)}` : null,
    c.address ? `ADR;TYPE=HOME:;;${safe(c.address)};;;;` : null,
    `REV:${now}`,
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\r\n");
}

async function shareVCard(contact, notify) {
  try {
    const vcfText = buildVCard(contact);
    const fileName = `${(contact.name || "contact").replace(/[^\w.-]+/g, "_")}.vcf`;
    const blob = new Blob([vcfText], { type: "text/vcard;charset=utf-8" });
    const file = new File([blob], fileName, { type: "text/vcard" });

    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({ title: contact.name || "Contact", files: [file] });
      notify?.("Shared 📤");
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);

    try { await navigator.clipboard?.writeText(vcfText); notify?.("Downloaded & copied 📋"); }
    catch { notify?.("Downloaded .vcf ✅"); }
  } catch (e) {
    console.error(e);
    alert("Unable to share contact.");
  }
}

/* ------------- Export all as .vcf ------------- */
function buildAllVcf(contacts) {
  return contacts.map(buildVCard).join("\r\n");
}
async function exportAllVcf(contacts, notify) {
  if (!contacts.length) { notify?.("No contacts to export"); return; }
  const allVcf = buildAllVcf(contacts);
  const stamp = new Date().toISOString().slice(0,10).replace(/-/g, "");
  const fileName = `contacts-${stamp}.vcf`;
  const blob = new Blob([allVcf], { type: "text/vcard;charset=utf-8" });
  const file = new File([blob], fileName, { type: "text/vcard" });

  try {
    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({ title: "All Contacts", files: [file] });
      notify?.("Shared all contacts 📤");
      return;
    }
  } catch { /* fall through */ }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  notify?.("Exported contacts.vcf ✅");
}

/* ------------- CSV helpers ------------- */
const q = (s = "") => `"${String(s).replace(/"/g, '""')}"`;
function toCsv(contacts) {
  const headers = ["name","email","phone","address"];
  const rows = contacts.map(c => [c.name||"", c.email||"", c.phone||"", c.address||""]);
  const lines = [headers.join(","), ...rows.map(r => r.map(q).join(","))];
  return lines.join("\r\n");
}
function downloadCsv(contacts, notify) {
  if (!contacts.length) { notify?.("No contacts to export"); return; }
  const csv = toCsv(contacts);
  const stamp = new Date().toISOString().slice(0,10).replace(/-/g, "");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `contacts-${stamp}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  notify?.("Exported CSV ✅");
}

// Minimal CSV parser (quotes + commas in quotes)
function parseCsv(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter(l => l.trim().length);
  if (!lines.length) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i=0; i<line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === `"`) {
          if (line[i+1] === `"`) { cur += `"`; i++; }
          else inQuotes = false;
        } else cur += ch;
      } else {
        if (ch === `,`) { out.push(cur); cur = ""; }
        else if (ch === `"`) inQuotes = true;
        else cur += ch;
      }
    }
    out.push(cur);
    return out;
  };

  const headers = parseLine(lines[0]).map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).map(line => parseLine(line));
  return { headers, rows };
}
function normalizeRow(headers, row) {
  const idx = (k) => headers.indexOf(k);
  const get = (k) => {
    const i = idx(k);
    return i >= 0 ? row[i] ?? "" : "";
  };
  return {
    name: get("name"),
    email: get("email"),
    phone: get("phone"),
    address: get("address"),
  };
}

/* ---------------- Component ---------------- */
export default function ContactManager() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const notify = (msg) => { setMessage(msg); setTimeout(() => setMessage(""), 2000); };

  // Load from IndexedDB on mount
  useEffect(() => {
    (async () => {
      await refreshContacts();
      setLoading(false);
    })();
  }, []);

  const refreshContacts = async () => {
    const all = await getContacts();
    setContacts(all);
  };

  // Create / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingId) {
      await updateContact(editingId, form);
      notify("Contact updated ✅");
    } else {
      await addContact(form);
      notify("Contact added ✅");
    }
    setForm({ name: "", email: "", phone: "", address: "" });
    setEditingId(null);
    await refreshContacts();
  };

  // Delete single
  const handleDelete = async (id) => {
    await deleteContact(id);
    notify("Contact deleted 🗑️");
    await refreshContacts();
  };

  // Clear all
  const handleClearAll = async () => {
    if (!contacts.length) return;
    if (!confirm("Delete all contacts?")) return;
    await clearContacts();
    notify("All contacts cleared");
    await refreshContacts();
  };

  const startEdit = (c) => {
    setForm({
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
    });
    setEditingId(c.id);
  };

  // CSV import
  const triggerImport = () => fileInputRef.current?.click();
  const onImportFiles = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { headers, rows } = parseCsv(text);
      if (!headers.length) { notify("CSV has no header"); return; }

      // dedupe keys from existing contacts
      const existing = await getContacts();
      const keyOf = (c) =>
        [c.name?.trim().toLowerCase(), c.email?.trim().toLowerCase(), c.phone?.trim()].join("|");
      const seen = new Set(existing.map(keyOf));

      let added = 0;
      for (const r of rows) {
        const rec = normalizeRow(headers, r);
        if (!(rec.name || rec.email || rec.phone || rec.address)) continue;
        const key = keyOf(rec);
        if (seen.has(key)) continue;
        await addContact(rec); // persist each
        seen.add(key);
        added++;
      }
      notify(added ? `Imported ${added} contact(s) ✅` : "Nothing new to import");
      await refreshContacts();
    } catch (err) {
      console.error(err);
      alert("Failed to import CSV. Make sure headers include: name,email,phone,address");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">📒 Contact Manager</h1>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-2 rounded-lg border" onClick={triggerImport} title="Import CSV with headers: name,email,phone,address">
            Import CSV
         <button
  type="button"
  onClick={() => {
    const root = document.documentElement;
    const next = root.classList.toggle('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', next);
  }}
  className="px-3 py-2 rounded-lg border text-sm"
  title="Toggle dark mode"
>
  Toggle Dark
</button>

	 </button>
          <button className="px-3 py-2 rounded-lg border" onClick={() => downloadCsv(contacts, notify)}>
            Export CSV
          </button>
          <button className="px-3 py-2 rounded-lg border text-blue-600 hover:bg-blue-50" onClick={() => exportAllVcf(contacts, notify)} title="Export all contacts to a single .vcf">
            Export All (.vcf)
          </button>
          <button className="px-3 py-2 rounded-lg border text-red-600" onClick={handleClearAll} disabled={!contacts.length}>
            Clear All
          </button>
          <input type="file" ref={fileInputRef} accept=".csv,text/csv" className="hidden" onChange={onImportFiles} />
        </div>
      </div>

      {message && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="border rounded p-2 sm:col-span-2 lg:col-span-1"
          placeholder="Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          name="name"
          id="name"
          autoComplete="name"
        />
        <input
          className="border rounded p-2 sm:col-span-2 lg:col-span-1"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          type="email"
          name="email"
          id="email"
          autoComplete="email"
        />
        <input
          className="border rounded p-2 sm:col-span-2 lg:col-span-1"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          type="tel"
          name="phone"
          id="phone"
          autoComplete="tel"
        />
        <input
          className="border rounded p-2 sm:col-span-2 lg:col-span-1"
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          name="address"
          id="address"
          autoComplete="street-address"
        />
        <button type="submit" className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700 sm:col-span-2 lg:col-span-4">
          {editingId ? "Update" : "Add"} Contact
        </button>
      </form>

      {/* Loading */}
      {loading && <div className="text-slate-500">Loading…</div>}

      {/* Table (desktop) */}
      {!loading && (
        <div className="hidden md:block">
          <table className="w-full border-collapse border rounded">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Phone</th>
                <th className="border p-2 text-left">Address</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((row) => (
                <tr key={row.id}>
                  <td className="border p-2">{row.name}</td>
                  <td className="border p-2">{row.email}</td>
                  <td className="border p-2">{row.phone}</td>
                  <td className="border p-2">{row.address}</td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded-lg border hover:bg-slate-50" onClick={() => startEdit(row)}>
                        Edit
                      </button>
                      <button className="px-3 py-1 rounded-lg border text-blue-600 hover:bg-blue-50" onClick={() => shareVCard(row, notify)}>
                        Share
                      </button>
                      <button className="px-3 py-1 rounded-lg border text-red-600 hover:bg-red-50" onClick={() => handleDelete(row.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!contacts.length && (
                <tr><td className="p-4 text-slate-500" colSpan="5">No contacts yet. Add one above!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards (mobile) */}
      {!loading && (
        <div className="grid gap-4 md:hidden">
          {contacts.map((row) => (
            <div key={row.id} className="p-4 border rounded-lg shadow-sm">
              <h2 className="font-semibold">{row.name}</h2>
              {row.email && <p>{row.email}</p>}
              {row.phone && <p>{row.phone}</p>}
              {row.address && <p>{row.address}</p>}
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-2 rounded-lg border" onClick={() => startEdit(row)}>Edit</button>
                <button className="px-3 py-2 rounded-lg border text-blue-600" onClick={() => shareVCard(row, notify)}>Share</button>
                <button className="px-3 py-2 rounded-lg border text-red-600" onClick={() => handleDelete(row.id)}>Delete</button>
              </div>
            </div>
          ))}
          {!contacts.length && (
            <div className="text-slate-500">No contacts yet. Add one above!</div>
          )}
        </div>
      )}
    </div>
  );
}
<div className="text-2xl font-bold text-blue-600 mb-2">Hello, Contacts!</div>
