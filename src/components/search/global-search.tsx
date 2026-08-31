"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileText, Contact, Users } from "lucide-react";
import { globalSearch, type GlobalSearchResult } from "@/lib/actions/global-search";

const EMPTY: GlobalSearchResult = { bookings: [], customers: [], subAgents: [] };

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult>(EMPTY);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const data = await globalSearch(value);
      setResults(data);
      setLoading(false);
    }, 300);
  }

  function go(href: string) {
    setOpen(false);
    setQuery("");
    setResults(EMPTY);
    router.push(href);
  }

  const hasResults = results.bookings.length > 0 || results.customers.length > 0 || results.subAgents.length > 0;

  return (
    <div className="relative w-full max-w-xs" ref={ref}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search bookings, customers..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
        {query && (
          <button
            onClick={() => handleChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/50">
          {loading ? (
            <p className="px-3 py-6 text-center text-xs text-slate-400">Searching...</p>
          ) : !hasResults ? (
            <p className="px-3 py-6 text-center text-xs text-slate-400">No results found.</p>
          ) : (
            <>
              {results.bookings.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Bookings</p>
                  {results.bookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => go(b.href)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition hover:bg-indigo-50"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{b.title}</p>
                        <p className="font-mono text-xs text-slate-400">{b.bookingRef}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.customers.length > 0 && (
                <div className="mb-1">
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Customers</p>
                  {results.customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => go(c.href)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition hover:bg-indigo-50"
                    >
                      <Contact className="h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{c.fullName}</p>
                        {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {results.subAgents.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sub-Agents</p>
                  {results.subAgents.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => go(a.href)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition hover:bg-indigo-50"
                    >
                      <Users className="h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{a.name}</p>
                        <p className="truncate text-xs text-slate-400">{a.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}