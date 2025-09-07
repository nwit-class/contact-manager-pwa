// functions/api/logout.js
import { okJSON, onOptions } from './_cors.js';

export function onRequestOptions({ request }) {
  return onOptions(request);
}

export async function onRequestPost({ request }) {
  // Expire the session cookie
  const headers = {
    'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0'
  };
  return okJSON(request, { ok: true }, { headers });
}
