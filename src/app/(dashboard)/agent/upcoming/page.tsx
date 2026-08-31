import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUpcomingTravel, formatTravelDate } from "@/lib/upcoming-travel-query";
import { CalendarClock } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  FLIGHT: "Flight",
  HOTEL: "Hotel",
  PACKAGE: "Package",
  VISA: "Visa",
};

const TYPE_STYLES: Record<string, string> = {
  FLIGHT: "bg-sky-50 text-sky-700",
  HOTEL: "bg-violet-50 text-violet-700",
  PACKAGE: "bg-amber-50 text-amber-700",
  VISA: "bg-rose-50 text-rose-700",
};

function daysUntil(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

export default async function AgentUpcomingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const items = await getUpcomingTravel({ userId: session.user.id });

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">Upcoming Travel</h1>
      <p className="mb-6 text-sm text-slate-500">Your customers' travel dates in the next 60 days, soonest first.</p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <CalendarClock className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="mt-4 text-sm text-slate-500">Nothing coming up in the next 60 days.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[item.type]}`}>
                  {TYPE_LABELS[item.type]}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.travelerName} · {item.bookingRef}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-indigo-700">{daysUntil(item.travelDate)}</p>
                <p className="text-xs text-slate-400">{formatTravelDate(new Date(item.travelDate))}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}