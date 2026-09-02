import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// A separate, Prisma-free NextAuth instance just for middleware — it only
// reads/verifies the JWT session cookie (no database access needed for
// that), so it's safe to run in the Edge Runtime.
const { auth } = NextAuth(authConfig);

const ADMIN_ROLES = ["SUPER_ADMIN", "AGENCY_ADMIN"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
  const isAdminArea = nextUrl.pathname.startsWith("/admin");
  const isAgentArea = nextUrl.pathname.startsWith("/agent");

  // Not logged in -> block dashboard areas
  if (!isLoggedIn && (isAdminArea || isAgentArea)) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in but hitting login/register -> send to their dashboard
  if (isLoggedIn && isAuthPage) {
    const dest = (ADMIN_ROLES as string[]).includes(role ?? "") ? "/admin" : "/agent";
    return NextResponse.redirect(new URL(dest, nextUrl));
  }

  // Sub-agent trying to reach admin-only area
  if (isAdminArea && !(ADMIN_ROLES as string[]).includes(role ?? "")) {
    return NextResponse.redirect(new URL("/agent", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/agent/:path*", "/login", "/register"],
};