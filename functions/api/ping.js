// functions/api/ping.js
import { corsOptions, okJSON } from './_common.js';

export function onRequestOptions({ request }) {
  return corsOptions(request);
}
export function onRequestGet({ request }) {
  return okJSON(request, { ok: true, where: 'pages-functions' });
}
