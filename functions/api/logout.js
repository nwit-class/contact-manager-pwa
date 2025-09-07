// functions/api/logout.js
export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0'
    }
  });
}
export function onRequestOptions({ request }) {
  const origin = request.headers.get("Origin") || "";
  return new Response(null, {
    status: 204,
    headers: {
      Vary: "Origin",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    }
  });
}
