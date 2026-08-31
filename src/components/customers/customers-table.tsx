"use client";

import { useMemo, useState } from "react";
import { Contact, Tag, Search } from "lucide-react";
import type { CustomerSummary } from "@/types/customer";
import { CustomerRow } from "./customer-row";

export function CustomersTable({ customers, repeatNames = new Set() }: { customers: CustomerSummary[]; repeatNames?: Set<string> }) {
  const [tagFilter, setTagFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const allTags = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => (c.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [customers]);

  const filtered = customers.filter((c) => {
    if (tagFilter !== "ALL" && !(c.tags ?? []).includes(tagFilter)) return false;

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const haystack = `${c.fullName} ${c.phone ?? ""} ${c.email ?? ""} ${c.passportNumber ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Contact className="h-6 w-6 text-indigo-600" />
        </div>
        <p className="mt-4 text-sm text-slate-500">No customers yet. Add your first one above.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        <span className="text-xs text-slate-400">
          {filtered.length} of {customers.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Phone</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Passport</th>
              <th className="pb-3 pr-4">Tags</th>
              <th className="pb-3 pr-4">Points</th>
              <th className="pb-3 pr-4">Added</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <CustomerRow key={c.id} customer={c} isRepeat={repeatNames.has(c.fullName.trim().toLowerCase())} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}