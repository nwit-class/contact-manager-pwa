// functions/api/register.js
import {
  okJSON, errJSON, corsOptions,
  getUserByEmail, createUser, createSession, setCookieFor
} from './_common.js';

export async function onRequestOptions({ request }) {
  return corsOptions(request);
}

export async function onRequestPost({ request, env }) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return errJSON(request, 400, 'email and password required');

    const existing = await getUserByEmail(env.DB, email);
    if (existing) return errJSON(request, 409, 'user already exists');

    const ok = await createUser(env.DB, email, password);
    if (!ok) return errJSON(request, 500, 'failed to create user');

    const u = await getUserByEmail(env.DB, email);
    const ttl = Number(env.SESSION_TTL_DAYS || 30);
    const sess = await createSession(env.DB, u.id, ttl);

    const init = setCookieFor(request, {}, 'session', sess.token, { maxAge: ttl * 86400 });
    return okJSON(request, { ok: true }, init);
  } catch (e) {
    return errJSON(request, 500, 'server error');
  }
}
