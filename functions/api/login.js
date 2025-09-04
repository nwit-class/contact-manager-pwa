import {
  okJSON, errJSON, corsOptions, json,
  getUserByEmail, verifyPassword, createSession, setCookieFor
} from "./_common.js";

export function onRequestOptions({ request }) {
  return corsOptions(request);
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env?.DB) return errJSON(request, 500, "missing-DB-binding");

    const body = await json(request);
    const { email, password } = body || {};
    if (!email || !password) return errJSON(request, 400, "email-and-password-required");

    const u = await getUserByEmail(env.DB, email);
    if (!u) return errJSON(request, 401, "invalid-credentials");

    const ok = await verifyPassword(password, u.password_salt, u.password_dk);
    if (!ok) return errJSON(request, 401, "invalid-credentials");

    const ttl = Number(env.SESSION_TTL_DAYS || 30);
    const sess = await createSession(env.DB, u.id, ttl);

    const init = setCookieFor(request, {}, "session", sess.token, { maxAge: ttl * 86400 });
    return okJSON(request, { ok: true, userId: u.id }, init);
  } catch (e) {
    return errJSON(request, 500, `server-error:${e?.message||"unknown"}`);
  }
}