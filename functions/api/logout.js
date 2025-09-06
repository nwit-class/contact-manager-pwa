// functions/api/logout.js
import { corsOptions, okJSON, errJSON, readCookie, clearSession } from '../_common.js';

export function onRequestOptions({ request }) {
  return corsOptions(request);
}

export async function onRequestPost({ request, env }) {
  try {
    const token = readCookie(request, 'session');
    if (token) await clearSession(env.DB, token);
    // clear cookie client-side
    const h = corsOptions(request).headers;
    h.append('Set-Cookie', 'session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure');
    return okJSON(request, { ok: true }, h);
  } catch {
    return errJSON(request, 500, 'server-error');
  }
}
