// functions/api/register.js
import {
  okJSON, errJSON, corsOptions,
  getUserByEmail, createUser, createSession, setCookie
} from '../_lib.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { email, password } = await request.json();
    if (!email || !password) return errJSON(400, 'email and password required');

    const existing = await getUserByEmail(env.DB, email);
    if (existing) return errJSON(409, 'user already exists');

    const ok = await createUser(env.DB, email, password);
    if (!ok) return errJSON(500, 'failed to create user');

    const ttl = Number(env.SESSION_TTL_DAYS || 30);
    const sess = await createSession(env.DB, (await getUserByEmail(env.DB, email)).id, ttl);

    const init = setCookie({}, 'session', sess.token, { maxAge: ttl * 86400 });
    return okJSON({ ok: true }, init);
  } catch (e) {
    return errJSON(500, 'server error');
  }
}
