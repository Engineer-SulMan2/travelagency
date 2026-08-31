import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      agencyId: string | null;
      parentId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    agencyId?: string | null;
    parentId?: string | null;
  }
}
