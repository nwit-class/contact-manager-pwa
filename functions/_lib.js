// functions/_lib.js

/** CORS helpers */
const ALLOW_ORIGIN = '*'; // or set to your site: 'https://contact-manager-pwa-ab6.pages.dev'
const BASE_CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOW_ORIGIN,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

export function okJSON(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'content-type': 'application/json', ...BASE_CORS_HEADERS, ...(init.headers || {}) },
    ...init,
  });
}

export function errJSON(status, message, init = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json', ...BASE_CORS_HEADERS, ...(init.headers || {}) },
    ...init,
  });
}

export function corsOptions() {
  // Respond to preflight
  return new Response(null, { status: 204, headers: BASE_CORS_HEADERS });
}

/** Crypto helpers (no external libs) */
async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password, salt) {
  const s = salt || crypto.randomUUID();
  const dk = await sha256(`${s}:${password}`);
  return { salt: s, dk };
}

export async function verifyPassword(password, salt, dk) {
  const cand = await hashPassword(password, salt);
  return cand.dk === dk;
}

/** D1 helpers */
export async function getUserByEmail(DB, email) {
  return DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
}

export async function createUser(DB, email, password) {
  const now = Date.now();
  const { salt, dk } = await hashPassword(password);
  const r = await DB.prepare(
    'INSERT INTO users (email, password_salt, password_dk, created_at) VALUES (?, ?, ?, ?)'
  ).bind(email, salt, dk, now).run();
  return r.success;
}

export async function createSession(DB, userId, ttlDays = 30) {
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  await DB.prepare(
    'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)'
  ).bind(token, userId, expiresAt).run();
  return { token, expiresAt };
}

export async function getSession(DB, token) {
  if (!token) return null;
  const row = await DB.prepare('SELECT * FROM sessions WHERE token = ?').bind(token).first();
  if (!row) return null;
  if (row.expires_at < Date.now()) return null;
  return row;
}

export async function deleteSession(DB, token) {
  await DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

export function readCookie(req, name) {
  const raw = req.headers.get('cookie') || '';
  const parts = raw.split(/;\s*/);
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k === name) return decodeURIComponent(v || '');
  }
  return '';
}

export function setCookie(resInit = {}, name, value, opts = {}) {
  const {
    path = '/',
    httpOnly = true,
    sameSite = 'Lax',
    secure = true,
    maxAge = undefined,
  } = opts;
  let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite};`;
  if (httpOnly) cookie += ' HttpOnly;';
  if (secure) cookie += ' Secure;';
  if (maxAge) cookie += ` Max-Age=${maxAge};`;
  const headers = new Headers(resInit.headers || {});
  headers.append('Set-Cookie', cookie);
  for (const [k, v] of Object.entries(BASE_CORS_HEADERS)) headers.set(k, v);
  return { ...resInit, headers };
}
