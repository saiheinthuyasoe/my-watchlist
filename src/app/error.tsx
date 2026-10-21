"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, TriangleAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error", error);
  }, [error]);

  return (
    <div className="app-glow flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-400">
        <TriangleAlert className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
        Something went sideways.
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        An unexpected error interrupted this page. Retrying usually fixes it — your
        watchlist is safe.
      </p>

      {error.digest && (
        <p className="mt-3 rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[11px] text-subtle">
          Reference: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          <RefreshCw className="h-4 w-4" aria-hidden /> Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-fg transition hover:bg-elevated"
        >
          <Home className="h-4 w-4" aria-hidden /> Dashboard
        </Link>
      </div>
    </div>
  );
}
