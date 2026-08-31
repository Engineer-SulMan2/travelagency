"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Trash2, Download } from "lucide-react";
import { uploadMyDocument, deleteMyDocument } from "@/lib/actions/documents";

const MAX_FILE_SIZE = 3_000_000; // ~3MB

type DocRow = { id: string; name: string; fileType: string; fileData: string; createdAt: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export function MyDocumentsSection({ documents }: { documents: DocRow[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError("File must be under 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setUploading(true);
      const res = await uploadMyDocument(file.name, file.type || "application/octet-stream", dataUrl);
      setUploading(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this document?")) return;
    setDeletingId(id);
    await deleteMyDocument(id);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <FileText className="h-4 w-4 text-indigo-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">My documents</p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-40"
        >
          <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading..." : "Upload"}
        </button>
        <input ref={inputRef} type="file" onChange={handleFileChange} className="hidden" />
      </div>

      <p className="mb-4 text-xs text-slate-500">
        Keep your own ID, license, or certificates here — visible only to you and your agency admin.
      </p>

      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

      {documents.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{d.name}</p>
                <p className="text-xs text-slate-400">Uploaded {formatDate(d.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={d.fileData}
                  download={d.name}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                  aria-label="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={deletingId === d.id}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
