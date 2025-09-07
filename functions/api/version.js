// functions/api/version.js
export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      ok: true,
      // Change this string every time you deploy so we know what version is live:
      version: "v-sync-accept-email-or-username-001",
      now: new Date().toISOString()
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
