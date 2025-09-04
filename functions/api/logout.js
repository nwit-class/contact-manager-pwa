// functions/api/logout.js
import { okJSON, errJSON, corsOptions, deleteSession, readCookie, setCookie } from '../_lib.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const token = readCookie(request, 'session');
    if (token) await deleteSession(env.DB, token);
    const init = setCookie({}, 'session', '', { maxAge: 0 }); // clear cookie
    return okJSON({ ok: true }, init);
  } catch {
    return errJSON(500, 'server error');
  }
}

