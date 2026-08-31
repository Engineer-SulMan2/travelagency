"use client";

import { useEffect, useState } from "react";
import { Users2, ShieldOff, CheckCircle2, XCircle, Monitor } from "lucide-react";
import { getAgencyLoginEvents, getAgencyTrustedDevices, forceSignOutUser } from "@/lib/actions/security";

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

type LoginEventRow = { id: string; userName: string; success: boolean; userAgent: string | null; createdAt: string };
type TrustedDeviceRow = { id: string; userId: string; userName: string; userAgent: string | null; lastUsedAt: string };

export function TeamSecurityPanel() {
  const [events, setEvents] = useState<LoginEventRow[]>([]);
  const [devices, setDevices] = useState<TrustedDeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function load() {
    const [e, d] = await Promise.all([getAgencyLoginEvents(), getAgencyTrustedDevices()]);
    setEvents(e);
    setDevices(d);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleForceSignOut(userId: string, userName: string) {
    if (!confirm(`Sign ${userName} out of all trusted devices? They'll need OTP again next time.`)) return;
    setBusyUserId(userId);
    await forceSignOutUser(userId);
    setDevices((prev) => prev.filter((d) => d.userId !== userId));
    setBusyUserId(null);
  }

  // One row per team member with an active trusted device, since that's
  // the unit "force sign-out" actually acts on.
  const uniqueUsers = Array.from(new Map(devices.map((d) => [d.userId, d.userName])).entries());

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <Users2 className="h-4 w-4 text-indigo-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">Team — trusted devices</p>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Force a team member to sign in with OTP again everywhere — useful if a device is lost or stolen.
        </p>

        {loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading...</p>
        ) : uniqueUsers.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No one on your team has a trusted device.</p>
        ) : (
          <div className="space-y-2">
            {uniqueUsers.map(([userId, userName]) => {
              const userDevices = devices.filter((d) => d.userId === userId);
              return (
                <div key={userId} className="rounded-xl border border-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">{userName}</p>
                    <button
                      onClick={() => handleForceSignOut(userId, userName)}
                      disabled={busyUserId === userId}
                      className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
                      <ShieldOff className="h-3.5 w-3.5" />
                      {busyUserId === userId ? "Signing out..." : "Force sign-out"}
                    </button>
                  </div>
                  <div className="mt-1.5 space-y-0.5">
                    {userDevices.map((d) => (
                      <p key={d.id} className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Monitor className="h-3 w-3" /> {describeDevice(d.userAgent)} · last used {timeAgo(d.lastUsedAt)}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <Users2 className="h-4 w-4 text-indigo-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">Team — recent login activity</p>
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
                  <p className="text-sm text-slate-900">
                    {e.userName} <span className="text-slate-400">· {describeDevice(e.userAgent)}</span>
                  </p>
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