"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Clock } from "lucide-react";

const INACTIVITY_LIMIT_MINUTES = 20;
const WARNING_SECONDS = 60;

// Tracks mouse/keyboard/touch activity anywhere in the dashboard. If
// nothing happens for INACTIVITY_LIMIT_MINUTES, the user is signed out —
// with a warning modal in the final WARNING_SECONDS so an idle-but-present
// user can stay signed in with one click. This is separate from the JWT
// session's own absolute expiry (which doesn't reset on activity).
export function InactivityTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);
  const lastActivityRef = useRef(Date.now());
  const warningShownRef = useRef(false);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (warningShownRef.current) {
      warningShownRef.current = false;
      setShowWarning(false);
      setSecondsLeft(WARNING_SECONDS);
    }
  }, []);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetActivity, { passive: true }));

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - lastActivityRef.current;
      const limitMs = INACTIVITY_LIMIT_MINUTES * 60 * 1000;
      const warningStartMs = limitMs - WARNING_SECONDS * 1000;

      if (elapsedMs >= limitMs) {
        signOut({ callbackUrl: "/login" });
        return;
      }

      if (elapsedMs >= warningStartMs) {
        warningShownRef.current = true;
        setShowWarning(true);
        setSecondsLeft(Math.max(0, Math.ceil((limitMs - elapsedMs) / 1000)));
      }
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetActivity));
      clearInterval(interval);
    };
  }, [resetActivity]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
          </span>
          <p className="text-sm font-semibold text-slate-900">You&apos;ve been inactive</p>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          For your security, you&apos;ll be signed out in{" "}
          <span className="font-semibold text-slate-900">{secondsLeft}s</span> due to inactivity.
        </p>
        <button
          onClick={resetActivity}
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
}