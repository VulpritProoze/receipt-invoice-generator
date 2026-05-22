import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    // Explicitly set sign-in page so the middleware constructs the correct
    // redirect URL without doubling the domain (NEXTAUTH_URL + absolute path bug).
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
