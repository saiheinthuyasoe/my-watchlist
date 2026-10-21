"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useWatchlist } from "@/lib/watchlist-context";
import { formatWatchTime } from "@/lib/stats";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function ProfileContent() {
  const { user } = useAuth();
  const { stats, loading } = useWatchlist();

  if (!user) return null;

  // Rendered client-side only (behind AuthGuard), so locale formatting is safe.
  const joined = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "";

  const isPasswordAccount = user.providerData.some(
    (provider) => provider.providerId === "password"
  );

  const avatar = user.photoURL ? (
    <Image
      src={user.photoURL}
      alt=""
      width={72}
      height={72}
      className="h-18 w-18 rounded-2xl object-cover"
    />
  ) : (
    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white">
      {(user.displayName ?? user.email ?? "U").slice(0, 1).toUpperCase()}
    </span>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
          Account
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-muted">
          Your account overview and watching statistics.
        </p>
      </header>

      {/* Account summary */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {avatar}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-fg">
                {user.displayName ?? "Unnamed viewer"}
              </h2>
              {user.emailVerified ? (
                <Badge variant="success">
                  <BadgeCheck className="h-3 w-3" aria-hidden /> Verified
                </Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted">{user.email}</p>
            <p className="mt-1 text-xs text-subtle">
              {isPasswordAccount ? "Email & password account" : "Google account"}
              {joined ? ` · Joined ${joined}` : ""}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-elevated/60 px-4 py-3 text-center">
            <p className="text-lg font-bold tabular-nums text-fg">{stats.total}</p>
            <p className="text-[11px] text-muted">titles tracked</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
          <div>
            <p className="text-sm font-semibold tabular-nums text-fg">
              {stats.episodesWatched}
            </p>
            <p className="text-[11px] text-muted">episodes logged</p>
          </div>
          <div>
            <p className="text-sm font-semibold tabular-nums text-fg">
              {formatWatchTime(stats.minutesWatched)}
            </p>
            <p className="text-[11px] text-muted">time watched</p>
          </div>
          <div>
            <p className="text-sm font-semibold tabular-nums text-fg">
              {stats.averageScore !== null ? `${stats.averageScore}/10` : "—"}
            </p>
            <p className="text-[11px] text-muted">average score</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-fg">Quick actions</h2>
        <div className="mt-4">
          <Link
            href="/insights"
            className="flex items-center gap-3 rounded-lg border border-line bg-elevated/40 p-3 transition hover:border-line-strong hover:bg-elevated"
          >
            <BarChart3 className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden />
            <div>
              <p className="text-sm font-medium text-fg">View Insights</p>
              <p className="text-xs text-subtle">Your viewing patterns</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Watching Stats */}
      {stats.byStatus.watching > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-fg">Currently watching</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-[var(--accent)]">
                {stats.byStatus.watching}
              </p>
              <p className="mt-1 text-xs text-muted">In progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-fg">
                {stats.byStatus.completed}
              </p>
              <p className="mt-1 text-xs text-muted">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-fg">
                {stats.byStatus.plan_to_watch}
              </p>
              <p className="mt-1 text-xs text-muted">Planning</p>
            </div>
          </div>
        </section>
      )}

      <p className="pb-2 text-center text-[11px] text-subtle">
        Metadata and imagery provided by AniList. This app is not affiliated with AniList.
      </p>
    </div>
  );
}
