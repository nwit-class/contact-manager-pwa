import { okJSON, errJSON, corsOptions, deleteSession, readCookie, setCookieFor } from "./_common.js";

export function onRequestOptions({ request }) {
  return corsOptions(request);
}

export async function onRequestPost({ request, env }) {
  try {
    const token = readCookie(request, "session");
    if (token) await deleteSession(env.DB, token);
    const init = setCookieFor(request, {}, "session", "", { maxAge: 0 });
    return okJSON(request, { ok: true }, init);
  } catch (e) {
    return errJSON(request, 500, `server-error:${e?.message||"unknown"}`);
  }
}