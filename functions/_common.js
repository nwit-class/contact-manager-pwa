// functions/_common.js

// A simple JSON helper
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

// Standard CORS headers
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // or restrict to your domain later
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Reads a cookie from request
export function readCookie(req, name) {
  const cookie = req.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Minimal session retrieval
export async function getSession(env, req) {
  const sid = readCookie(req, "sid");
  if (!sid) return null;
  // Here you would look up session data in D1 (not shown)
  return { sid };
}
