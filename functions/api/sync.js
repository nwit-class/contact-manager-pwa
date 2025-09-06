// functions/api/sync.js
import { okJSON, errJSON, onOptions } from './_cors.js';

export function onRequestOptions({ request }) {
  return onOptions(request);
}

export async function onRequestPost({ request }) {
  try {
    // If you eventually push/pull to D1, parse body here
    // const body = await request.json().catch(() => ({}));
    // Validate session cookie if desired:
    // const cookie = request.headers.get('Cookie') || ''
    // const session = /(?:^|;\s*)session=([^;]+)/.exec(cookie)?.[1]

    return okJSON(request, { ok: true, pushed: 0, pulled: 0 });
  } catch {
    return errJSON(request, 500, 'server error');
  }
}
