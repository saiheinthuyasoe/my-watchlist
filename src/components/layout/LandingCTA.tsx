"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard } from "lucide-react";

export function LandingHeaderActions() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-9 w-32 animate-pulse rounded-lg bg-elevated" aria-hidden />;
  }

  if (user) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
      >
        <LayoutDashboard className="h-4 w-4" aria-hidden /> Dashboard
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/auth/login"
        className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:text-fg"
      >
        Sign in
      </Link>
      <Link
        href="/auth/register"
        className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
      >
        Get started
      </Link>
    </div>
  );
}

export function LandingHeroActions() {
  const { user, loading } = useAuth();
  const target = user ? "/dashboard" : "/auth/register";
  const label = user ? "Open your dashboard" : "Start tracking — free";

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href={loading ? "/auth/register" : target}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-white shadow-[0_16px_40px_-16px_rgba(124,58,237,0.8)] transition hover:bg-accent-hover"
      >
        {label}
      </Link>
      <Link
        href="/anime"
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong px-6 py-3.5 text-base font-semibold text-fg transition hover:bg-elevated"
      >
        Browse anime
      </Link>
    </div>
  );
}
