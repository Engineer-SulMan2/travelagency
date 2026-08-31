import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlatformSubAgentsTable } from "@/components/platform/platform-sub-agents-table";
import { Users } from "lucide-react";

export default async function PlatformSubAgentsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/admin");

  const subAgents = await prisma.user.findMany({
    where: { role: "SUB_AGENT", status: { not: "PENDING" } },
    orderBy: { createdAt: "desc" },
    include: { agency: { select: { name: true } } },
  });

  const rows = subAgents.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    status: a.status,
    agencyName: a.agency?.name ?? "—",
  }));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Sub-Agents (Platform)</h1>
      <p className="mb-6 text-sm text-slate-500">
        Every sub-agent across every agency. As the platform owner you can only suspend or reactivate an
        account — rates, deletion, and other management stay with each agency&apos;s own admin.
      </p>

      <div className="mb-5 flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-xs text-indigo-700">
        <Users className="h-4 w-4 shrink-0" />
        {rows.length} sub-agent{rows.length !== 1 ? "s" : ""} on the platform
      </div>

      <PlatformSubAgentsTable agents={rows} />
    </div>
  );
}