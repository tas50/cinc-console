// Next.js 16 Proxy (formerly "middleware"): a presence check on the session
// cookie that gates the app. The real authorization is the cinc server's ACLs;
// this only keeps unauthenticated users out of the UI shell.
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("cinc_console");
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");

  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/orgs", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets
  // (including public images like the login logo, which must load while
  // unauthenticated).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|ico|webp)).*)",
  ],
};
