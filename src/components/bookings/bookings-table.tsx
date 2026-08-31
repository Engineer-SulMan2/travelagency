"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, XCircle, CalendarClock, Download, FileSpreadsheet, Search, X, Ticket, Building2, MessageSquare, Printer, UserRound } from "lucide-react";
import { cancelBooking } from "@/lib/actions/cancel-booking";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { AmendBookingModal } from "@/components/bookings/amend-booking-modal";
import { BookingNotesModal } from "@/components/bookings/booking-notes-modal";
import { downloadCsv } from "@/lib/csv-export";
import { downloadXlsx } from "@/lib/xlsx-export";
import { formatCurrency } from "@/lib/currency";
import { WhatsAppShareButton } from "@/components/shared/whatsapp-share-button";
import type { BookingSummary, ProductType } from "@/types/booking-summary";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

function rowKey(b: BookingSummary) {
  return `${b.type}-${b.id}`;
}

const TYPE_LABELS: Record<ProductType, string> = {
  FLIGHT: "Flight",
  HOTEL: "Hotel",
  PACKAGE: "Package",
  VISA: "Visa",
};

const TYPE_STYLES: Record<ProductType, string> = {
  FLIGHT: "bg-sky-50 text-sky-700",
  HOTEL: "bg-violet-50 text-violet-700",
  PACKAGE: "bg-amber-50 text-amber-700",
  VISA: "bg-rose-50 text-rose-700",
};

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-50 text-red-700",
};

const selectClass =
  "rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";

