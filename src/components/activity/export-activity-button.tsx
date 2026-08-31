"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { downloadCsv } from "@/lib/csv-export";
import { downloadXlsx } from "@/lib/xlsx-export";

type LogRow = { action: string; description: string; createdAt: string };

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ExportActivityButton({ logs }: { logs: LogRow[] }) {
  function buildRows() {
    const headers = ["Action", "Description", "Date"];
    const rows = logs.map((l) => [l.action, l.description, formatDateTime(l.createdAt)]);
    return { headers, rows };
  }

  function handleExportCsv() {
    const { headers, rows } = buildRows();
    downloadCsv(`activity-log-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  }

  function handleExportXlsx() {
    const { headers, rows } = buildRows();
    downloadXlsx(`activity-log-${new Date().toISOString().slice(0, 10)}.xlsx`, "Activity Log", headers, rows);
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