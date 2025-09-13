import {
  json, errJSON, makeCorsHeaders, corsOptionsResponse,
  setCookie, signSession
} from "../_common.js";

export const onRequestOptions = async ({ request }) =>
  corsOptionsResponse(request.headers.get("Origin"));

export const onRequestPost = async ({ env, request }) => {
  const origin = request.headers.get("Origin");
  const headers = new Headers(makeCorsHeaders(origin));

  let body = {};
  try { body = await request.json(); } catch {}
  const { email, password } = body || {};
  if (!email || !password) return errJSON("email and password required", 400, origin);

  // TODO: write user to D1 (omitted here); we just mint a session
  if (!env.SECRET) return errJSON("server not configured", 500, origin);

  const token = await signSession({ email, iat: Date.now() }, env.SECRET);
  setCookie(headers, "session", token, request, { maxAgeSec: 60 * 60 * 24 * 30 });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...Object.fromEntries(headers) }
  });
};
