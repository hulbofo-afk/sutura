import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "sutura_access";
const REFRESH_COOKIE = "sutura_refresh";
const ALLOWED_ROOTS = new Set(["auth", "collections", "fashion-tests", "public-tests", "analytics", "ai-recommendations", "reports", "uploads", "uploads-local", "health"]);

function upstreamUrl(path: string[], search: string) {
  const root = path[0] ?? "";
  if (!ALLOWED_ROOTS.has(root) || path.some((part) => part === ".." || part.includes("\\"))) throw new Error("Route API interdite");
  const base = (process.env.API_BASE_URL ?? "http://127.0.0.1:4000/api").replace(/\/$/, "");
  return `${base}/${path.map(encodeURIComponent).join("/")}${search}`;
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  let url: string;
  try { url = upstreamUrl(path, request.nextUrl.search); } catch { return NextResponse.json({ error: { message: "Route API interdite" } }, { status: 400 }); }

  const requestBody = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  if (access) headers.set("authorization", `Bearer ${access}`);
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor.split(",")[0].trim());
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("user-agent", userAgent);

  let upstream = await fetch(url, { method: request.method, headers, body: requestBody, cache: "no-store", redirect: "manual" });
  let nextAccess: string | undefined;
  let nextRefresh: string | undefined;

  if (upstream.status === 401 && access && path[0] !== "auth") {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      const base = (process.env.API_BASE_URL ?? "http://127.0.0.1:4000/api").replace(/\/$/, "");
      const refreshed = await fetch(`${base}/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store"
      });
      if (refreshed.ok) {
        const session = await refreshed.json() as { token: string; refreshToken: string };
        nextAccess = session.token;
        nextRefresh = session.refreshToken;
        headers.set("authorization", `Bearer ${session.token}`);
        upstream = await fetch(url, { method: request.method, headers, body: requestBody, cache: "no-store", redirect: "manual" });
      }
    }
  }

  const isSession = path[0] === "auth" && (path[1] === "login" || path[1] === "register") && upstream.ok;
  let body = new Uint8Array(await upstream.arrayBuffer());
  if (isSession) {
    const session = JSON.parse(Buffer.from(body).toString("utf8")) as { token: string; refreshToken: string; user: unknown };
    nextAccess = session.token;
    nextRefresh = session.refreshToken;
    body = new TextEncoder().encode(JSON.stringify({ user: session.user }));
  }

  const responseHeaders = new Headers();
  for (const name of ["content-type", "content-disposition", "x-api-version"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  const response = new NextResponse(body.byteLength ? body : null, { status: upstream.status, headers: responseHeaders });
  if (nextAccess && nextRefresh) {
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set(ACCESS_COOKIE, nextAccess, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 15 * 60 });
    response.cookies.set(REFRESH_COOKIE, nextRefresh, { httpOnly: true, sameSite: "strict", secure, path: "/api/backend", maxAge: 30 * 24 * 60 * 60 });
  }
  if (path[0] === "auth" && path[1] === "logout") {
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
  }
  if (upstream.status === 401 && !nextAccess) {
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
  }
  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
