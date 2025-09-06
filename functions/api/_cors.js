const ALLOW_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5176',
  'https://00415912.contact-manager-pwa-ab6.pages.dev',
];

export function pickOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  return ALLOW_ORIGINS.includes(origin) ? origin : '';
}

export function corsHeaders(request, extra = {}) {
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

export function okJSON(request, data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request, init.headers || {})
    }
  });
}

export function errJSON(request, code, message, extra = {}) {
  return okJSON(request, { error: message, ...extra }, { status: code });
}

export function onOptions(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function readUserPass(request) {
  const url = new URL(request.url);
  const ct = (request.headers.get('content-type') || '').toLowerCase();

  // 1) JSON
  if (ct.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    return { username: body.username, password: body.password, source: 'json' };
  }

  // 2) Form (urlencoded or multipart)
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const form = await request.formData().catch(() => null);
    if (form) {
      return { username: form.get('username'), password: form.get('password'), source: 'form' };
    }
  }

  // 3) Query string fallback (for testing)
  return { username: url.searchParams.get('username'), password: url.searchParams.get('password'), source: 'query' };
}
