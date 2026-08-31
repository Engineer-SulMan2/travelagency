import Link from "next/link";
import { Bell, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Reminder = { id: string; note: string; dueAt: string; customerName: string | null };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short" });
}

function isOverdue(iso: string) {
  const due = new Date(iso);
  due.setHours(23, 59, 59, 999);
  return due < new Date();
}

export function DueRemindersCard({ reminders }: { reminders: Reminder[] }) {
  if (reminders.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
            <Bell className="h-4 w-4 text-red-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">
            {reminders.length} reminder{reminders.length > 1 ? "s" : ""} due
          </p>
        </div>
        <Link href="/agent/reminders" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-1.5">
        {reminders.slice(0, 4).map((r) => {
          const overdue = isOverdue(r.dueAt);
          return (
            <div key={r.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
              <div className="min-w-0">
                <p className="truncate text-slate-900">{r.note}</p>
                {r.customerName && <p className="text-xs text-slate-400">{r.customerName}</p>}
              </div>
              <span className={cn("shrink-0 text-xs font-medium", overdue ? "text-red-600" : "text-slate-500")}>
                {overdue ? "Overdue" : formatDate(r.dueAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}