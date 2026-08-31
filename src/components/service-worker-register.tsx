"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability just won't be offered if this fails — not worth
        // surfacing to the user.
      });
    }
  }, []);

  return null;
}