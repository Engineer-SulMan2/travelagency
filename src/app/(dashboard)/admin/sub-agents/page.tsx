import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, UserStatus } from "@prisma/client";
import { AddSubAgentForm } from "@/components/sub-agents/add-sub-agent-form";
import { SubAgentsTable } from "@/components/sub-agents/sub-agents-table";
import { PendingRegistrations } from "@/components/sub-agents/pending-registrations";
import { PendingAdminRequests } from "@/components/sub-agents/pending-admin-requests";
import type { SubAgentRow } from "@/types/sub-agent";

export default async function SubAgentsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SUPER_ADMIN") redirect("/admin/platform");

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin) redirect("/login");

  const [subAgents, pendingUsers, pendingAdmins, agency] = await Promise.all([
    prisma.user.findMany({
      where: { agencyId: admin.agencyId, role: "SUB_AGENT", status: { not: "PENDING" } },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { bookings: true } },
        commissionEntries: { select: { commissionAmount: true } },
      },
    }),
    prisma.user.findMany({
      where: { agencyId: admin.agencyId, role: "SUB_AGENT", status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true },
    }),
    admin.role === Role.AGENCY_ADMIN && admin.status === UserStatus.ACTIVE
      ? prisma.user.findMany({
          where: { role: "AGENCY_ADMIN", status: "PENDING" },
          orderBy: { createdAt: "asc" },
          include: { agency: { select: { name: true } } },
        })
      : Promise.resolve([]),
    admin.agencyId ? prisma.agency.findUnique({ where: { id: admin.agencyId } }) : null,
  ]);

  const rows: SubAgentRow[] = subAgents.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    status: a.status,
    defaultMarkupPct: Number(a.defaultMarkupPct),
    commissionPct: Number(a.commissionPct),
    creditLimit: Number(a.creditLimit),
       walletBalance: Number(a.walletBalance),
    walletLocked: a.walletLocked,
    bookingCount: a._count.bookings,
    totalCommissionEarned: a.commissionEntries.reduce(
      (sum, c) => sum + Number(c.commissionAmount),
      0
    ),
  }));

  const pendingAdminRows = pendingAdmins.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    agencyName: a.agency?.name ?? "a new agency",
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Sub-Agents</h1>
      <p className="mb-6 text-sm text-slate-500">
        Manage sub-agent accounts, their markup &amp; commission rates, and credit limits.
      </p>

      <PendingAdminRequests requests={pendingAdminRows} />
      <PendingRegistrations users={pendingUsers} />

      <div className="mb-5">
        <AddSubAgentForm defaultMarkupPct={Number(agency?.defaultMarkupPct ?? 5)} />
      </div>

      <SubAgentsTable agents={rows} currency={agency?.currency ?? "PKR"} />
    </div>
  );
}