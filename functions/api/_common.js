// functions/api/_common.js
const PAGES_ORIGIN = 'https://contact-manager-pwa-ab6.pages.dev';

function isAllowedOrigin(origin) {
  try {
    const u = new URL(origin);
    if (u.origin === PAGES_ORIGIN) return true;
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
  } catch {}
  return false;
}

export function corsHeadersFor(req) {
  const origin = req.headers.get('Origin') || '';
  const h = new Headers();
  if (isAllowedOrigin(origin)) {
    h.set('Access-Control-Allow-Origin', origin);
    h.set('Vary', 'Origin');
  }
  h.set('Access-Control-Allow-Credentials', 'true');
  h.set('Access-Control-Allow-Headers', 'content-type');
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  return h;
}

export function corsOptions(request) {
  return new Response(null, { status: 204, headers: corsHeadersFor(request) });
}

export function okJSON(request, data, init = {}) {
  const h = corsHeadersFor(request);
  h.set('content-type', 'application/json');
  if (init.headers) for (const [k, v] of Object.entries(init.headers)) h.set(k, v);
  return new Response(JSON.stringify(data), { status: 200, headers: h });
}

export function errJSON(request, status, message, init = {}) {
  const h = corsHeadersFor(request);
  h.set('content-type', 'application/json');
  if (init.headers) for (const [k, v] of Object.entries(init.headers)) h.set(k, v);
  return new Response(JSON.stringify({ error: message }), { status, headers: h });
}

export async function json(request) {
  try { return await request.json(); }
  catch { throw new Error('bad-json'); }
}

// cookies
export function readCookie(req, name) {
  const raw = req.headers.get('cookie') || '';
  for (const part of raw.split(/;\s*/)) {
    const [k, v] = part.split('=');
    if (k === name) return decodeURIComponent(v || '');
  }
  return '';
}
export function setCookieFor(req, resInit = {}, name, value, opts = {}) {
  const { path='/', httpOnly=true, sameSite='Lax', secure=true, maxAge } = opts;
  let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite};`;
  if (httpOnly) cookie += ' HttpOnly;';
  if (secure) cookie += ' Secure;';
  if (maxAge != null) cookie += ` Max-Age=${maxAge};`;

  const headers = corsHeadersFor(req);
  const extra = resInit.headers || {};
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  headers.append('Set-Cookie', cookie);
  return { ...resInit, headers };
}

// crypto
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

// D1 helpers (we store username in the users.email column)
export async function getUserByName(DB, username) {
  return DB.prepare('SELECT * FROM users WHERE email = ?').bind(username).first();
}
export async function createUser(DB, username, password) {
  const now = Date.now();
  const { salt, dk } = await hashPassword(password);
  const r = await DB.prepare(
    'INSERT INTO users (email, password_salt, password_dk, created_at) VALUES (?, ?, ?, ?)'
  ).bind(username, salt, dk, now).run();
  return r.success;
}

export async function createSession(DB, userId, ttlDays = 30) {
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + ttlDays * 86400 * 1000;
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
