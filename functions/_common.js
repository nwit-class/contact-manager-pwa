// functions/_common.js

// ---------- Allowed Origins (add yours here) ----------
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5176",
  "http://localhost:5179",
  "https://contact-manager-pwa-ab6.pages.dev",
  "https://contact-manager-pwa.pages.dev",
];

// ---------- CORS ----------
export function makeCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin || "") ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };
}

export function corsOptionsResponse(origin) {
  return new Response(null, { status: 204, headers: makeCorsHeaders(origin) });
}

// Keep compat name some files expect
export const corsOptions = corsOptionsResponse;

// ---------- JSON helpers ----------
export function json(data, status = 200, extraHeaders = {}, origin = null) {
  const base = origin ? makeCorsHeaders(origin) : {};
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...base,
      ...extraHeaders,
    },
  });
}

// Convenience alias some code imports
export function okJSON(data = { ok: true }, origin = null) {
  return json(data, 200, {}, origin);
}

// ---------- Cookies ----------
export function readCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  const parts = raw.split(/; */);
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if ((k || "").trim() === name) return rest.join("=");
  }
  return null;
}

export function setCookie(headers, name, value, request, { maxAgeSec = 60 * 60 * 24 * 30 } = {}) {
  const secure = new URL(request.url).protocol === "https:";
  const cookie =
    `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}` +
    (secure ? "; Secure" : "");
  headers.append("Set-Cookie", cookie);
}

export function clearCookie(headers, name, request) {
  const secure = new URL(request.url).protocol === "https:";
  const cookie =
    `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` +
    (secure ? "; Secure" : "");
  headers.append("Set-Cookie", cookie);
}

// ---------- Signed session (HMAC SHA-256) ----------
function b64uEncode(buf) {
  let str = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64uDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4 ? 4 - (str.length % 4) : 0;
  str += "=".repeat(pad);
  const bin = atob(str);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

async function hmacKey(secret) {
  const enc = new TextEncoder().encode(secret);
  return crypto.subtle.importKey("raw", enc, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(payloadObj, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = new TextEncoder();
  const h = b64uEncode(enc.encode(JSON.stringify(header)));
  const p = b64uEncode(enc.encode(JSON.stringify(payloadObj)));
  const toSign = new TextEncoder().encode(`${h}.${p}`);
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, toSign);
  const s = b64uEncode(sig);
  return `${h}.${p}.${s}`;
}

export async function verifySession(token, secret) {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const key = await hmacKey(secret);
    const toVerify = new TextEncoder().encode(`${h}.${p}`);
    const sig = b64uDecode(s);
    const ok = await crypto.subtle.verify("HMAC", key, sig, toVerify);
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64uDecode(p)));
    return payload; // { email, iat }
  } catch {
    return null;
  }
}

export async function getSessionEmail(env, request) {
  const token = readCookie(request, "session");
  if (!token) return null;
  if (!env.SECRET) return null;
  const payload = await verifySession(token, env.SECRET);
  return payload?.email || null;
}
