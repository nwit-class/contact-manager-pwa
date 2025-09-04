// functions/_lib.js
export const json = (obj, init = {}) =>
  new Response(JSON.stringify(obj), {
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    ...init,
  });

export const badRequest = (msg = 'Bad Request') => json({ error: msg }, { status: 400 });
export const unauthorized = () => json({ error: 'Unauthorized' }, { status: 401 });

function base64(buf) { return btoa(String.fromCharCode(...buf)); }
export function base64url(buf) { return base64(buf).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
export function randomBytes(n){ const a=new Uint8Array(n); crypto.getRandomValues(a); return a; }

async function pbkdf2(password, salt) {
  const enc = new TextEncoder();
  const pwKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100_000, hash: 'SHA-256' }, pwKey, 256);
  return base64(new Uint8Array(bits));
}
export async function hashPassword(password) {
  const salt = base64url(randomBytes(16));
  const dk = await pbkdf2(password, salt);
  return { salt, dk };
}
export async function verifyPassword(password, salt, expected) {
  const dk = await pbkdf2(password, salt);
  return dk === expected;
}

export function parseCookies(req) {
  const header = req.headers.get('cookie') || '';
  const out = {};
  header.split(';').forEach(p => {
    const [k, ...v] = p.trim().split('=');
    if (!k) return; out[k] = decodeURIComponent(v.join('=') || '');
  });
  return out;
}

export async function createSession(env, userId) {
  const ttlDays = Number(env.SESSION_TTL_DAYS || 30);
  const token = base64url(randomBytes(32));
  const expiresAt = Date.now() + ttlDays*24*60*60*1000;
  await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, userId, expiresAt).run();
  return { token, expiresAt };
}

export async function getSessionUser(env, req) {
  const token = parseCookies(req).session || '';
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.id as user_id, u.email, s.expires_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ?`
  ).bind(token).first();
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return null;
  }
  return { id: row.user_id, email: row.email, token };
}

export async function destroySession(env, req) {
  const token = parseCookies(req).session || '';
  if (!token) return;
  await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

export function setSessionCookie(token, expiresAt) {
  const date = new Date(expiresAt).toUTCString();
  return `session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${date}`;
}
export const clearSessionCookie =
  'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
