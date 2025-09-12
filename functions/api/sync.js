import { json, errJSON, makeCorsHeaders, corsOptionsResponse, getSessionEmail } from "../_common.js";

export const onRequestOptions = async (ctx) => {
  const origin = ctx.request.headers.get("Origin");
  return corsOptionsResponse(origin);
};

export const onRequestPost = async (ctx) => {
  const origin = ctx.request.headers.get("Origin");
  const email = await getSessionEmail(ctx.env, ctx.request);
  if (!email) return errJSON("unauthorized", 401, origin);

  let body = {};
  try { body = await ctx.request.json(); } catch {}
  // TODO: use ctx.env.DB to upsert contacts
  return json({ ok: true, received: body }, 200, {}, origin);
};
