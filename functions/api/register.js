// functions/api/register.js (TEMP STUB)
function corsHeaders(req) {
  const origin = req.headers.get('Origin') || '';
  const h = new Headers();
  try {
    const u = new URL(origin);
    if (
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1' ||
      u.origin === 'https://contact-manager-pwa-ab6.pages.dev'
    ) {
      h.set('Access-Control-Allow-Origin', origin);
      h.set('Vary', 'Origin');
    }
  } catch {}
  h.set('Access-Control-Allow-Credentials', 'true');
  h.set('Access-Control-Allow-Headers', 'content-type');
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  return h;
}

export function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestPost({ request }) {
  const h = corsHeaders(request);
  h.set('content-type', 'application/json');
  return new Response(JSON.stringify({ ok: true, stage: 'register-stub' }), { status: 200, headers: h });
}

