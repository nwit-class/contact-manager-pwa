// --- keep your other exports as-is; replace only the sections below ---

// Accept localhost and any *.pages.dev
function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return (
      u.hostname === "localhost" ||
      u.hostname.startsWith("localhost:") ||
      u.hostname.endsWith(".pages.dev")
    );
  } catch {
    return false;
  }
}

export function makeCorsHeaders(origin) {
  const allow = isAllowedOrigin(origin) ? origin : "http://localhost:5173";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };
}

export function corsOptionsResponse(origin) {
  return new Response(null, { status: 204, headers: makeCorsHeaders(origin) });
}
export const corsOptions = corsOptionsResponse;

// Decide if the request is cross-site (origin header differs from our URL origin)
function isCrossSite(request) {
  const reqOrigin = request.headers.get("Origin");
  if (!reqOrigin) return false;
  try {
    const a = new URL(reqOrigin).origin;
    const b = new URL(request.url).origin;
    return a !== b;
  } catch {
    return true;
  }
}

export function setCookie(headers, name, value, request, { maxAgeSec = 60 * 60 * 24 * 30 } = {}) {
  const https = new URL(request.url).protocol === "https:";
  const cross = isCrossSite(request);

  // Cross-site cookies must be SameSite=None and Secure (browsers will drop otherwise)
  const sameSite = cross ? "None" : "Lax";
  const secure = https ? "; Secure" : "";

  const cookie =
    `${name}=${value}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAgeSec}` + secure;

  headers.append("Set-Cookie", cookie);
}

export function clearCookie(headers, name, request) {
  const https = new URL(request.url).protocol === "https:";
  const cross = isCrossSite(request);
  const sameSite = cross ? "None" : "Lax";
  const secure = https ? "; Secure" : "";

  const cookie =
    `${name}=; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=0` + secure;

  headers.append("Set-Cookie", cookie);
}
