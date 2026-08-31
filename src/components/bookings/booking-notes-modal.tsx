"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, StickyNote, Trash2, Send } from "lucide-react";
import { getBookingNotes, addBookingNote, deleteBookingNote, type BookingNoteRow } from "@/lib/actions/booking-notes";
import type { ProductType } from "@prisma/client";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function BookingNotesModal({
  productType,
  referenceId,
  bookingRef,
  onClose,
}: {
  productType: ProductType;
  referenceId: string;
  bookingRef: string;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<BookingNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getBookingNotes(productType, referenceId).then((n) => {
      setNotes(n);
      setLoading(false);
    });
  }, [productType, referenceId]);

  async function handleAdd() {
    if (!draft.trim()) return;
    setSending(true);
    const res = await addBookingNote(productType, referenceId, draft);
    setSending(false);
    if (!res.error) {
      setDraft("");
      const fresh = await getBookingNotes(productType, referenceId);
      setNotes(fresh);
    }
  }

  async function handleDelete(id: string) {
    await deleteBookingNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-slate-100 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <StickyNote className="h-4 w-4 text-indigo-600" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Internal notes</p>
              <p className="font-mono text-xs text-slate-400">{bookingRef}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-400">Loading...</p>
          ) : notes.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No notes yet — visible only to your team.</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm text-slate-700">{n.note}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    {n.authorName} · {timeAgo(n.createdAt)}
                  </p>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="rounded p-0.5 text-slate-300 hover:text-red-600"
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder="Add a note for your team..."
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <button
              onClick={handleAdd}
              disabled={sending || !draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-40"
              aria-label="Send note"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}