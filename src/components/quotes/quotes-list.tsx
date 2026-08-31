"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, CheckCircle2, Copy } from "lucide-react";
import { updateQuoteStatus, deleteQuote, type QuoteRow } from "@/lib/actions/quotes";
import { WhatsAppShareButton } from "@/components/shared/whatsapp-share-button";
import { cn } from "@/lib/utils";

function formatMoney(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-sky-50 text-sky-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  EXPIRED: "bg-red-50 text-red-700",
};

export function QuotesList({ quotes }: { quotes: QuoteRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAccept(id: string) {
    setBusyId(id);
    await updateQuoteStatus(id, "ACCEPTED");
    setBusyId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this quote?")) return;
    setBusyId(id);
    await deleteQuote(id);
    setBusyId(null);
    router.refresh();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/quote/${token}`;
    navigator.clipboard.writeText(url);
  }

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <FileText className="h-6 w-6 text-indigo-600" />
        </div>
        <p className="mt-4 text-sm text-slate-500">No quotes yet. Create one above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {quotes.map((q) => (
        <div key={q.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{q.title}</p>
              <p className="text-xs text-slate-500">
                {q.customerName}
                {q.customerContact && ` · ${q.customerContact}`} · {formatDate(q.createdAt)}
              </p>
            </div>
            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[q.status])}>
              {q.status}
            </span>
          </div>

          {q.description && <p className="mb-2 text-sm text-slate-600">{q.description}</p>}

          <p className="mb-3 text-lg font-semibold text-slate-900">{formatMoney(q.amount)}</p>

          <div className="flex flex-wrap items-center gap-2">
            <WhatsAppShareButton
              url={`/quote/${q.shareToken}`}
              message={`Hi ${q.customerName}! Here's your quote for "${q.title}":`}
            />
            <button
              onClick={() => copyLink(q.shareToken)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <Copy className="h-3.5 w-3.5" /> Copy link
            </button>
            {q.status !== "ACCEPTED" && (
              <button
                onClick={() => handleAccept(q.id)}
                disabled={busyId === q.id}
                className="flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Mark accepted
              </button>
            )}
            <button
              onClick={() => handleDelete(q.id)}
              disabled={busyId === q.id}
              className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}