"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { downloadCsv } from "@/lib/csv-export";
import { downloadXlsx } from "@/lib/xlsx-export";

type Row = {
  bookingRef: string;
  type: string;
  title: string;
  createdAt: string;
  totalAmount: number;
  status: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export function ExportMySalesButton({ bookings }: { bookings: Row[] }) {
  function buildRows() {
    const headers = ["Reference", "Type", "Details", "Date", "Amount (PKR)", "Status"];
    const rows = bookings.map((b) => [b.bookingRef, b.type, b.title, formatDate(b.createdAt), b.totalAmount, b.status]);
    return { headers, rows };
  }

  function handleCsv() {
    const { headers, rows } = buildRows();
    downloadCsv(`my-sales-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  }

  function handleXlsx() {
    const { headers, rows } = buildRows();
    downloadXlsx(`my-sales-${new Date().toISOString().slice(0, 10)}.xlsx`, "My Sales", headers, rows);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCsv}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <Download className="h-3.5 w-3.5" /> CSV
      </button>
      <button
        onClick={handleXlsx}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
      </button>
    </div>
  );
}