import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const agency = user?.agencyId
    ? await prisma.agency.findUnique({ where: { id: user.agencyId }, select: { logoUrl: true } })
    : null;

  return (
    <DashboardShell
      role={session.user.role}
      userName={session.user.name ?? session.user.email ?? ""}
      avatarUrl={user?.image}
      logoUrl={agency?.logoUrl}
    >
      {children}
    </DashboardShell>
  );
}