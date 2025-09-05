// functions/api/register.js
import {
  okJSON, errJSON, corsOptions, json,
  getUserByName, createUser, createSession, setCookieFor
} from './_common.js';

export function onRequestOptions({ request }) {
  return corsOptions(request);
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env?.DB) return errJSON(request, 500, 'missing-DB-binding');

    const body = await json(request);
    const { username, password } = body || {};
    if (!username || !password) return errJSON(request, 400, 'username-and-password-required');

    const existing = await getUserByName(env.DB, username);
    if (existing) return errJSON(request, 409, 'user-already-exists');

    const ok = await createUser(env.DB, username, password);
    if (!ok) return errJSON(request, 500, 'create-user-failed');

    const u = await getUserByName(env.DB, username);
    if (!u) return errJSON(request, 500, 'user-not-found-after-insert');

    const ttl = Number(env.SESSION_TTL_DAYS || 30);
    const sess = await createSession(env.DB, u.id, ttl);
    const init = setCookieFor(request, {}, 'session', sess.token, { maxAge: ttl * 86400 });

    return okJSON(request, { ok: true, username }, init);
  } catch (e) {
    return errJSON(request, 500, 'server-error:' + (e?.message || 'unknown'));
  }
}
