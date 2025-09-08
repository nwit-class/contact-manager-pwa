// functions/api/me.js
import { json, corsHeaders, getSession, readCookie } from "../_common.js";

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get("Origin")) });
}

export async function onRequestGet({ request, env }) {
  const headers = corsHeaders(request.headers.get("Origin"));
  const token = readCookie(request, "session") || request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const session = await getSession(env, token);
  if (!session) return json({ ok: true, email: null }, 200, headers);
  return json({ ok: true, email: session.email }, 200, headers);
}
