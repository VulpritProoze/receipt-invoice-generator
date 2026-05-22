import { NextRequest, NextFetchEvent } from "next/server";
import nextAuthMiddleware, { NextRequestWithAuth } from "next-auth/middleware";

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  return nextAuthMiddleware(req as NextRequestWithAuth, event);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
