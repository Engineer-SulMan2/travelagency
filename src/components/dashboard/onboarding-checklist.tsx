import Link from "next/link";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

type ChecklistItem = { label: string; done: boolean; href: string };

export function OnboardingChecklist({ items }: { items: ChecklistItem[] }) {
  const doneCount = items.filter((i) => i.done).length;
  if (doneCount === items.length) return null;

  const pct = Math.round((doneCount / items.length) * 100);

  return (
    <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Get your agency set up</p>
            <p className="text-xs text-slate-500">
              {doneCount} of {items.length} steps done
            </p>
          </div>
        </div>
        <span className="text-sm font-semibold text-indigo-700">{pct}%</span>
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
              item.done ? "bg-white/60 text-slate-400" : "bg-white text-slate-700 shadow-sm hover:shadow-md"
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-slate-300" />
            )}
            <span className={item.done ? "line-through" : ""}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}