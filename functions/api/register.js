// functions/api/register.js
import { badRequest, hashPassword, createSession, setSessionCookie } from '../_lib.js';

export async function onRequestPost({ request, env }) {
  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password) return badRequest('Email and password required');

  const exists = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (exists) return badRequest('Email already registered');

  const { salt, dk } = await hashPassword(password);
  const now = Date.now();
  const res = await env.DB
    .prepare('INSERT INTO users (email, password_salt, password_dk, created_at) VALUES (?, ?, ?, ?)')
    .bind(email, salt, dk, now).run();

  const userId = res.meta.last_row_id;
  const { token, expiresAt } = await createSession(env, userId);

  return new Response(JSON.stringify({ ok: true, email }), {
    headers: { 'content-type': 'application/json', 'set-cookie': setSessionCookie(token, expiresAt) },
  });
}
