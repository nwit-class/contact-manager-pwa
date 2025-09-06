// functions/api/register.js
import {
  corsOptions, okJSON, errJSON,
  createUser, createSession, cookieHeadersWithSession
} from '../_common.js';

export function onRequestOptions({ request }) {
  return corsOptions(request);
}

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) return errJSON(request, 400, 'missing-credentials');

    const userId = await createUser(env.DB, username, password).catch(e => {
      if (e.message === 'user-exists') return null;
      throw e;
    });
    if (userId === null) return errJSON(request, 409, 'user-exists');

    const { token } = await createSession(env.DB, userId, 30);
    const h = cookieHeadersWithSession(request, token, 30);
    return okJSON(request, { ok: true, username }, h);
  } catch (e) {
    return errJSON(request, 500, 'server-error');
  }
}
