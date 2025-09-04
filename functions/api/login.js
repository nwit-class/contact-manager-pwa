// functions/api/login.js
import {
  okJSON, errJSON, corsOptions,
  getUserByEmail, verifyPassword, createSession, setCookie
} from '../_lib.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { email, password } = await request.json();
    if (!email || !password) return errJSON(400, 'email and password required');

    const u = await getUserByEmail(env.DB, email);
    if (!u) return errJSON(401, 'invalid credentials');

    const ok = await verifyPassword(password, u.password_salt, u.password_dk);
    if (!ok) return errJSON(401, 'invalid credentials');

    const ttl = Number(env.SESSION_TTL_DAYS || 30);
    const sess = await createSession(env.DB, u.id, ttl);

    const init = setCookie({}, 'session', sess.token, { maxAge: ttl * 86400 });
    return okJSON({ ok: true }, init);
  } catch {
    return errJSON(500, 'server error');
  }
}
