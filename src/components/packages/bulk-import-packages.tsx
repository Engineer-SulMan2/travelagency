"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { FileSpreadsheet } from "lucide-react";
import { bulkImportPackages } from "@/lib/actions/packages";

type SheetRow = Record<string, unknown>;

export function BulkImportPackages() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<SheetRow>(sheet);

        const rows = json.map((r) => ({
          title: String(r.Title ?? r.title ?? "").trim(),
          destination: String(r.Destination ?? r.destination ?? "").trim(),
          durationDays: Number(r["Duration Days"] ?? r.durationDays ?? 0),
          description: String(r.Description ?? r.description ?? "").trim(),
          inclusions: String(r.Inclusions ?? r.inclusions ?? "").trim(),
          basePrice: Number(r["Base Price"] ?? r.basePrice ?? 0),
          category: String(r.Category ?? r.category ?? "HOLIDAY").trim().toUpperCase(),
        }));

        const res = await bulkImportPackages(rows);
        setImporting(false);
        if (res.error) {
          setResult(res.error);
          return;
        }
        setResult(
          `Imported ${res.imported} package${res.imported === 1 ? "" : "s"}${
            res.skipped ? `, skipped ${res.skipped} invalid row${res.skipped === 1 ? "" : "s"}` : ""
          }.`
        );
        router.refresh();
      } catch {
        setImporting(false);
        setResult("Couldn't read that file. Make sure it's a valid .xlsx file.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={importing}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
      >
        <FileSpreadsheet className="h-4 w-4" />
        {importing ? "Importing..." : "Bulk import from Excel"}
      </button>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
      {result && <p className="mt-2 text-xs text-slate-500">{result}</p>}
      <p className="mt-1 text-[11px] text-slate-400">
        Columns: Title, Destination, Duration Days, Description, Inclusions (comma-separated), Base Price, Category
      </p>
    </div>
  );
}