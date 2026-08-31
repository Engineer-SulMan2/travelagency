import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { History } from "lucide-react";
import { ExportActivityButton } from "@/components/activity/export-activity-button";

const ACTION_LABELS: Record<string, string> = {
  SUB_AGENT_CREATED: "Sub-agent created",
  SUB_AGENT_MARKUP_UPDATED: "Rate updated",
  SUB_AGENT_STATUS_CHANGED: "Status changed",
  AGENCY_MARKUP_UPDATED: "Agency markup updated",
  WALLET_ADJUSTED: "Wallet adjusted",
  BOOKING_CANCELLED: "Booking cancelled",
  BOOKING_AMENDED: "Booking amended",
  BOOKING_APPROVED: "Booking approved",
  BOOKING_REJECTED: "Booking rejected",
  PAYOUT_BATCH_CREATED: "Payout batch created",
  PACKAGE_CREATED: "Package created",
  PACKAGE_STATUS_CHANGED: "Package status changed",
};

const ACTION_STYLES: Record<string, string> = {
  SUB_AGENT_CREATED: "bg-indigo-50 text-indigo-700",
  SUB_AGENT_MARKUP_UPDATED: "bg-amber-50 text-amber-700",
  SUB_AGENT_STATUS_CHANGED: "bg-rose-50 text-rose-700",
  AGENCY_MARKUP_UPDATED: "bg-amber-50 text-amber-700",
  WALLET_ADJUSTED: "bg-emerald-50 text-emerald-700",
  BOOKING_CANCELLED: "bg-red-50 text-red-700",
  BOOKING_AMENDED: "bg-indigo-50 text-indigo-700",
  BOOKING_APPROVED: "bg-emerald-50 text-emerald-700",
  BOOKING_REJECTED: "bg-red-50 text-red-700",
  PAYOUT_BATCH_CREATED: "bg-violet-50 text-violet-700",
  PACKAGE_CREATED: "bg-sky-50 text-sky-700",
  PACKAGE_STATUS_CHANGED: "bg-sky-50 text-sky-700",
};

function formatDateTime(d: Date) {
  return d.toLocaleString("en-PK", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function ActivityLogPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!admin) redirect("/login");

  const logs = await prisma.activityLog.findMany({
    where: { agencyId: admin.agencyId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const logRows = logs.map((l) => ({
    action: ACTION_LABELS[l.action] ?? l.action,
    description: l.description,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Activity Log</h1>
          <p className="text-sm text-slate-500">
            Audit trail of sub-agent, wallet, and booking changes across your agency.
          </p>
        </div>
        {logs.length > 0 && <ExportActivityButton logs={logRows} />}
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <History className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="mt-4 text-sm text-slate-500">No activity yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50">
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_STYLES[log.action] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {ACTION_LABELS[log.action] ?? log.action}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-900">{log.description}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}