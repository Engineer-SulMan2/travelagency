import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getReminders } from "@/lib/actions/reminders";
import { AddReminderForm } from "@/components/reminders/add-reminder-form";
import { RemindersList } from "@/components/reminders/reminders-list";

export default async function AdminRemindersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SUPER_ADMIN") redirect("/admin/platform");

  const reminders = await getReminders("agency");

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Reminders</h1>
      <p className="mb-6 text-sm text-slate-500">Every follow-up reminder across your agency, including sub-agents'.</p>

      <div className="mb-5">
        <AddReminderForm />
      </div>

      <RemindersList reminders={reminders} showOwner />
    </div>
  );
}