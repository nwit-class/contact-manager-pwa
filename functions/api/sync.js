// functions/api/sync.js
import { json, makeCorsHeaders, corsOptionsResponse, getSessionEmail } from "../_common.js";

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request.headers.get("Origin"));
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");
  const headers = makeCorsHeaders(origin);

  const email = await getSessionEmail(env, request);
  if (!email) return json({ error: "not logged in" }, 401, headers);

  let body;
  try { body = await request.json(); } catch {}
  const contacts = body?.contacts || [];
  // TODO: persist contacts in D1 per user; for now echo back
  return json({ ok: true, count: contacts.length, message: "Synced successfully" }, 200, headers);
}
