// functions/api/register.js
import { okJSON, errJSON, onOptions } from './_cors.js';

export function onRequestOptions({ request }) {
  return onOptions(request);
}

export async function onRequestPost({ request, env }) {
  try {
    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return errJSON(request, 400, 'expected application/json');
    }
    const { username, password } = await request.json().catch(() => ({}));
    if (!username || !password) return errJSON(request, 400, 'username and password required');

    // TODO: write to D1 if you want persistence.
    // await env.DB.prepare('INSERT ...').bind(username, hash).run()

    // For demo, just say OK and maybe set a simple cookie “session”
    const headers = {
      'Set-Cookie': `session=${encodeURIComponent(username)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 30}`
    };
    return okJSON(request, { ok: true, username }, { headers });
  } catch (e) {
    return errJSON(request, 500, 'server error');
  }
}
