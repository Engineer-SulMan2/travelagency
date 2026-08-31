import { PlaneTakeoff } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

type LineItem = { description: string; qty: number; unitPrice: number; amount: number };

export type InvoiceData = {
  bookingRef: string;
  invoiceNumber?: number | null;
  typeLabel: string; // "Flight" / "Hotel" / "Package"
  status: string;
  issuedAt: string;
  agencyName: string;
  currency?: string;
  taxId?: string | null;
  stampUrl?: string | null;
  policyText?: string | null;
  termsAndConditions?: string | null;
  qrCodeUrl?: string | null;
  bookedBy: string;
  travelerNames: string[];
  lineItems: LineItem[];
  totalAmount: number;
};

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-50 text-red-700",
};

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const formatMoney = (n: number) => formatCurrency(n, data.currency ?? "PKR");

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 print:border-0 print:shadow-none">
      <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-600 print:hidden" />

      <div className="p-8">
        <div className="flex items-start justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm print:bg-indigo-600">
              <PlaneTakeoff className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight text-slate-900">{data.agencyName}</p>
              <p className="text-xs text-slate-400">
                Travel Agency SaaS{data.taxId ? ` · Tax ID: ${data.taxId}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Invoice</p>
              <p className="mt-1 font-mono text-sm font-medium text-slate-900">{data.bookingRef}</p>
              {data.invoiceNumber != null && (
                <p className="font-mono text-xs text-slate-500">
                  INV-{String(data.invoiceNumber).padStart(6, "0")}
                </p>
              )}
              <p className="text-xs text-slate-400">{data.issuedAt}</p>
            </div>
            {data.qrCodeUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.qrCodeUrl} alt="Scan to verify booking" className="h-16 w-16 shrink-0" />
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-y-4 rounded-xl bg-slate-50 p-4 text-sm print:bg-transparent print:p-0">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Booking type</p>
            <p className="mt-0.5 font-medium text-slate-900">{data.typeLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Status</p>
            <span
              className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[data.status] ?? "bg-slate-100 text-slate-600"}`}
            >
              {data.status}
            </span>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Booked by</p>
            <p className="mt-0.5 font-medium text-slate-900">{data.bookedBy}</p>
          </div>
          {data.travelerNames.length > 0 && (
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Traveler(s)</p>
              <p className="mt-0.5 font-medium text-slate-900">{data.travelerNames.join(", ")}</p>
            </div>
          )}
        </div>

        <table className="mt-8 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <th className="pb-2.5">Description</th>
              <th className="pb-2.5 text-right">Qty</th>
              <th className="pb-2.5 text-right">Unit price</th>
              <th className="pb-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-3 pr-3 text-slate-700">{item.description}</td>
                <td className="py-3 text-right text-slate-700">{item.qty}</td>
                <td className="py-3 text-right text-slate-700">{formatMoney(item.unitPrice)}</td>
                <td className="py-3 text-right font-medium text-slate-900">{formatMoney(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.policyText && (
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 print:bg-transparent print:border print:border-slate-200">
            <span className="font-semibold text-slate-600">Cancellation policy: </span>
            {data.policyText}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-3">
          {data.stampUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.stampUrl} alt="Stamp" className="h-16 w-16 object-contain opacity-90" />
          )}
          <div className="flex w-56 items-center justify-between rounded-xl bg-indigo-50 px-4 py-3 print:border print:border-indigo-200 print:bg-transparent">
            <span className="text-sm font-semibold text-indigo-700">Total</span>
            <span className="text-lg font-bold text-indigo-700">{formatMoney(data.totalAmount)}</span>
          </div>
        </div>

        {data.termsAndConditions && (
          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Terms &amp; Conditions
            </p>
            <p className="whitespace-pre-line text-xs leading-relaxed text-slate-500">
              {data.termsAndConditions}
            </p>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-slate-400">
          This is a system-generated invoice. Thank you for booking with {data.agencyName}.
        </p>
      </div>
    </div>
  );
}