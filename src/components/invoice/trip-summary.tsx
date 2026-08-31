import { PlaneTakeoff, User } from "lucide-react";
import type { TripSummaryData } from "@/lib/trip-summary-data";

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-50 text-red-700",
};

export function TripSummary({ data }: { data: TripSummaryData }) {
  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 print:border-0 print:shadow-none">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white print:bg-indigo-600">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <PlaneTakeoff className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-100">Trip Summary</p>
            <p className="font-mono text-sm font-semibold">{data.bookingRef}</p>
          </div>
        </div>
        <p className="mt-6 text-2xl font-bold leading-snug tracking-tight">{data.description}</p>
        <span
          className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[data.status] ?? "bg-white/20"}`}
        >
          {data.status}
        </span>
      </div>

      <div className="p-8">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
            <User className="h-3 w-3" /> Traveler(s)
          </p>
          <p className="text-sm font-medium text-slate-900">
            {data.travelerNames.length > 0 ? data.travelerNames.join(", ") : "—"}
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Thank you for booking with <span className="font-medium text-slate-700">{data.agencyName}</span>.
          <br />
          Have a wonderful trip!
        </p>
      </div>
    </div>
  );
}