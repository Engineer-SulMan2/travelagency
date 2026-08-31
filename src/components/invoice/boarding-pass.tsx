import { PlaneTakeoff } from "lucide-react";

export type BoardingPassData = {
  bookingRef: string;
  agencyName: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string; // ISO
  cabinClass: string;
  passengerName: string;
  seat: string;
  gate: string;
  boardingTime: string;
  qrCodeUrl?: string | null;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export function BoardingPass({ data }: { data: BoardingPassData }) {
  return (
    <div className="mx-auto flex max-w-2xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 print:border-0 print:shadow-none">
      {/* Main stub */}
      <div className="flex-1 bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white print:bg-indigo-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlaneTakeoff className="h-5 w-5" />
            <span className="text-sm font-semibold">{data.airline}</span>
          </div>
          <span className="text-xs font-medium uppercase tracking-widest text-indigo-100">Boarding Pass</span>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold tracking-tight">{data.origin}</p>
            <p className="text-xs text-indigo-100">{formatDate(data.departureAt)}</p>
          </div>
          <PlaneTakeoff className="h-6 w-6 rotate-90 text-indigo-200" />
          <div className="text-right">
            <p className="text-3xl font-bold tracking-tight">{data.destination}</p>
            <p className="text-xs text-indigo-100">{formatTime(data.departureAt)}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-indigo-200">Passenger</p>
            <p className="font-semibold">{data.passengerName}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-indigo-200">Flight</p>
            <p className="font-semibold">{data.flightNumber}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-indigo-200">Class</p>
            <p className="font-semibold">{data.cabinClass}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-indigo-200">Boarding</p>
            <p className="font-semibold">{data.boardingTime}</p>
          </div>
        </div>
      </div>

      {/* Perforated stub */}
      <div className="relative w-32 shrink-0 border-l-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center print:bg-white">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">Gate</p>
        <p className="text-2xl font-bold text-slate-900">{data.gate}</p>
        <p className="mt-3 text-[11px] uppercase tracking-wide text-slate-400">Seat</p>
        <p className="text-2xl font-bold text-slate-900">{data.seat}</p>
        <p className="mt-4 font-mono text-[10px] text-slate-400">{data.bookingRef}</p>
        {data.qrCodeUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.qrCodeUrl} alt="Scan to verify booking" className="mx-auto mt-3 h-16 w-16" />
        ) : (
          <div className="mt-3 flex justify-center gap-[2px]">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="h-8 w-[2px] bg-slate-800" style={{ opacity: i % 3 === 0 ? 0.9 : 0.5 }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}