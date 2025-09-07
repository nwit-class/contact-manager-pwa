// functions/api/register.js

// CORS helpers (inline, no imports)
const ALLOW_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5176',
  'http://localhost:5179',
  'https://00415912.contact-manager-pwa-ab6.pages.dev',
];
function pickOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  return ALLOW_ORIGINS.includes(origin) ? origin : '';
}
function corsHeaders(request, extra = {}) {
  const origin = pickOrigin(request);
  const base = {
    'Vary': 'Origin',
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  };
  return { ...base, ...extra };
}
function okJSON(request, data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request, init.headers || {}) }
  });
}
function errJSON(request, code, message, extra = {}) {
  return okJSON(request, { error: message, ...extra }, { status: code });
}
export function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

// parse body (email OR username + password), accept json/form/query
async function readCreds(request) {
  const url = new URL(request.url);
  const ct = (request.headers.get('content-type') || '').toLowerCase();
  let body = {};
  let source = 'unknown';

  if (ct.includes('application/json')) {
    source = 'json';
    body = await request.json().catch(() => ({}));
  } else if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    source = 'form';
    const form = await request.formData().catch(() => null);
    if (form) body = Object.fromEntries(form.entries());
  } else {
    source = 'query';
    body = Object.fromEntries(url.searchParams.entries());
  }

  const email = (body.email || '').trim();
  const username = (body.username || '').trim();
  const password = (body.password || '').trim();
  const account = email || username;

  return { account, email, username, password, source };
}

export async function onRequestPost({ request /*, env */ }) {
  try {
    const { account, email, username, password, source } = await readCreds(request);
    if (!account || !password) {
      return errJSON(request, 400, 'email/username and password required', {
        source, got: { email, username, hasPassword: !!password }
      });
    }

    // TODO: persist to D1 if desired

    return okJSON(request, {
      ok: true,
      account,
      via: source,
      setCookie: true
    }, {
      headers: {
        'Set-Cookie': `session=${encodeURIComponent(account)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60*60*24*30}`
      }
    });
  } catch (e) {
    return errJSON(request, 500, 'server error', { msg: String(e) });
  }
}
