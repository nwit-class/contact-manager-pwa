// functions/api/login.js
import { okJSON, errJSON, onOptions } from './_cors.js';

export function onRequestOptions({ request }) {
  return onOptions(request);
}

export async function onRequestPost({ request }) {
  try {
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return errJSON(request, 400, 'expected application/json');
    }
    const { username, password } = await request.json().catch(() => ({}));
    if (!username || !password) return errJSON(request, 400, 'username and password required');

    // TODO: verify against D1 (if you persisted on register)
    // For demo, accept anything non-empty and set cookie
    const headers = {
      'Set-Cookie': `session=${encodeURIComponent(username)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 30}`
    };
    return okJSON(request, { ok: true, username }, { headers });
  } catch {
    return errJSON(request, 500, 'server error');
  }
}
