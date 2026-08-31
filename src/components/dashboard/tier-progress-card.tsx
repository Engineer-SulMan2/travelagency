import { Award } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { TierProgress } from "@/lib/tier-progress";

export function TierProgressCard({ progress, currency }: { progress: TierProgress; currency: string }) {
  if (!progress.enabled) return null;

  const formatMoney = (n: number) => formatCurrency(n, currency);

  if (!progress.currentTier && !progress.nextTier) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <Award className="h-4 w-4 text-amber-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">Commission tier</p>
        </div>
        <p className="text-xs text-slate-500">
          No tiers set up yet by your agency — your fixed commission rate applies.
        </p>
      </div>
    );
  }

  const progressPct = progress.nextTier
    ? Math.min(100, Math.round((progress.monthRevenue / progress.nextTier.minRevenue) * 100))
    : 100;
  const remaining = progress.nextTier ? Math.max(0, progress.nextTier.minRevenue - progress.monthRevenue) : 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <Award className="h-4 w-4 text-amber-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">Commission tier</p>
        </div>
        {progress.currentTier && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            {progress.currentTier.label} · {progress.currentTier.commissionPct}%
          </span>
        )}
      </div>

      <p className="mb-2 text-xs text-slate-500">
        {formatMoney(progress.monthRevenue)} in sales this month
        {progress.currentTier ? "" : " — keep going to unlock your first tier"}
      </p>

      {progress.nextTier && (
        <>
          <div className="mb-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs text-slate-500">
            {formatMoney(remaining)} more to reach <span className="font-medium text-slate-700">{progress.nextTier.label}</span>{" "}
            ({progress.nextTier.commissionPct}% commission)
          </p>
        </>
      )}

      {!progress.nextTier && progress.currentTier && (
        <p className="text-xs font-medium text-emerald-600">You&apos;ve reached the top tier this month 🎉</p>
      )}
    </div>
  );
}