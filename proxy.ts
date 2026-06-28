// Next.js 16 Proxy (formerly "middleware"): a presence check on the session
// cookie that gates the app. The real authorization is the cinc server's ACLs;
// this only keeps unauthenticated users out of the UI shell.
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("cinc_console");
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");

  if (!hasSession && !isAuthPage) {
    // Remember where they were headed so login can send them back (e.g. after
    // the session cookie expires mid-session).
    const url = new URL("/login", request.url);
    const from = request.nextUrl.pathname + request.nextUrl.search;
    if (from !== "/") url.searchParams.set("from", from);
    return NextResponse.redirect(url);
  }
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL(safeFrom(request) ?? "/orgs", request.url));
  }
  return NextResponse.next();
}

/**
 * The `from` query param, but only when it's an internal absolute path — guards
 * against an open redirect (`//evil.com`, `https://…`).
 */
function safeFrom(request: NextRequest): string | null {
  const from = request.nextUrl.searchParams.get("from");
  return from && from.startsWith("/") && !from.startsWith("//") ? from : null;
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets
  // (including public images like the login logo, which must load while
  // unauthenticated).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|ico|webp)).*)",
  ],
};
