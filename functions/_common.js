// functions/_common.js

// ---------- CORS + origins ----------
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
// common aliases some of your files import
export const corsOptions = corsOptionsResponse;
export const corsOptionsON = corsOptionsResponse;

// ---------- JSON helpers ----------
export function json(data, status = 200, extraHeaders = {}, origin = null) {
  const base = origin ? makeCorsHeaders(origin) : {};
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...base, ...extraHeaders },
  });
}
export function okJSON(data = { ok: true }, origin = null) {
  return json(data, 200, {}, origin);
}
export function errJSON(message = "server error", status = 500, origin = null) {
  return json({ error: message }, status, {}, origin);
}

// ---------- Cookies ----------
function isCrossSite(request) {
  const o = request.headers.get("Origin");
  if (!o) return false;
  try {
    return new URL(o).origin !== new URL(request.url).origin;
  } catch {
    return true;
  }
}
export function readCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(/; */)) {
    const [k, ...rest] = part.split("=");
    if ((k || "").trim() === name) return rest.join("=");
  }
  return null;
}
export function setCookie(headers, name, value, request, { maxAgeSec = 60 * 60 * 24 * 30 } = {}) {
  const https = new URL(request.url).protocol === "https:";
  const cross = isCrossSite(request);
  const sameSite = cross ? "None" : "Lax";
  const secure = https ? "; Secure" : "";
  headers.append(
    "Set-Cookie",
    `${name}=${value}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAgeSec}${secure}`
  );
}
export function clearCookie(headers, name, request) {
  const https = new URL(request.url).protocol === "https:";
  const cross = isCrossSite(request);
  const sameSite = cross ? "None" : "Lax";
  const secure = https ? "; Secure" : "";
  headers.append(
    "Set-Cookie",
    `${name}=; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=0${secure}`
  );
}

// ---------- Session (HMAC) ----------
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
export async function getSession(env, request) {
  const token = readCookie(request, "session");
  if (!token || !env.SECRET) return null;
  return await verifySession(token, env.SECRET);
}
export async function getSessionEmail(env, request) {
  const p = await getSession(env, request);
  return p?.email || null;
}
