import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.agencyId = (user as any).agencyId;
        token.parentId = (user as any).parentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = (token.id as string) || token.sub || "";
        (session.user as any).role = token.role;
        (session.user as any).agencyId = token.agencyId;
        (session.user as any).parentId = token.parentId;
      }
      return session;
    },
  },
};