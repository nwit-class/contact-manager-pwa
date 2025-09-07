// functions/api/debug-echo.js
export async function onRequestPost({ request }) {
  const ct = request.headers.get("content-type") || "";
  const raw = await request.clone().text().catch(() => "");
  let parsed = {};
  try { parsed = JSON.parse(raw); } catch {}

  return new Response(
    JSON.stringify({
      ok: true,
      method: request.method,
      contentType: ct,
      origin: request.headers.get("Origin") || "",
      rawBody: raw,
      parsed,
    }, null, 2),
    { headers: { "Content-Type": "application/json" } }
  );
}
