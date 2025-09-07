// functions/api/_cors.js
const ALLOW_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5176',
  'https://00415912.contact-manager-pwa-ab6.pages.dev', // <-- your Pages URL
];

// Resolve the allowed Origin (must not be "*"" when using credentials)
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

export function errJSON(request, code, message) {
  return okJSON(request, { error: message }, { status: code });
}

export function onOptions(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
