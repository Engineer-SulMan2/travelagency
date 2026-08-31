import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getReminders } from "@/lib/actions/reminders";
import { AddReminderForm } from "@/components/reminders/add-reminder-form";
import { RemindersList } from "@/components/reminders/reminders-list";

export default async function AgentRemindersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const reminders = await getReminders("mine");

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Reminders</h1>
      <p className="mb-6 text-sm text-slate-500">Follow-ups for your customers — only visible to you.</p>

      <div className="mb-5">
        <AddReminderForm />
      </div>

      <RemindersList reminders={reminders} showOwner={false} />
    </div>
  );
}