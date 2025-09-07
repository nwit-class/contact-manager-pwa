// functions/api/version.js
export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      ok: true,
      version: "v-sync-unified-no-imports-002",
      now: new Date().toISOString()
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
