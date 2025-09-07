// functions/api/version.js
export async function onRequestGet() {
  try {
    const body = {
      ok: true,
      version: "v-sync-unified-no-imports-001",
      now: new Date().toISOString()
    };
    return new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "server error", msg: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
