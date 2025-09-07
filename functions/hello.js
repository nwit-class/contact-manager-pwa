export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, where: "/hello" }), {
    headers: { "Content-Type": "application/json" }
  });
}
