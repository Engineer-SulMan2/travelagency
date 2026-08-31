"use client";

import { useState } from "react";
import { User, Palette, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Icons live here (not passed from the server) — component references
// can't cross the server/client boundary as plain props.
const TAB_ICONS: Record<string, React.ElementType> = {
  profile: User,
  branding: Palette,
  business: Building2,
};

type Tab = { id: string; label: string };

export function SettingsTabs({
  tabs,
  panels,
}: {
  tabs: Tab[];
  panels: Record<string, React.ReactNode>;
}) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.id] ?? User;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition",
                active === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      {panels[active]}
    </div>
  );
}