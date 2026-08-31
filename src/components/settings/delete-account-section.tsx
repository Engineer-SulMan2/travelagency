"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { deleteMyAccount } from "@/lib/actions/account";

export function DeleteAccountSection() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const res = await deleteMyAccount();
    if (res.error) {
      setDeleting(false);
      setError(res.error);
      return;
    }
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </span>
        <p className="text-sm font-semibold text-red-900">Danger zone</p>
      </div>
      <p className="mb-4 text-xs text-red-700">
        Permanently delete your account. This cannot be undone — you&apos;ll need to sign up again to use the
        platform.
      </p>

      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete my account
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Yes, permanently delete"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}