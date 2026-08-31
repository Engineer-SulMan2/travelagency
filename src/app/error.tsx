"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-sm font-medium text-red-500">Something went wrong</p>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">Unexpected error</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Try again, or head back to the dashboard if the problem persists.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
