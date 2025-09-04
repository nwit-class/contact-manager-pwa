import { corsOptions, okJSON, errJSON } from "./_common.js";

export function onRequestOptions({ request }) {
  return corsOptions(request);
}
export async function onRequestGet({ request, env }) {
  try {
    if (!env?.DB) return errJSON(request, 500, "missing-DB-binding");
    const u = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    return okJSON(request, { ok: true, tables: (u?.results || []).map(r => r.name) });
  } catch (e) {
    return errJSON(request, 500, `db-error:${e?.message||"unknown"}`);
  }
}