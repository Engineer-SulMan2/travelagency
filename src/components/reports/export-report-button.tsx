"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { downloadCsv } from "@/lib/csv-export";
import { downloadXlsx } from "@/lib/xlsx-export";

type ByProductRow = { type: string; count: number; revenue: number; commission: number };

const PRODUCT_LABELS: Record<string, string> = {
  FLIGHT: "Flights",
  HOTEL: "Hotels",
  PACKAGE: "Packages",
  VISA: "Visa",
};

export function ExportReportButton({ byProduct }: { byProduct: ByProductRow[] }) {
  function buildRows() {
    const headers = ["Product", "Bookings", "Revenue (PKR)", "Commission paid (PKR)"];
    const rows = byProduct.map((p) => [PRODUCT_LABELS[p.type] ?? p.type, p.count, p.revenue, p.commission]);
    return { headers, rows };
  }

  function handleExportCsv() {
    const { headers, rows } = buildRows();
    downloadCsv(`sales-report-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  }

  function handleExportXlsx() {
    const { headers, rows } = buildRows();
    downloadXlsx(`sales-report-${new Date().toISOString().slice(0, 10)}.xlsx`, "Sales Report", headers, rows);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportCsv}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <Download className="h-3.5 w-3.5" /> CSV
      </button>
      <button
        onClick={handleExportXlsx}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
      </button>
    </div>
  );
}