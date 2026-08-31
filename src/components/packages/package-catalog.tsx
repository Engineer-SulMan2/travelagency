import type { PackageSummary } from "@/types/package";
import { PackageCard } from "./package-card";

export function PackageCatalog({
  packages,
  markupPct,
  currency = "PKR",
}: {
  packages: PackageSummary[];
  markupPct: number;
  currency?: string;
}) {
  if (packages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No packages available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {packages.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} markupPct={markupPct} currency={currency} />
      ))}
    </div>
  );
}