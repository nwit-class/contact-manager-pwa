export async function onRequestGet() {
  return new Response(
    JSON.stringify({ ok: true, method: "GET", msg: "debug-echo alive" }),
    { headers: { "Content-Type": "application/json" } }
  );
}
export async function onRequestPost({ request }) {
  const raw = await request.text().catch(() => "");
  let parsed = {};
  try { parsed = JSON.parse(raw); } catch {}
  return new Response(
    JSON.stringify({ ok: true, method: "POST", raw, parsed }, null, 2),
    { headers: { "Content-Type": "application/json" } }
  );
}
