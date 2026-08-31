import type { NextAuthConfig } from "next-auth";

// Edge-safe config shared by both the full auth instance (auth.ts, used by
// API routes/server components) and the lightweight middleware instance
// (middleware.ts). Keeping this file free of Prisma/bcrypt imports is what
// lets middleware run in the Edge Runtime — Prisma 7's pg driver adapter
// uses Node's `crypto` module, which Edge Runtime doesn't support.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [], // Credentials provider (needs Prisma) is added only in auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.agencyId = user.agencyId;
        token.parentId = user.parentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.agencyId = token.agencyId as string | null;
        session.user.parentId = token.parentId as string | null;
      }
      return session;
    },
  },
};