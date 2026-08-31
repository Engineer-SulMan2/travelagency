import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        if (user.status !== "ACTIVE") {
          throw new Error(
            user.status === "PENDING"
              ? "Your account is awaiting admin approval."
              : "Account is not active. Contact your agency admin."
          );
        }

        // A suspended agency (Super Admin oversight action) blocks every
        // user in it from signing in. There's no approval gate — agencies
        // get full access immediately on registration.
        if (user.agencyId) {
          const agency = await prisma.agency.findUnique({ where: { id: user.agencyId } });
          if (agency && !agency.isActive) {
            throw new Error("Your agency has been suspended. Contact platform support.");
          }
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          agencyId: user.agencyId,
          parentId: user.parentId,
        };
      },
    }),
  ],
});