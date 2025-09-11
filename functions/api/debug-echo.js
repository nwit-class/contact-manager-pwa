// functions/api/debug-echo.js
import { json, makeCorsHeaders, corsOptionsResponse } from "../_common.js";

export async function onRequestOptions({ request }) {
  return corsOptionsResponse(request.headers.get("Origin"));
}

export async function onRequestPost({ request }) {
  const origin = request.headers.get("Origin");
  let body = null;
  try { body = await request.json(); } catch {}
  return json({ ok: true, body }, 200, makeCorsHeaders(origin));
}
