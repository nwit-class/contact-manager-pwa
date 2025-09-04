import { okJSON, errJSON, corsOptions, readCookie, getSession } from "./_common.js";

export function onRequestOptions({ request }) {
  return corsOptions(request);
}

export async function onRequestPost({ request, env }) {
  try {
    const token = readCookie(request, "session");
    const sess = await getSession(env.DB, token);
    if (!sess) return errJSON(request, 401, "unauthorized");

    const { since = 0, push = [] } = (await request.json().catch(() => ({}))) || {};
    const userId = sess.user_id;
    const now = Date.now();

    for (const c of push) {
      const {
        uuid, name, email, phone, address, tags, notes, favorite,
        createdAt, updatedAt, deletedAt
      } = c;

      await env.DB.prepare(`
        INSERT INTO contacts (user_id, uuid, name, email, phone, address, tags, notes, favorite, created_at, updated_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, uuid) DO UPDATE SET
          name=excluded.name,
          email=excluded.email,
          phone=excluded.phone,
          address=excluded.address,
          tags=excluded.tags,
          notes=excluded.notes,
          favorite=excluded.favorite,
          created_at=excluded.created_at,
          updated_at=excluded.updated_at,
          deleted_at=excluded.deleted_at
      `).bind(
        userId, uuid,
        name || "", email || "", phone || "", address || "",
        JSON.stringify(tags || []), notes || "",
        favorite ? 1 : 0,
        createdAt || now, updatedAt || now, deletedAt || null
      ).run();
    }

    const rows = await env.DB.prepare(`
      SELECT uuid, name, email, phone, address, tags, notes, favorite, created_at, updated_at, deleted_at
      FROM contacts
      WHERE user_id = ? AND (updated_at > ? OR deleted_at > ?)
    `).bind(userId, since, since).all();

    const pull = (rows?.results || []).map(r => ({
      uuid: r.uuid,
      name: r.name,
      email: r.email,
      phone: r.phone,
      address: r.address,
      tags: JSON.parse(r.tags || "[]"),
      notes: r.notes,
      favorite: !!r.favorite,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      deletedAt: r.deleted_at,
    }));

    return okJSON(request, { now, pull });
  } catch (e) {
    return errJSON(request, 500, `server-error:${e?.message||"unknown"}`);
  }
}