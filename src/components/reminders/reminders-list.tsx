"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, Bell } from "lucide-react";
import { toggleReminderComplete, deleteReminder, type ReminderRow } from "@/lib/actions/reminders";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(iso: string, completed: boolean) {
  if (completed) return false;
  const due = new Date(iso);
  due.setHours(23, 59, 59, 999);
  return due < new Date();
}

export function RemindersList({ reminders, showOwner }: { reminders: ReminderRow[]; showOwner: boolean }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleToggle(id: string) {
    setBusyId(id);
    await toggleReminderComplete(id);
    setBusyId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    await deleteReminder(id);
    setBusyId(null);
    router.refresh();
  }

  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Bell className="h-6 w-6 text-indigo-600" />
        </div>
        <p className="mt-4 text-sm text-slate-500">No reminders yet. Add one above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reminders.map((r) => {
        const overdue = isOverdue(r.dueAt, r.completed);
        return (
          <div
            key={r.id}
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm",
              r.completed ? "border-slate-100 opacity-60" : overdue ? "border-red-200" : "border-slate-100"
            )}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => handleToggle(r.id)}
                disabled={busyId === r.id}
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                  r.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400"
                )}
                aria-label={r.completed ? "Mark incomplete" : "Mark complete"}
              >
                {r.completed && <Check className="h-3 w-3" />}
              </button>
              <div>
                <p className={cn("text-sm font-medium text-slate-900", r.completed && "line-through")}>{r.note}</p>
                <p className="text-xs text-slate-500">
                  {r.customerName && <span>{r.customerName} · </span>}
                  {showOwner && <span>{r.createdByName} · </span>}
                  <span className={overdue ? "font-medium text-red-600" : ""}>
                    {overdue ? "Overdue — " : "Due "}
                    {formatDate(r.dueAt)}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(r.id)}
              disabled={busyId === r.id}
              className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              aria-label="Delete reminder"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}