export function BookingsTable({
  bookings,
  showBookedBy,
  currency = "PKR",
}: {
  bookings: BookingSummary[];
  showBookedBy: boolean;
  currency?: string;
}) {
  const router = useRouter();
  const formatMoney = (n: number) => formatCurrency(n, currency);
  const [typeFilter, setTypeFilter] = useState<"ALL" | ProductType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "CONFIRMED" | "CANCELLED">("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [amendingBooking, setAmendingBooking] = useState<BookingSummary | null>(null);
  const [notesBooking, setNotesBooking] = useState<BookingSummary | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCancelling, setBulkCancelling] = useState(false);

  const filtered = useMemo(
    () =>
      bookings.filter((b) => {
        if (typeFilter !== "ALL" && b.type !== typeFilter) return false;
        if (statusFilter !== "ALL" && b.status !== statusFilter) return false;

        const bookedAt = new Date(b.createdAt);
        if (fromDate && bookedAt < new Date(`${fromDate}T00:00:00`)) return false;
        if (toDate && bookedAt > new Date(`${toDate}T23:59:59`)) return false;

        const q = searchQuery.trim().toLowerCase();
        if (q) {
          const haystack = `${b.bookingRef} ${b.title} ${b.subtitle} ${b.bookedBy}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        return true;
      }),
    [bookings, typeFilter, statusFilter, fromDate, toDate, searchQuery]
  );

  const hasDateFilter = fromDate || toDate;
  const selectedBookings = filtered.filter((b) => selected.has(rowKey(b)));
  const allFilteredSelected = filtered.length > 0 && filtered.every((b) => selected.has(rowKey(b)));

  async function handleCancel(b: BookingSummary) {
    if (!confirm(`Cancel booking ${b.bookingRef}?`)) return;
    setCancellingId(b.id);
    await cancelBooking(b.type, b.id);
    setCancellingId(null);
    router.refresh();
  }

  function clearDates() {
    setFromDate("");
    setToDate("");
  }

  function toRows(list: BookingSummary[]) {
    const headers = ["Reference", "Type", "Details", "Booked By", "Date", "Amount (PKR)", "Status"];
    const rows = list.map((b) => [
      b.bookingRef,
      TYPE_LABELS[b.type],
      `${b.title} — ${b.subtitle}`,
      b.bookedBy,
      formatDate(b.createdAt),
      b.totalAmount,
      b.status,
    ]);
    return { headers, rows };
  }

  function handleExportCsv(list: BookingSummary[]) {
    const { headers, rows } = toRows(list);
    downloadCsv(`bookings-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  }

  function handleExportXlsx(list: BookingSummary[]) {
    const { headers, rows } = toRows(list);
    downloadXlsx(`bookings-${new Date().toISOString().slice(0, 10)}.xlsx`, "Bookings", headers, rows);
  }

  function handleExportInvoices(list: BookingSummary[]) {
    const items = list.map((b) => `${b.type}:${b.id}`).join(",");
    window.open(`/invoice/bulk?items=${encodeURIComponent(items)}`, "_blank");
  }

  function toggleRow(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        filtered.forEach((b) => next.delete(rowKey(b)));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((b) => next.add(rowKey(b)));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function handleBulkCancel() {
    const cancellable = selectedBookings.filter((b) => b.status !== "CANCELLED");
    if (cancellable.length === 0) return;
    if (!confirm(`Cancel ${cancellable.length} selected booking${cancellable.length > 1 ? "s" : ""}?`)) return;

    setBulkCancelling(true);
    for (const b of cancellable) {
      await cancelBooking(b.type, b.id);
    }
    setBulkCancelling(false);
    clearSelection();
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference or name..."
            className="w-56 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className={selectClass}
        >
          <option value="ALL">All types</option>
          <option value="FLIGHT">Flights</option>
          <option value="HOTEL">Hotels</option>
          <option value="PACKAGE">Packages</option>
          <option value="VISA">Visa</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className={selectClass}
        >
          <option value="ALL">All statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <div className="w-36">
          <DatePicker value={fromDate} onChange={setFromDate} max={toDate || undefined} placeholder="From date" />
        </div>
        <span className="pb-2.5 text-slate-300">–</span>
        <div className="w-36">
          <DatePicker value={toDate} onChange={setToDate} min={fromDate || undefined} placeholder="To date" />
        </div>

        {hasDateFilter && (
          <button
            onClick={clearDates}
            className="pb-2.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            Clear dates
          </button>
        )}

        <button
          onClick={() => handleExportCsv(filtered)}
          className="mb-0.5 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
        <button
          onClick={() => handleExportXlsx(filtered)}
          className="mb-0.5 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
        </button>

        <span className="ml-auto pb-2.5 text-xs text-slate-400">
          {filtered.length} of {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        </span>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <span className="text-sm font-medium text-indigo-700">{selected.size} selected</span>
          <button
            onClick={() => handleExportCsv(selectedBookings)}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button
            onClick={() => handleExportXlsx(selectedBookings)}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Export Excel
          </button>
          <button
            onClick={() => handleExportInvoices(selectedBookings)}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
          >
            <Printer className="h-3.5 w-3.5" /> Export Invoices
          </button>
          <button
            onClick={handleBulkCancel}
            disabled={bulkCancelling}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
          >
            <XCircle className="h-3.5 w-3.5" />
            {bulkCancelling ? "Cancelling..." : "Cancel selected"}
          </button>
          <button
            onClick={clearSelection}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            <X className="h-3.5 w-3.5" /> Clear selection
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No bookings match these filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <th className="w-8 pb-3 pr-2">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                  />
                </th>
                <th className="pb-3 pr-4">Reference</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Details</th>
                {showBookedBy && <th className="pb-3 pr-4">Booked by</th>}
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const key = rowKey(b);
                const isSelected = selected.has(key);
                return (
                  <tr
                    key={key}
                    className={cn(
                      "border-b border-slate-50 text-sm transition-colors last:border-0 hover:bg-slate-50/60",
                      isSelected && "bg-indigo-50/40"
                    )}
                  >
                    <td className="py-3.5 pr-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(key)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                      />
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-xs font-medium text-slate-900">{b.bookingRef}</td>
                    <td className="py-3.5 pr-4">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", TYPE_STYLES[b.type])}>
                        {TYPE_LABELS[b.type]}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <p className="text-slate-900">{b.title}</p>
                      <p className="text-xs text-slate-400">{b.subtitle}</p>
                    </td>
                    {showBookedBy && <td className="py-3.5 pr-4 text-slate-700">{b.bookedBy}</td>}
                    <td className="py-3.5 pr-4 text-slate-500">{formatDate(b.createdAt)}</td>
                    <td className="py-3.5 pr-4 font-medium text-slate-900">{formatMoney(b.totalAmount)}</td>
                    <td className="py-3.5 pr-4">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[b.status])}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/invoice/${b.type.toLowerCase()}/${b.id}`}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                        >
                          <FileText className="h-3.5 w-3.5" /> Invoice
                        </Link>
                        <Link
                          href={`/trip-summary/${b.type.toLowerCase()}/${b.id}`}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                        >
                          <UserRound className="h-3.5 w-3.5" /> Trip Summary
                        </Link>
                        <WhatsAppShareButton
                          url={`/trip-summary/${b.type.toLowerCase()}/${b.id}`}
                          message={`Hi! Here's your trip summary for ${b.bookingRef}:`}
                        />
                        {b.type === "FLIGHT" && b.status !== "CANCELLED" && (
                          <Link
                            href={`/boarding-pass/${b.id}`}
                            className="flex items-center gap-1 rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-600 transition hover:bg-violet-50"
                          >
                            <Ticket className="h-3.5 w-3.5" /> Boarding Pass
                          </Link>
                        )}
                        {b.type === "HOTEL" && b.status !== "CANCELLED" && (
                          <Link
                            href={`/hotel-voucher/${b.id}`}
                            className="flex items-center gap-1 rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-600 transition hover:bg-violet-50"
                          >
                            <Building2 className="h-3.5 w-3.5" /> Voucher
                          </Link>
                        )}
                        <button
                          onClick={() => setNotesBooking(b)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Notes
                        </button>
                        {b.status === "CONFIRMED" && (
                          <button
                            onClick={() => setAmendingBooking(b)}
                            className="flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
                          >
                            <CalendarClock className="h-3.5 w-3.5" /> Amend
                          </button>
                        )}
                        {b.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleCancel(b)}
                            disabled={cancellingId === b.id}
                            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            {cancellingId === b.id ? "Cancelling..." : "Cancel"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {amendingBooking && (
        <AmendBookingModal booking={amendingBooking} onClose={() => setAmendingBooking(null)} />
      )}

      {notesBooking && (
        <BookingNotesModal
          productType={notesBooking.type}
          referenceId={notesBooking.id}
          bookingRef={notesBooking.bookingRef}
          onClose={() => setNotesBooking(null)}
        />
      )}
    </div>
  );
}