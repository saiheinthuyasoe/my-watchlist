"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Clock,
  Layers,
  Play,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { useWatchlist } from "@/lib/watchlist-context";
import { computeStats, formatWatchTime, percentage } from "@/lib/stats";
import { WATCH_STATUSES, WATCH_STATUS_LABELS, type WatchStatus } from "@/types/watchlist";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

const STATUS_HEX: Record<WatchStatus, string> = {
  watching: "#38bdf8",
  completed: "#34d399",
  plan_to_watch: "#a78bfa",
  on_hold: "#fbbf24",
  dropped: "#fb7185",
};

function StatusDonut({
  byStatus,
  total,
}: {
  byStatus: Record<WatchStatus, number>;
  total: number;
}) {
  const size = 140; // Smaller for mobile
  const stroke = 20;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = WATCH_STATUSES.reduce<
    { status: WatchStatus; dash: number; offset: number }[]
  >((acc, status) => {
    const count = byStatus[status];
    if (!count || !total) return acc;
    const dash = (count / total) * circumference;
    const previous = acc[acc.length - 1];
    const offset = previous ? previous.offset + previous.dash : 0;
    return [...acc, { status, dash, offset }];
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          role="img"
          aria-label={`Status breakdown: ${WATCH_STATUSES.map(
            (status) => `${WATCH_STATUS_LABELS[status]} ${byStatus[status]}`
          ).join(", ")}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-elevated"
          />
          {segments.map(({ status, dash, offset }) => (
            <circle
              key={status}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={STATUS_HEX[status]}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(dash - 2, 0)} ${circumference - Math.max(dash - 2, 0)}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-fg">{total}</span>
          <span className="text-[11px] text-muted">titles</span>
        </div>
      </div>

      <ul className="w-full flex-1 space-y-1.5 sm:space-y-2">
        {WATCH_STATUSES.map((status) => (
          <li key={status} className="flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
            <span
              className="h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5"
              style={{ backgroundColor: STATUS_HEX[status] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-muted">{WATCH_STATUS_LABELS[status]}</span>
            <span className="font-medium tabular-nums text-fg">{byStatus[status]}</span>
            <span className="w-8 text-right text-[10px] tabular-nums text-subtle sm:w-10 sm:text-xs">
              {percentage(byStatus[status], total)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreChart({ distribution }: { distribution: { score: number; count: number }[] }) {
  const max = Math.max(1, ...distribution.map((bucket) => bucket.count));
  const rated = distribution.reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <div className="overflow-x-auto">
      <div className="flex h-32 items-end gap-1 min-w-[280px] sm:h-36 sm:gap-1.5" role="img" aria-label="Scores distribution">
        {distribution.map((bucket) => (
          <div key={bucket.score} className="group flex h-full flex-1 flex-col justify-end gap-1">
            <span className="text-center text-[10px] tabular-nums text-subtle opacity-0 transition group-hover:opacity-100">
              {bucket.count}
            </span>
            <div
              className={
                bucket.count > 0
                  ? "w-full rounded-t bg-gradient-to-t from-violet-600 to-sky-400 transition-all"
                  : "w-full rounded-t bg-elevated"
              }
              style={{
                height: bucket.count > 0 ? `${Math.max(8, (bucket.count / max) * 100)}%` : "3px",
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 min-w-[280px] sm:mt-1.5 sm:gap-1.5">
        {distribution.map((bucket) => (
          <span
            key={bucket.score}
            className="flex-1 text-center text-[10px] tabular-nums text-subtle"
          >
            {bucket.score}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted sm:text-xs">
        {rated > 0 ? `${rated} rated titles` : "No ratings yet"} · hover a bar for the count
      </p>
    </div>
  );
}

export function InsightsContent() {
  const { items, loading } = useWatchlist();
  const stats = computeStats(items);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Insights</h1>
          <p className="mt-1 text-sm text-muted">
            Patterns in what you watch, once you start tracking.
          </p>
        </header>
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          description="Add a few titles and log some episodes — your viewing stats will appear here."
          action={
            <Link
              href="/anime"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
            >
              Browse anime
            </Link>
          }
        />
      </div>
    );
  }

  const topGenres = stats.topGenres;
  const maxGenre = topGenres[0]?.count ?? 1;

  const topRated = [...items]
    .filter((item) => item.userScore !== null)
    .sort((a, b) => (b.userScore ?? 0) - (a.userScore ?? 0) || b.updatedAt - a.updatedAt)
    .slice(0, 5);

  const mostWatched = [...items]
    .sort((a, b) => b.currentEpisode - a.currentEpisode || b.updatedAt - a.updatedAt)
    .slice(0, 5);

  const kpis = [
    {
      label: "Titles tracked",
      value: stats.total.toLocaleString(),
      hint: `${stats.anime} anime · ${stats.donghua} donghua`,
      icon: Layers,
    },
    {
      label: "Episodes logged",
      value: stats.episodesWatched.toLocaleString(),
      hint: stats.remainingEpisodes
        ? `${stats.remainingEpisodes} left in current series`
        : "All caught up",
      icon: Play,
    },
    {
      label: "Time watched",
      value: formatWatchTime(stats.minutesWatched),
      hint: `${Math.round(stats.minutesWatched / 60).toLocaleString()} hours total`,
      icon: Clock,
    },
    {
      label: "Average score",
      value: stats.averageScore !== null ? `${stats.averageScore}` : "—",
      hint: stats.ratedCount
        ? `${stats.ratedCount} rated${stats.highestScore ? ` · best ${stats.highestScore}/10` : ""}`
        : "Rate titles to see this",
      icon: Star,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle sm:text-xs">
          Your library
        </p>
        <h1 className="text-xl font-bold tracking-tight text-fg sm:text-2xl lg:text-3xl">
          Insights
        </h1>
        <p className="text-xs text-muted sm:text-sm">
          A snapshot of your viewing habits across {stats.total}{" "}
          {stats.total === 1 ? "title" : "titles"}.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        {kpis.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-line bg-surface p-2.5 sm:p-3 lg:p-4">
            <div className="flex items-center gap-1.5 text-[10px] text-muted sm:gap-2 sm:text-xs">
              <Icon className="h-3 w-3 text-subtle sm:h-3.5 sm:w-3.5" aria-hidden />
              <span className="truncate">{label}</span>
            </div>
            <p className="mt-1.5 text-lg font-bold tabular-nums text-fg sm:mt-2 sm:text-xl lg:text-2xl">{value}</p>
            <p className="mt-0.5 truncate text-[10px] text-subtle sm:text-[11px]">{hint}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-2.5 sm:gap-3 lg:gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-line bg-surface p-3 sm:p-4 lg:p-5">
          <h2 className="text-xs font-semibold text-fg sm:text-sm">Status breakdown</h2>
          <p className="mb-3 text-[10px] text-muted sm:mb-4 sm:text-xs">Where your library sits right now.</p>
          <StatusDonut byStatus={stats.byStatus} total={stats.total} />
        </section>

        <section className="overflow-hidden rounded-xl border border-line bg-surface p-3 sm:p-4 lg:p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2 sm:mb-4">
            <div>
              <h2 className="text-xs font-semibold text-fg sm:text-sm">Score distribution</h2>
              <p className="text-[10px] text-muted sm:text-xs">How you rate what you finish.</p>
            </div>
            <span className="whitespace-nowrap rounded-full border border-line px-1.5 py-0.5 text-[10px] text-muted sm:px-2 sm:text-[11px]">
              {stats.completionRate}% completed
            </span>
          </div>
          <ScoreChart distribution={stats.scoreDistribution} />
        </section>

        <section className="overflow-hidden rounded-xl border border-line bg-surface p-3 sm:p-4 lg:p-5">
          <h2 className="text-xs font-semibold text-fg sm:text-sm">Top genres</h2>
          <p className="mb-3 text-[10px] text-muted sm:mb-4 sm:text-xs">What you gravitate towards.</p>
          {topGenres.length === 0 ? (
            <p className="text-xs text-muted sm:text-sm">No genres recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {topGenres.map((genre) => (
                <li key={genre.name}>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="min-w-0 flex-1 truncate text-muted">{genre.name}</span>
                    <span className="ml-2 tabular-nums text-subtle">{genre.count}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-elevated sm:h-1.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400"
                      style={{ width: `${Math.max(4, (genre.count / maxGenre) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-line bg-surface p-3 sm:p-4 lg:p-5">
          <h2 className="text-xs font-semibold text-fg sm:text-sm">Most watched</h2>
          <p className="mb-3 text-[10px] text-muted sm:mb-4 sm:text-xs">Titles with the most episodes logged.</p>
          <ul className="space-y-1.5 sm:space-y-2">
            {mostWatched.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/title/${item.anilistId}`}
                  className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-elevated sm:gap-3 sm:p-1.5"
                >
                  <span className="relative h-9 w-6 shrink-0 overflow-hidden rounded bg-elevated sm:h-11 sm:w-8">
                    {item.coverImage && (
                      <Image src={item.coverImage} alt="" fill sizes="32px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-fg sm:text-sm">
                      {item.titleEnglish ?? item.title}
                    </span>
                    <span className="text-[10px] text-subtle sm:text-[11px]">
                      {item.currentEpisode}
                      {item.totalEpisodes ? ` / ${item.totalEpisodes}` : ""} episodes
                    </span>
                  </span>
                  <span className="text-[10px] tabular-nums text-muted sm:text-xs">
                    {percentage(item.currentEpisode, item.totalEpisodes ?? (item.currentEpisode || 1))}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-2.5 sm:gap-3 lg:gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-line bg-surface p-3 sm:p-4 lg:p-5">
          <div className="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
            <Trophy className="h-3.5 w-3.5 text-amber-500 sm:h-4 sm:w-4" aria-hidden />
            <h2 className="text-xs font-semibold text-fg sm:text-sm">Your highest rated</h2>
          </div>
          {topRated.length === 0 ? (
            <p className="text-xs text-muted sm:text-sm">
              No scores yet — open a title and set a rating.
            </p>
          ) : (
            <ol className="space-y-1.5 sm:space-y-2">
              {topRated.map((item, index) => (
                <li key={item.id}>
                  <Link
                    href={`/title/${item.anilistId}`}
                    className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-elevated sm:gap-3 sm:p-1.5"
                  >
                    <span className="w-3 text-center text-[10px] font-semibold text-subtle sm:w-4 sm:text-xs">
                      {index + 1}
                    </span>
                    <span className="relative h-9 w-6 shrink-0 overflow-hidden rounded bg-elevated sm:h-11 sm:w-8">
                      {item.coverImage && (
                        <Image src={item.coverImage} alt="" fill sizes="32px" className="object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-fg sm:text-sm">
                      {item.titleEnglish ?? item.title}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-500 sm:gap-1 sm:text-sm">
                      <Star className="h-2.5 w-2.5 fill-current sm:h-3 sm:w-3" aria-hidden />
                      {item.userScore}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-accent-soft p-3 sm:p-4 lg:p-5">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent)] sm:h-4 sm:w-4" aria-hidden />
              <h2 className="text-xs font-semibold text-fg sm:text-sm">Keep the streak going</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
              {stats.remainingEpisodes
                ? `You have ${stats.remainingEpisodes} episodes left across your in-progress series — that's about ${formatWatchTime(stats.remainingEpisodes * 24)} of viewing.`
                : "Everything on your list is finished. Time to find your next obsession."}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
            <Link href="/anime">
              <Button size="sm" className="text-xs">
                <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden /> Continue watching
              </Button>
            </Link>
            <Link href="/donghua">
              <Button size="sm" variant="secondary" className="text-xs">
                Explore donghua
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
