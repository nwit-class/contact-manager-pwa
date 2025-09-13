import { json, makeCorsHeaders, corsOptionsResponse, clearCookie } from "../_common.js";

export const onRequestOptions = async ({ request }) =>
  corsOptionsResponse(request.headers.get("Origin"));

export const onRequestPost = async ({ request }) => {
  const origin = request.headers.get("Origin");
  const headers = new Headers(makeCorsHeaders(origin));
  clearCookie(headers, "session", request);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...Object.fromEntries(headers) }
  });
};
