import { withAuth } from "next-auth/middleware";

export default withAuth({
  // Explicitly pass the secret — withAuth's implicit env resolution can silently
  // fail in Vercel's Node.js middleware runtime, causing getToken() to reject
  // all sessions even when NEXTAUTH_SECRET is set in the environment.
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    // Explicit sign-in path prevents the doubled-domain redirect URL bug
    // when NEXTAUTH_URL is set (absolute URL treated as a path segment).
    signIn: "/auth/signin",
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|auth/signin|_next/static|_next/image|favicon.ico|\\.well-known).*)",
  ],
};
