"use client";

import { useEffect, useState } from "react";
import { Shield, Monitor, Trash2, CheckCircle2, XCircle, ShieldOff } from "lucide-react";
import { getMyLoginEvents, getMyTrustedDevices, revokeTrustedDevice, signOutAllMyDevices } from "@/lib/actions/security";

function describeDevice(ua: string | null) {
  if (!ua) return "Unknown device";
  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("Chrome/")
      ? "Chrome"
      : ua.includes("Firefox/")
        ? "Firefox"
        : ua.includes("Safari/")
          ? "Safari"
          : "Browser";
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac OS")
      ? "macOS"
      : ua.includes("Android")
        ? "Android"
        : ua.includes("iPhone") || ua.includes("iPad")
          ? "iOS"
          : "Unknown OS";
  return `${browser} on ${os}`;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type LoginEventRow = { id: string; success: boolean; userAgent: string | null; createdAt: string };
type TrustedDeviceRow = { id: string; userAgent: string | null; createdAt: string; lastUsedAt: string; expiresAt: string };

export function SecurityPanel() {
  const [events, setEvents] = useState<LoginEventRow[]>([]);
  const [devices, setDevices] = useState<TrustedDeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  async function handleSignOutAll() {
    if (!confirm("Sign out of all trusted devices? You'll need OTP again on every one of them.")) return;
    setSigningOutAll(true);
    await signOutAllMyDevices();
    setDevices([]);
    setSigningOutAll(false);
  }

  async function load() {
    const [e, d] = await Promise.all([getMyLoginEvents(), getMyTrustedDevices()]);
    setEvents(e);
    setDevices(d);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRevoke(id: string) {
    setRevokingId(id);
    await revokeTrustedDevice(id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
    setRevokingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <Monitor className="h-4 w-4 text-indigo-600" />
            </span>
            <p className="text-sm font-semibold text-slate-900">Trusted devices</p>
          </div>
          {devices.length > 0 && (
            <button
              onClick={handleSignOutAll}
              disabled={signingOutAll}
              className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
            >
              <ShieldOff className="h-3.5 w-3.5" /> {signingOutAll ? "Signing out..." : "Sign out everywhere"}
            </button>
          )}
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Devices where you chose &quot;Remember this device&quot; skip the OTP step. Remove one to require OTP
          there again.
        </p>

        {loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading...</p>
        ) : devices.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No trusted devices yet.</p>
        ) : (
          <div className="space-y-2">
            {devices.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{describeDevice(d.userAgent)}</p>
                  <p className="text-xs text-slate-400">Last used {timeAgo(d.lastUsedAt)}</p>
                </div>
                <button
                  onClick={() => handleRevoke(d.id)}
                  disabled={revokingId === d.id}
                  className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" /> {revokingId === d.id ? "Removing..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <Shield className="h-4 w-4 text-indigo-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">Recent login activity</p>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading...</p>
        ) : events.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No login activity yet.</p>
        ) : (
          <div className="space-y-1">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50">
                {e.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-900">{describeDevice(e.userAgent)}</p>
                  <p className="text-xs text-slate-400">
                    {e.success ? "Successful sign-in" : "Failed attempt"} · {timeAgo(e.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}