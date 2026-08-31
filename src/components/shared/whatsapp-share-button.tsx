"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppShareButton({ url, message }: { url: string; message: string }) {
  function handleShare() {
    const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    const text = encodeURIComponent(`${message}\n\n${fullUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50"
    >
      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
    </button>
  );
}