import { okJSON, errJSON, onOptions, readUserPass } from './_cors.js';

export function onRequestOptions({ request }) {
  return onOptions(request);
}

export async function onRequestPost({ request /*, env*/ }) {
  try {
    const { username, password, source } = await readUserPass(request);
    if (!username || !password) {
      return errJSON(request, 400, 'username and password required', { source });
    }

    // TODO: validate against D1 if you persisted in register
    const headers = {
      'Set-Cookie': `session=${encodeURIComponent(username)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 30}`
    };
    return okJSON(request, { ok: true, username, via: source }, { headers });
  } catch (e) {
    return errJSON(request, 500, 'server error');
  }
}
