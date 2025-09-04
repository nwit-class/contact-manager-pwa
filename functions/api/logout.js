// functions/api/logout.js
import { destroySession, clearSessionCookie } from '../_lib.js';

export async function onRequestPost({ request, env }) {
  await destroySession(env, request);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json', 'set-cookie': clearSessionCookie },
  });
}
