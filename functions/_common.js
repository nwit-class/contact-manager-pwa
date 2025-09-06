// functions/_common.js
// Shared helpers: CORS, JSON responses, schema, sessions, hashing.

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'https://contact-manager-pwa-ab6.pages.dev',
  // add your custom subdomain(s) here if needed:
  'https://00415912.contact-manager-pwa-ab6.pages.dev',
];

function originOk(origin) {
  return origin && ALLOWED_ORIGINS.includes(origin);
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  const headers = new Headers();
  if (originOk(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  headers.set('Access-Control-Allow-Headers', 'content-type');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  return headers;
}

export function corsOptions(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function okJSON(request, obj, extra = {}) {
  const h = corsHeaders(request);
  h.set('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return new Response(JSON.stringify(obj), { status: 200, headers: h });
}

export function errJSON(request, status = 500, message = 'server error') {
  const h = corsHeaders(request);
  h.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify({ error: message }), { status, headers: h });
}

export function readCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const parts = cookie.split(/; */);
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k && k.trim() === name) return decodeURIComponent(v || '');
  }
  return null;
}

function setCookieHeader(request, name, value, { maxAgeSec = 60 * 60 * 24 * 30 } = {}) {
  const h = corsHeaders(request);
  const secure = true;
  const cookie = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    `Max-Age=${maxAgeSec}`,
  ].filter(Boolean).join('; ');
  h.append('Set-Cookie', cookie);
  return h;
}

export async function ensureSchema(db) {
  // Users & sessions
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `).run();

  // Contacts
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS contacts (
      user_id INTEGER NOT NULL,
      uuid TEXT NOT NULL,
      name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      tags TEXT,
      notes TEXT,
      favorite INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER,
      deleted_at INTEGER,
      PRIMARY KEY (user_id, uuid),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `).run();
}

async function sha256(str) {
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = [...new Uint8Array(hash)];
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createUser(db, username, password) {
  await ensureSchema(db);
  const hash = await sha256(password);
  try {
    await db.prepare(
      `INSERT INTO users (username, password_hash) VALUES (?, ?)`
    ).bind(username, hash).run();
  } catch (e) {
    if (String(e?.message || '').includes('UNIQUE')) {
      throw new Error('user-exists');
    }
    throw e;
  }
  const row = await db.prepare(`SELECT id FROM users WHERE username = ?`).bind(username).first();
  return row?.id;
}

export async function verifyUser(db, username, password) {
  await ensureSchema(db);
  const row = await db.prepare(`SELECT id, password_hash FROM users WHERE username = ?`).bind(username).first();
  if (!row) return null;
  const candidate = await sha256(password);
  return candidate === row.password_hash ? row.id : null;
}

function randToken() {
  return crypto.randomUUID();
}

export async function createSession(db, userId, days = 30) {
  await ensureSchema(db);
  const token = randToken();
  const now = Date.now();
  const expiresAt = now + days * 24 * 60 * 60 * 1000;
  await db.prepare(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`
  ).bind(token, userId, expiresAt).run();
  return { token, expiresAt };
}

export async function getSession(db, token) {
  if (!token) return null;
  const now = Date.now();
  const row = await db.prepare(
    `SELECT token, user_id, expires_at FROM sessions WHERE token = ?`
  ).bind(token).first();
  if (!row) return null;
  if (row.expires_at < now) {
    await db.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
    return null;
  }
  return row;
}

export async function clearSession(db, token) {
  if (!token) return;
  await db.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
}

export function cookieHeadersWithSession(request, token, days = 30) {
  const max = days * 24 * 60 * 60;
  return setCookieHeader(request, 'session', token, { maxAgeSec: max });
}
