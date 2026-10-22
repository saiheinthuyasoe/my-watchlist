"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Globe2,
  PauseCircle,
  Play,
  Plus,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { OPEN_PALETTE_EVENT } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { useWatchlist } from "@/lib/watchlist-context";
import { formatWatchTime } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { WATCH_STATUS_LABELS, type WatchlistItem, type WatchStatus } from "@/types/watchlist";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, StatsSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProgressBar } from "@/components/watchlist/ProgressBar";
import { WatchlistCard } from "@/components/watchlist/WatchlistCard";
import { EditWatchlistModal } from "@/components/watchlist/EditWatchlistModal";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  accent: string;
  href?: string;
}

function StatCard({ icon: Icon, label, value, accent, href }: StatCardProps) {
  const content = (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition hover:border-line-strong sm:p-4">
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10", accent)}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold tabular-nums text-fg sm:text-xl">{value}</p>
        <p className="truncate text-xs text-muted">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function ContinueCard({
  item,
  onBump,
}: {
  item: WatchlistItem;
  onBump: (item: WatchlistItem) => void;
}) {
  const title = item.titleEnglish ?? item.title;
  const finished =
    item.totalEpisodes !== null && item.currentEpisode >= item.totalEpisodes;

  return (
    <article className="flex w-full shrink-0 gap-3 rounded-xl border border-line bg-surface p-2.5 transition hover:border-line-strong sm:w-[280px]">
      <Link
        href={`/title/${item.anilistId}`}
        className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-elevated sm:h-[76px] sm:w-[54px]"
        aria-label={`View ${title}`}
      >
        {item.coverImage && (
          <Image 
            src={item.coverImage} 
            alt="" 
            fill 
            sizes="54px" 
            quality={95}
            className="object-cover" 
          />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <Link
            href={`/title/${item.anilistId}`}
            className="line-clamp-1 text-sm font-medium text-fg transition hover:text-[var(--accent)]"
          >
            {title}
          </Link>
          <p className="mt-0.5 text-[11px] text-subtle">
            {item.currentEpisode}
            {item.totalEpisodes ? ` / ${item.totalEpisodes}` : ""} episodes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProgressBar
            current={item.currentEpisode}
            total={item.totalEpisodes}
            showLabel={false}
            size="sm"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => onBump(item)}
            disabled={finished}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md border transition",
              finished
                ? "cursor-not-allowed border-line text-subtle opacity-50"
                : "border-line text-muted hover:border-transparent hover:bg-accent hover:text-white"
            )}
            aria-label={`Log one episode of ${title}`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

export function DashboardContent() {
  const { user } = useAuth();
  const { items, loading, stats, bumpEpisode, removeItem } = useWatchlist();
  const [editItem, setEditItem] = useState<WatchlistItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WatchlistItem | null>(null);

  const displayName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  const continueWatching = useMemo(
    () => items.filter((item) => item.status === "watching").slice(0, 8),
    [items]
  );

  const recentlyUpdated = useMemo(() => items.slice(0, 12), [items]);

  const statusCards: { status: WatchStatus; icon: LucideIcon; accent: string }[] = [
    { status: "watching", icon: TrendingUp, accent: "bg-sky-500/10 text-sky-500" },
    { status: "completed", icon: CheckCircle2, accent: "bg-emerald-500/10 text-emerald-500" },
    { status: "plan_to_watch", icon: Clock, accent: "bg-violet-500/10 text-violet-500" },
    { status: "on_hold", icon: PauseCircle, accent: "bg-amber-500/10 text-amber-500" },
    { status: "dropped", icon: XCircle, accent: "bg-rose-500/10 text-rose-500" },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <StatsSkeleton />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {items.length > 0
              ? `${stats.byStatus.watching} in progress · ${stats.episodesWatched} episodes logged · ${formatWatchTime(stats.minutesWatched)} watched`
              : "Let's find your first title."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
          >
            <Search className="h-4 w-4" aria-hidden /> Search titles
          </Button>
          <Link
            href="/anime"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add title
          </Link>
        </div>
      </header>

      <section aria-label="Watchlist statistics">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {statusCards.map(({ status, icon, accent }) => (
            <StatCard
              key={status}
              icon={icon}
              label={WATCH_STATUS_LABELS[status]}
              value={stats.byStatus[status]}
              accent={accent}
            />
          ))}
        </div>
      </section>

      {items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Your watchlist is empty"
          description="Search AniList for anime or donghua, then log episodes as you watch. Everything syncs automatically."
          action={
            <>
              <Link
                href="/anime"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
              >
                <BookOpen className="h-4 w-4" aria-hidden /> Browse anime
              </Link>
              <Link
                href="/donghua"
                className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-fg transition hover:bg-elevated"
              >
                <Globe2 className="h-4 w-4" aria-hidden /> Browse donghua
              </Link>
            </>
          }
        />
      ) : (
        <>
          <section aria-labelledby="continue-heading">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="continue-heading" className="text-base font-semibold text-fg">
                Continue watching
              </h2>
              <Link
                href="/anime"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted transition hover:text-fg"
              >
                View library <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>

            {continueWatching.length > 0 ? (
              <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                {continueWatching.map((item) => (
                  <ContinueCard
                    key={item.id}
                    item={item}
                    onBump={(entry) => void bumpEpisode(entry, 1)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-line bg-surface/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-elevated text-subtle">
                    <Play className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-fg">Nothing in progress</p>
                    <p className="text-xs text-muted">
                      Move a title to "Watching" to see it here.
                    </p>
                  </div>
                </div>
                <Link
                  href="/anime"
                  className="text-xs font-medium text-[var(--accent)] transition hover:opacity-80"
                >
                  Find something to watch →
                </Link>
              </div>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Episodes logged",
                value: stats.episodesWatched.toLocaleString(),
                icon: Play,
              },
              {
                label: "Time watched",
                value: formatWatchTime(stats.minutesWatched),
                icon: Clock,
              },
              {
                label: "Average score",
                value: stats.averageScore !== null ? `${stats.averageScore}/10` : "—",
                icon: Star,
              },
              {
                label: "Completion rate",
                value: `${stats.completionRate}%`,
                icon: CheckCircle2,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4"
              >
                <Icon className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
                <div className="min-w-0">
                  <p className="text-lg font-semibold tabular-nums text-fg">{value}</p>
                  <p className="truncate text-xs text-muted">{label}</p>
                </div>
              </div>
            ))}
          </section>

          <div className="flex justify-end">
            <Link
              href="/insights"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] transition hover:opacity-80"
            >
              <BarChart3 className="h-3.5 w-3.5" aria-hidden /> See full insights
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>

          <section aria-labelledby="recent-heading">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="recent-heading" className="text-base font-semibold text-fg">
                Recently updated
              </h2>
              <span className="text-xs text-subtle">{items.length} titles total</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {recentlyUpdated.map((item) => (
                <WatchlistCard
                  key={item.id}
                  item={item}
                  onEdit={setEditItem}
                  onDelete={setDeleteTarget}
                  onBump={(entry) => void bumpEpisode(entry, 1)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      <EditWatchlistModal
        item={editItem}
        isOpen={Boolean(editItem)}
        onClose={() => setEditItem(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Remove from watchlist?"
        description={
          deleteTarget
            ? `"${deleteTarget.titleEnglish ?? deleteTarget.title}" and its progress will be deleted.`
            : undefined
        }
        confirmLabel="Remove"
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await removeItem(deleteTarget);
        }}
      />
    </div>
  );
}
