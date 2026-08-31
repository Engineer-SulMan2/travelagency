"use client";

import { useEffect, useRef, useState } from "react";
import { Search, UserCheck, X } from "lucide-react";
import { getMyCustomers } from "@/lib/actions/customers";
import type { CustomerSummary } from "@/types/customer";

export function CustomerSearchSelect({
  onSelect,
  selectedLabel,
  onClear,
  placeholder = "Search saved customers by name or passport...",
}: {
  onSelect: (customer: CustomerSummary) => void;
  selectedLabel?: string | null;
  onClear?: () => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function ensureLoaded() {
    if (loaded) return;
    const data = await getMyCustomers();
    setCustomers(data);
    setLoaded(true);
  }

  const filtered = customers.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return c.fullName.toLowerCase().includes(q) || (c.passportNumber ?? "").toLowerCase().includes(q);
  });

  function handleSelect(c: CustomerSummary) {
    onSelect(c);
    setOpen(false);
    setQuery("");
  }

  if (selectedLabel) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-sm text-indigo-700">
        <UserCheck className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{selectedLabel}</span>
        {onClear && (
          <button type="button" onClick={onClear} className="rounded p-0.5 hover:bg-indigo-100">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            ensureLoaded();
            setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/50">
          {!loaded ? (
            <p className="px-3 py-4 text-center text-xs text-slate-400">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-slate-400">
              No matching customer — fill in the details manually below.
            </p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c)}
                className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition hover:bg-indigo-50"
              >
                <span className="text-sm font-medium text-slate-900">{c.fullName}</span>
                <span className="text-xs text-slate-400">
                  {c.passportNumber ? `Passport: ${c.passportNumber}` : c.phone || c.email || "No extra details"}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}