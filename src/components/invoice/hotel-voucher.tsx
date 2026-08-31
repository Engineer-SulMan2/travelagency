import { Building2, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export type HotelVoucherData = {
  bookingRef: string;
  agencyName: string;
  currency?: string;
  stampUrl?: string | null;
  hotelName: string;
  city: string;
  roomType: string;
  checkIn: string; // ISO
  checkOut: string; // ISO
  nights: number;
  rooms: number;
  guestNames: string[];
  totalAmount: number;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export function HotelVoucher({ data }: { data: HotelVoucherData }) {
  const formatMoney = (n: number) => formatCurrency(n, data.currency ?? "PKR");

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 print:border-0 print:shadow-none">
      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white print:bg-violet-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-violet-100">Hotel Voucher</p>
              <p className="font-mono text-sm font-semibold">{data.bookingRef}</p>
            </div>
          </div>
          {data.stampUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.stampUrl} alt="Stamp" className="h-12 w-12 object-contain opacity-90" />
          )}
        </div>

        <p className="mt-6 text-2xl font-bold tracking-tight">{data.hotelName}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-violet-100">
          <MapPin className="h-3.5 w-3.5" /> {data.city}
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-y-4 rounded-xl bg-slate-50 p-4 text-sm">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Check-in</p>
            <p className="mt-0.5 font-medium text-slate-900">{formatDate(data.checkIn)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Check-out</p>
            <p className="mt-0.5 font-medium text-slate-900">{formatDate(data.checkOut)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Room type</p>
            <p className="mt-0.5 font-medium text-slate-900">{data.roomType}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Nights / Rooms</p>
            <p className="mt-0.5 font-medium text-slate-900">
              {data.nights} night{data.nights > 1 ? "s" : ""} · {data.rooms} room{data.rooms > 1 ? "s" : ""}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Guest(s)</p>
            <p className="mt-0.5 font-medium text-slate-900">{data.guestNames.join(", ")}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3">
          <span className="text-sm font-semibold text-violet-700">Total paid</span>
          <span className="text-lg font-bold text-violet-700">{formatMoney(data.totalAmount)}</span>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Present this voucher at check-in. Issued by {data.agencyName}.
        </p>
      </div>
    </div>
  );
}