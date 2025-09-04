
// functions/api/contacts.js
import { getSessionUser, unauthorized, json, badRequest } from '../_lib.js';

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(env, request);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const since = Number(body.since || 0);
  const push = Array.isArray(body.push) ? body.push : [];

  // Upsert pushed contacts (LWW by updatedAt)
  for (const c of push) {
    if (!c.uuid) continue;
    const fav = c.favorite ? 1 : 0;
    const tagsStr = JSON.stringify(c.tags || []);
    const created = Number(c.createdAt || Date.now());
    const updated = Number(c.updatedAt || created);
    const deleted = c.deletedAt ? Number(c.deletedAt) : null;

    const existing = await env.DB
      .prepare('SELECT updated_at FROM contacts WHERE user_id = ? AND uuid = ?')
      .bind(user.id, c.uuid).first();

    if (!existing) {
      await env.DB.prepare(
        `INSERT INTO contacts
         (user_id, uuid, name, email, phone, address, tags, notes, favorite, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(user.id, c.uuid, c.name||null, c.email||null, c.phone||null, c.address||null,
             tagsStr, c.notes||null, fav, created, updated, deleted).run();
    } else {
      if (updated >= Number(existing.updated_at || 0)) {
        await env.DB.prepare(
          `UPDATE contacts SET
           name=?, email=?, phone=?, address=?, tags=?, notes=?, favorite=?, updated_at=?, deleted_at=?
           WHERE user_id=? AND uuid=?`
        ).bind(c.name||null, c.email||null, c.phone||null, c.address||null, tagsStr, c.notes||null,
               fav, updated, deleted, user.id, c.uuid).run();
      }
    }
  }

  // Pull changes since `since`
  const rows = await env.DB.prepare(
    `SELECT uuid, name, email, phone, address, tags, notes, favorite, created_at, updated_at, deleted_at
     FROM contacts
     WHERE user_id = ? AND (updated_at > ? OR deleted_at > ?)`
  ).bind(user.id, since, since).all();

  const pull = (rows.results || []).map(r => ({
    uuid: r.uuid,
    name: r.name || '',
    email: r.email || '',
    phone: r.phone || '',
    address: r.address || '',
    tags: safeJSON(r.tags) || [],
    notes: r.notes || '',
    favorite: !!r.favorite,
    createdAt: Number(r.created_at || 0),
    updatedAt: Number(r.updated_at || 0),
    deletedAt: r.deleted_at ? Number(r.deleted_at) : null,
  }));

  return json({ pull, now: Date.now() });
}

function safeJSON(s){ try{ return JSON.parse(s||'[]'); }catch{ return []; } }
