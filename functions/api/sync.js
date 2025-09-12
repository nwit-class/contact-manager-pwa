import { json, errJSON, makeCorsHeaders, corsOptionsResponse, getSessionEmail } from "../_common.js";

export const onRequestOptions = async ({ request }) =>
  corsOptionsResponse(request.headers.get("Origin"));

export const onRequestPost = async ({ env, request }) => {
  const origin = request.headers.get("Origin");
  const email = await getSessionEmail(env, request);
  if (!email) return errJSON("unauthorized", 401, origin);

  let body = {};
  try { body = await request.json(); } catch {}
  return json({ ok: true, received: body }, 200, {}, origin);
};
