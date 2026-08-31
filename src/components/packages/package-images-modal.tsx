"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { addPackageImage, removePackageImage } from "@/lib/actions/packages";

const MAX_FILE_SIZE = 1_500_000;

export function PackageImagesModal({
  packageId,
  images,
  onClose,
}: {
  packageId: string;
  images: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localImages, setLocalImages] = useState(images);
  const [uploading, setUploading] = useState(false);
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
      setUploading(true);
      const res = await addPackageImage(packageId, dataUrl);
      setUploading(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      setLocalImages((prev) => [...prev, dataUrl]);
      router.refresh();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleRemove(index: number) {
    setError(null);
    const res = await removePackageImage(packageId, index);
    if (res.error) {
      setError(res.error);
      return;
    }
    setLocalImages((prev) => prev.filter((_, i) => i !== index));
    router.refresh();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <ImageIcon className="h-4 w-4 text-indigo-600" />
            </span>
            <p className="text-sm font-semibold text-slate-900">Package photos</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {localImages.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => handleRemove(i)}
                className="absolute right-1 top-1 rounded-lg bg-black/50 p-1 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Remove image"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {localImages.length < 3 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-slate-400 transition hover:border-indigo-300 hover:text-indigo-500 disabled:opacity-50"
            >
              <Upload className="h-5 w-5" />
              <span className="text-[11px] font-medium">{uploading ? "Uploading..." : "Add photo"}</span>
            </button>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-400">Up to 3 photos, PNG or JPG, under 1.5MB each.</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>,
    document.body
  );
}