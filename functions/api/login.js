// functions/api/login.js
import { okJSON, errJSON, onOptions, readCreds } from './_cors.js';

export function onRequestOptions({ request }) {
  return onOptions(request);
}

export async function onRequestPost({ request /*, env*/ }) {
  try {
    const { account, email, username, password, source } = await readCreds(request);
    if (!account || !password) {
      return errJSON(request, 400, 'email/username and password required', { source, got: { email, username, hasPassword: !!password } });
    }

    // TODO: validate against D1 if you persisted on register
    const headers = {
      'Set-Cookie': `session=${encodeURIComponent(account)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 30}`,
    };
    return okJSON(request, { ok: true, account, via: source }, { headers });
  } catch (e) {
    return errJSON(request, 500, 'server error');
  }
}
