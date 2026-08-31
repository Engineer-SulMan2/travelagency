import { headers } from "next/headers";
import QRCode from "qrcode";

// Builds an absolute URL to the public /track page, pre-filled with the
// booking reference, then renders it as a QR code (base64 PNG data URL).
// Scanning it still requires entering the last name on /track — the QR
// is a convenience shortcut, not a bypass of that check.
export async function generateVerifyQrDataUrl(bookingRef: string): Promise<string | null> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") ?? "localhost:3000";
    const proto = headersList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    const url = `${proto}://${host}/track?ref=${encodeURIComponent(bookingRef)}`;

    return await QRCode.toDataURL(url, { width: 220, margin: 1 });
  } catch {
    return null;
  }
}