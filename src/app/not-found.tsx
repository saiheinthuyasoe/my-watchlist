import Link from "next/link";
import { BookOpen, Globe2, Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="app-glow flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-surface text-subtle">
        <SearchX className="h-7 w-7" aria-hidden />
      </span>
      <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-subtle">
        Error 404
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
        This page left the party.
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        The link may be broken, or the title was removed from the catalogue.
        Try one of these instead.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          <Home className="h-4 w-4" aria-hidden /> Home
        </Link>
        <Link
          href="/anime"
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-fg transition hover:bg-elevated"
        >
          <BookOpen className="h-4 w-4" aria-hidden /> Anime
        </Link>
        <Link
          href="/donghua"
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-fg transition hover:bg-elevated"
        >
          <Globe2 className="h-4 w-4" aria-hidden /> Donghua
        </Link>
      </div>
    </div>
  );
}
