// functions/api/version.jsimport { json, makeCorsHeaders } from "../_common.js";export async function onRequestGet({ request }) {  const origin = request.headers.get("Origin");  return json({ ok: true, version: "v0.1-starter" }, 200, makeCorsHeaders(origin));}

