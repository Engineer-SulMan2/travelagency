"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseISO(value: string) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Monday-first day index (0=Mon ... 6=Sun)
function mondayIndex(jsDay: number) {
  return (jsDay + 6) % 7;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Select date",
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
}) {
  const selected = parseISO(value);
  const minDate = min ? parseISO(min) : null;
  const maxDate = max ? parseISO(max) : null;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const [viewDate, setViewDate] = useState<Date>(selected ?? new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setView("days");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function isDisabled(date: Date) {
    const d = toDateOnly(date).getTime();
    if (minDate && d < toDateOnly(minDate).getTime()) return true;
    if (maxDate && d > toDateOnly(maxDate).getTime()) return true;
    return false;
  }

  function selectDay(date: Date) {
    if (isDisabled(date)) return;
    onChange(toISO(date));
    setOpen(false);
    setView("days");
  }

  function goPrev() {
    if (view === "days") setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    else if (view === "years") setViewDate(new Date(viewDate.getFullYear() - 12, viewDate.getMonth(), 1));
  }

  function goNext() {
    if (view === "days") setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    else if (view === "years") setViewDate(new Date(viewDate.getFullYear() + 12, viewDate.getMonth(), 1));
  }

  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const leadingBlanks = mondayIndex(firstOfMonth.getDay());
  const dayCells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1)),
  ];

  const yearRangeStart = viewDate.getFullYear() - 5;
  const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
        <span className={cn(!selected && "text-slate-400")}>
          {selected ? formatDisplay(selected) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/50">
          {view === "days" && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={goPrev} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                  <button
                    type="button"
                    onClick={() => setView("months")}
                    className="rounded-lg px-2 py-1 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {MONTHS[viewDate.getMonth()]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("years")}
                    className="rounded-lg px-2 py-1 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {viewDate.getFullYear()}
                  </button>
                </div>
                <button type="button" onClick={goNext} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
                {WEEKDAYS.map((d, i) => (
                  <span key={i} className="py-1">
                    {d}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {dayCells.map((date, i) => {
                  if (!date) return <span key={i} />;
                  const disabled = isDisabled(date);
                  const isSelected = selected && toISO(date) === toISO(selected);
                  const isToday = toISO(date) === toISO(new Date());
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectDay(date)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm transition",
                        disabled && "cursor-not-allowed text-slate-300",
                        !disabled && !isSelected && "text-slate-700 hover:bg-indigo-50",
                        isSelected && "bg-indigo-600 font-semibold text-white",
                        !isSelected && isToday && !disabled && "font-semibold text-indigo-600"
                      )}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {view === "months" && (
            <>
              <div className="mb-3 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setView("years")}
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-900 transition hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {viewDate.getFullYear()}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setViewDate(new Date(viewDate.getFullYear(), i, 1));
                      setView("days");
                    }}
                    className={cn(
                      "rounded-lg px-2 py-2 text-sm transition",
                      i === viewDate.getMonth()
                        ? "bg-indigo-600 font-semibold text-white"
                        : "text-slate-700 hover:bg-indigo-50"
                    )}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
            </>
          )}

          {view === "years" && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={goPrev} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-slate-900">
                  {years[0]} – {years[years.length - 1]}
                </span>
                <button type="button" onClick={goNext} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewDate(new Date(y, viewDate.getMonth(), 1));
                      setView("months");
                    }}
                    className={cn(
                      "rounded-lg px-2 py-2 text-sm transition",
                      y === viewDate.getFullYear()
                        ? "bg-indigo-600 font-semibold text-white"
                        : "text-slate-700 hover:bg-indigo-50"
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}