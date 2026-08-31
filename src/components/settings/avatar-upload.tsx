"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 1_500_000; // ~1.5MB

export function AvatarUpload({
  currentUrl,
  action,
  onRemove,
  shape = "circle",
  fallbackLabel,
}: {
  currentUrl: string | null;
  action: (dataUrl: string) => Promise<{ error?: string; success?: boolean }>;
  onRemove?: () => Promise<{ error?: string; success?: boolean }>;
  shape?: "circle" | "square";
  fallbackLabel: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be under 1.5MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setSaving(true);
      const res = await action(dataUrl);
      setSaving(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    };
    reader.readAsDataURL(file);
  }

  async function handleRemove() {
    if (!onRemove) return;
    setSaving(true);
    setError(null);
    const res = await onRemove();
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setPreview(null);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-100 transition hover:border-indigo-300",
          shape === "circle" ? "rounded-full" : "rounded-xl"
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-semibold text-slate-400">{fallbackLabel}</span>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
          {saving ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
        </div>
      </button>

      <div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? "Uploading..." : "Change image"}
          </button>
          {onRemove && preview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={saving}
              className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">PNG or JPG, up to 1.5MB.</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}