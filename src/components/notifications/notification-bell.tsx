"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell, Check, Trash2, X } from "lucide-react";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  type NotificationItem,
} from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    const data = await getMyNotifications();
    setNotifications(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleOpenNotification(n: NotificationItem) {
    if (!n.isRead) {
      await markNotificationRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    setOpen(false);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotification(id);
  }

  async function handleClearAll() {
    if (!confirm("Clear all notifications? This can't be undone.")) return;
    setNotifications([]);
    await clearAllNotifications();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" /> Clear all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet.</p>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div
                    className={cn(
                      "group relative flex items-start gap-2 border-b border-slate-50 px-4 py-3 pr-9 text-left transition hover:bg-slate-50 last:border-0",
                      !n.isRead && "bg-indigo-50/40"
                    )}
                  >
                    <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", !n.isRead ? "bg-indigo-600" : "bg-transparent")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, n.id)}
                      className="absolute right-2.5 top-3 rounded-lg p-1 text-slate-300 opacity-0 transition hover:bg-slate-200 hover:text-slate-600 group-hover:opacity-100"
                      aria-label="Delete notification"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );

                return n.link ? (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => handleOpenNotification(n)}
                    className="block"
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpenNotification(n)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleOpenNotification(n);
                    }}
                    className="cursor-pointer"
                  >
                    {content}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}