"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound, Save } from "lucide-react";
import { updateProfileName } from "@/lib/actions/profile";

export function EditProfileForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dirty = value.trim() !== name && value.trim().length > 0;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    const res = await updateProfileName(value);
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <UserRound className="h-4 w-4 text-indigo-600" />
        </span>
        <p className="text-sm font-semibold text-slate-900">Profile details</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClass}>Full name</label>
          <input value={value} onChange={(e) => setValue(e.target.value)} className={fieldClass} />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input value={email} disabled className={`${fieldClass} cursor-not-allowed opacity-60`} />
          <p className="mt-1 text-xs text-slate-400">Your email is your login ID and can&apos;t be changed here.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm font-medium text-emerald-600">Saved</p>}

        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save name"}
        </button>
      </div>
    </div>
  );
}