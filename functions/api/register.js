// functions/api/register.js
import {
  json, makeCorsHeaders, corsOptionsResponse,
  setCookie, signSession
} from "../_common.js";

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request.headers.get("Origin"));
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");
  const headers = makeCorsHeaders(origin);

  let body;
  try { body = await request.json(); } catch {}
  const { email, password } = body || {};
  if (!email || !password) return json({ error: "email and password required" }, 400, headers);

  // TODO: Create user in D1; for now we just accept it
  const token = await signSession({ email, iat: Date.now() }, env.SECRET || "dev-secret");
  setCookie(headers, "session", token, request);

  return json({ ok: true, message: "Registered successfully" }, 200, headers);
}

