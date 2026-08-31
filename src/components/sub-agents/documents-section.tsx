"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Trash2, Download } from "lucide-react";
import { uploadSubAgentDocument, deleteSubAgentDocument } from "@/lib/actions/documents";

const MAX_FILE_SIZE = 3_000_000; // ~3MB

type DocRow = { id: string; name: string; fileType: string; fileData: string; createdAt: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export function DocumentsSection({ userId, documents }: { userId: string; documents: DocRow[] }) {
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
      const res = await uploadSubAgentDocument(userId, file.name, file.type || "application/octet-stream", dataUrl);
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
    await deleteSubAgentDocument(id);
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
          <p className="text-sm font-semibold text-slate-900">Documents</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading..." : "Upload"}
        </button>
        <input ref={inputRef} type="file" onChange={handleFileChange} className="hidden" />
      </div>

      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

      {documents.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">No documents uploaded yet — contracts, ID cards, etc.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{doc.name}</p>
                <p className="text-xs text-slate-400">{formatDate(doc.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                
                  href={doc.fileData}
                  download={doc.name}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                 <a>
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
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