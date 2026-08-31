"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle, ImagePlus, Calendar, CalendarOff } from "lucide-react";
import { togglePackageActive, updatePackageExpiry } from "@/lib/actions/packages";
import { cn } from "@/lib/utils";
import { PackageImagesModal } from "./package-images-modal";
import { formatCurrency } from "@/lib/currency";

type Row = {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  basePrice: number;
  category: string;
  isActive: boolean;
  bookingCount: number;
  images: string[];
  maxSeats: number | null;
  bookedSeats: number;
  validUntil: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  HOLIDAY: "Holiday",
  TOUR: "Tour",
  UMRAH: "Umrah",
  GROUP: "Group",
};

const CATEGORY_STYLES: Record<string, string> = {
  HOLIDAY: "bg-slate-100 text-slate-600",
  TOUR: "bg-sky-50 text-sky-700",
  UMRAH: "bg-emerald-50 text-emerald-700",
  GROUP: "bg-amber-50 text-amber-700",
};

export function ManagePackageRow({ pkg, currency = "PKR" }: { pkg: Row; currency?: string }) {
  const formatMoney = (n: number) => formatCurrency(n, currency);
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [editingExpiry, setEditingExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState(pkg.validUntil ?? "");
  const [savingExpiry, setSavingExpiry] = useState(false);

  const isExpired = pkg.validUntil != null && new Date(pkg.validUntil) < new Date();

  async function handleSaveExpiry() {
    setSavingExpiry(true);
    await updatePackageExpiry(pkg.id, expiryDate || null);
    setSavingExpiry(false);
    setEditingExpiry(false);
    router.refresh();
  }

  async function handleToggle() {
    setToggling(true);
    const res = await togglePackageActive(pkg.id);
    setToggling(false);
    if (!res.error) router.refresh();
  }

  return (
    <>
      <tr className="border-b border-slate-100 last:border-0">
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2.5">
            {pkg.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pkg.images[0]} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
                <ImagePlus className="h-4 w-4" />
              </span>
            )}
            <div>
              <p className="text-sm font-medium text-slate-900">{pkg.title}</p>
              <p className="text-xs text-slate-500">{pkg.destination} · {pkg.durationDays} days</p>
            </div>
          </div>
        </td>
        <td className="py-3 pr-4">
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", CATEGORY_STYLES[pkg.category])}>
            {CATEGORY_LABELS[pkg.category] ?? pkg.category}
          </span>
        </td>
        <td className="py-3 pr-4 text-sm text-slate-700">{formatMoney(pkg.basePrice)}</td>
        <td className="py-3 pr-4 text-sm text-slate-700">
          {pkg.maxSeats == null ? "Unlimited" : `${Math.max(0, pkg.maxSeats - pkg.bookedSeats)} / ${pkg.maxSeats}`}
        </td>
        <td className="py-3 pr-4 text-sm text-slate-700">{pkg.bookingCount}</td>
        <td className="py-3 pr-4">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              pkg.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            )}
          >
            {pkg.isActive ? "Active" : "Inactive"}
          </span>
          {isExpired && (
            <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
              <CalendarOff className="h-3 w-3" /> Expired
            </span>
          )}
        </td>
        <td className="py-3 pr-4">
          {editingExpiry ? (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-32 rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-slate-500"
              />
              <button
                onClick={handleSaveExpiry}
                disabled={savingExpiry}
                className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
              >
                {savingExpiry ? "..." : "Save"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingExpiry(true)}
              className={cn(
                "flex items-center gap-1 text-xs font-medium hover:underline",
                isExpired ? "text-red-600" : "text-slate-500"
              )}
            >
              <Calendar className="h-3 w-3" />
              {pkg.validUntil ? new Date(pkg.validUntil).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "No expiry"}
            </button>
          )}
        </td>
        <td className="py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImagesOpen(true)}
              className="flex items-center gap-1 rounded-md border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              <ImagePlus className="h-3.5 w-3.5" /> Photos
            </button>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
            >
              {pkg.isActive ? (
                <>
                  <Ban className="h-3.5 w-3.5" /> Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5" /> Activate
                </>
              )}
            </button>
          </div>
        </td>
      </tr>

      {imagesOpen && (
        <PackageImagesModal packageId={pkg.id} images={pkg.images} onClose={() => setImagesOpen(false)} />
      )}
    </>
  );
}