"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, Pencil, Star, Plus, Minus, MessageCircle, Repeat } from "lucide-react";
import { updateCustomer, deleteCustomer } from "@/lib/actions/customers";
import { adjustLoyaltyPoints } from "@/lib/actions/loyalty";
import { CustomerNotesModal } from "./customer-notes-modal";
import type { CustomerSummary } from "@/types/customer";

const TAG_COLORS = [
  "bg-indigo-50 text-indigo-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-sky-50 text-sky-700",
];

function tagColor(tag: string) {
  let hash = 0;
  for (const ch of tag) hash = (hash * 31 + ch.charCodeAt(0)) % TAG_COLORS.length;
  return TAG_COLORS[hash];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export function CustomerRow({ customer, isRepeat = false }: { customer: CustomerSummary; isRepeat?: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(customer.fullName);
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [email, setEmail] = useState(customer.email ?? "");
  const [passportNumber, setPassportNumber] = useState(customer.passportNumber ?? "");
  const [tags, setTags] = useState((customer.tags ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustingPoints, setAdjustingPoints] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  async function handlePoints(delta: number) {
    setAdjustingPoints(true);
    await adjustLoyaltyPoints(customer.id, delta);
    setAdjustingPoints(false);
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await updateCustomer({
      id: customer.id,
      fullName,
      phone,
      email,
      passportNumber,
      notes: customer.notes ?? "",
      tags,
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Remove ${customer.fullName} from your customer list?`)) return;
    setDeleting(true);
    const res = await deleteCustomer(customer.id);
    setDeleting(false);
    if (!res.error) router.refresh();
  }

  if (editing) {
    return (
      <tr className="border-b border-slate-50 last:border-0">
        <td className="py-3 pr-4">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </td>
        <td className="py-3 pr-4">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </td>
        <td className="py-3 pr-4">
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </td>
        <td className="py-3 pr-4">
          <input value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} className={inputClass} />
        </td>
        <td className="py-3 pr-4">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="VIP, Corporate"
            className={inputClass}
          />
        </td>
        <td className="py-3 pr-4 text-sm text-slate-400">{customer.loyaltyPoints} pts</td>
        <td className="py-3 pr-4 text-sm text-slate-400">{formatDate(customer.createdAt)}</td>
        <td className="py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <>
    <tr className="border-b border-slate-50 text-sm transition-colors last:border-0 hover:bg-slate-50/60">
      <td className="py-3.5 pr-4 font-medium text-slate-900">
        {customer.fullName}
        {isRepeat && (
          <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">
            <Repeat className="h-2.5 w-2.5" /> Repeat
          </span>
        )}
      </td>
      <td className="py-3.5 pr-4 text-slate-600">{customer.phone || "—"}</td>
      <td className="py-3.5 pr-4 text-slate-600">{customer.email || "—"}</td>
      <td className="py-3.5 pr-4 text-slate-600">{customer.passportNumber || "—"}</td>
      <td className="py-3.5 pr-4">
        {(customer.tags ?? []).length === 0 ? (
          <span className="text-slate-300">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {(customer.tags ?? []).map((t) => (
              <span key={t} className={`rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(t)}`}>
                {t}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            <Star className="h-3 w-3" /> {customer.loyaltyPoints}
          </span>
          <button
            onClick={() => handlePoints(10)}
            disabled={adjustingPoints}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 disabled:opacity-40"
            aria-label="Add 10 points"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={() => handlePoints(-10)}
            disabled={adjustingPoints || customer.loyaltyPoints === 0}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-40"
            aria-label="Subtract 10 points"
          >
            <Minus className="h-3 w-3" />
          </button>
        </div>
      </td>
      <td className="py-3.5 pr-4 text-slate-400">{formatDate(customer.createdAt)}</td>
      <td className="py-3.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNotesOpen(true)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Log
          </button>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" /> {deleting ? "Removing..." : "Remove"}
          </button>
        </div>
      </td>
    </tr>
    {notesOpen && (
      <CustomerNotesModal
        customerId={customer.id}
        customerName={customer.fullName}
        onClose={() => setNotesOpen(false)}
      />
    )}
    </>
  );
}