"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Ban, CheckCircle, BarChart2, Trash2, ShieldOff, Lock, Unlock } from "lucide-react";
import { updateSubAgentSettings, toggleSubAgentStatus, deleteSubAgent, toggleWalletLock } from "@/lib/actions/sub-agents";
import { forceSignOutUser } from "@/lib/actions/security";
import type { SubAgentRow } from "@/types/sub-agent";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

export function SubAgentRowItem({ agent, currency = "PKR" }: { agent: SubAgentRow; currency?: string }) {
  const formatMoney = (n: number) => formatCurrency(n, currency);
  const router = useRouter();
  const [markupPct, setMarkupPct] = useState(agent.defaultMarkupPct);
  const [commissionPct, setCommissionPct] = useState(agent.commissionPct);
  const [creditLimit, setCreditLimit] = useState(agent.creditLimit);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [walletLocking, setWalletLocking] = useState(false);
  const [walletLocked, setWalletLocked] = useState(agent.walletLocked);

  async function handleToggleWalletLock() {
    setWalletLocking(true);
    const res = await toggleWalletLock(agent.id);
    setWalletLocking(false);
    if (!res.error) {
      setWalletLocked((prev) => !prev);
    }
    router.refresh();
  }

  async function handleForceSignOut() {
    if (!confirm(`Sign ${agent.name} out of all trusted devices? They'll need OTP again next time.`)) return;
    setSigningOut(true);
    await forceSignOutUser(agent.id);
    setSigningOut(false);
  }
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (
      !confirm(
        `Permanently delete ${agent.name}? This cannot be undone. If they have any bookings, customers or inquiries, this will fail — suspend them instead.`
      )
    )
      return;
    setDeleting(true);
    setError(null);
    const res = await deleteSubAgent(agent.id);
    setDeleting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  const dirty =
    markupPct !== agent.defaultMarkupPct ||
    commissionPct !== agent.commissionPct ||
    creditLimit !== agent.creditLimit;

  const inputClass =
    "w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await updateSubAgentSettings({ userId: agent.id, markupPct, commissionPct, creditLimit });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function handleToggleStatus() {
    setTogglingStatus(true);
    const res = await toggleSubAgentStatus(agent.id);
    setTogglingStatus(false);
    if (!res.error) router.refresh();
  }

  return (
    <tr className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60">
      <td className="py-3.5 pr-4">
        <p className="text-sm font-medium text-slate-900">{agent.name}</p>
        <p className="text-xs text-slate-400">{agent.email}</p>
        <Link
          href={`/admin/sub-agents/${agent.id}`}
          className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          <BarChart2 className="h-3 w-3" /> Performance
        </Link>
      </td>

      <td className="py-3.5 pr-4">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            agent.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          )}
        >
          {agent.status}
        </span>
      </td>

      <td className="py-3.5 pr-4">
        <input
          type="number"
          step="0.1"
          min={0}
          max={100}
          value={markupPct}
          onChange={(e) => setMarkupPct(Number(e.target.value))}
          className={inputClass}
        />
      </td>

      <td className="py-3.5 pr-4">
        <input
          type="number"
          step="0.1"
          min={0}
          max={100}
          value={commissionPct}
          onChange={(e) => setCommissionPct(Number(e.target.value))}
          className={inputClass}
        />
      </td>

      <td className="py-3.5 pr-4">
        <input
          type="number"
          step="1000"
          min={0}
          value={creditLimit}
          onChange={(e) => setCreditLimit(Number(e.target.value))}
          className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </td>

      <td className="py-3.5 pr-4 text-sm text-slate-700">{agent.bookingCount}</td>
      <td className="py-3.5 pr-4 text-sm font-medium text-emerald-600">{formatMoney(agent.totalCommissionEarned)}</td>
      <td className="py-3.5 pr-4 text-sm text-slate-700">
        {formatMoney(agent.walletBalance)}
        {walletLocked && (
          <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
            <Lock className="h-2.5 w-2.5" /> Locked
          </span>
        )}
      </td>

      <td className="py-3.5">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
          >
            {agent.status === "ACTIVE" ? (
              <>
                <Ban className="h-3.5 w-3.5" /> Suspend
              </>
            ) : (
              <>
                <CheckCircle className="h-3.5 w-3.5" /> Activate
              </>
            )}
          </button>
          <button
            onClick={handleForceSignOut}
            disabled={signingOut}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
          >
            <ShieldOff className="h-3.5 w-3.5" /> {signingOut ? "Signing out..." : "Force sign-out"}
          </button>
          <button
            onClick={handleToggleWalletLock}
            disabled={walletLocking}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
          >
            {walletLocked ? (
              <>
                <Unlock className="h-3.5 w-3.5" /> {walletLocking ? "Unlocking..." : "Unlock wallet"}
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" /> {walletLocking ? "Locking..." : "Lock wallet"}
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" /> {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}