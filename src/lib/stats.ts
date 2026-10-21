import type { WatchlistItem, WatchStatus } from "../types/watchlist";

export const DEFAULT_EPISODE_MINUTES = 24;

export interface GenreCount {
  name: string;
  count: number;
}

export interface ScoreBucket {
  score: number;
  count: number;
}

export interface WatchlistStats {
  total: number;
  byStatus: Record<WatchStatus, number>;
  anime: number;
  donghua: number;
  episodesWatched: number;
  minutesWatched: number;
  ratedCount: number;
  averageScore: number | null;
  highestScore: number | null;
  completionRate: number;
  scoreDistribution: ScoreBucket[];
  topGenres: GenreCount[];
  remainingEpisodes: number | null;
}

const EMPTY_STATUS: Record<WatchStatus, number> = {
  watching: 0,
  completed: 0,
  plan_to_watch: 0,
  on_hold: 0,
  dropped: 0,
};

export function computeStats(items: WatchlistItem[]): WatchlistStats {
  const byStatus: Record<WatchStatus, number> = { ...EMPTY_STATUS };
  const genreTotals = new Map<string, number>();
  const scoreDistribution: ScoreBucket[] = Array.from({ length: 10 }, (_, i) => ({
    score: i + 1,
    count: 0,
  }));

  let episodesWatched = 0;
  let minutesWatched = 0;
  let ratingSum = 0;
  let ratedCount = 0;
  let highestScore: number | null = null;
  let remainingEpisodes: number | null = null;
  let anime = 0;
  let donghua = 0;

  for (const item of items) {
    if (item.status in byStatus) byStatus[item.status] += 1;
    if (item.category === "donghua") donghua += 1;
    else anime += 1;

    const episodes = Math.max(0, item.currentEpisode || 0);
    episodesWatched += episodes;
    // Titles cached before the duration field existed (or with no runtime data)
    // fall back to a standard 24 minute episode.
    minutesWatched += episodes * (item.duration ?? DEFAULT_EPISODE_MINUTES);

    if (typeof item.userScore === "number") {
      const score = Math.min(10, Math.max(1, Math.round(item.userScore)));
      ratingSum += score;
      ratedCount += 1;
      scoreDistribution[score - 1].count += 1;
      if (highestScore === null || score > highestScore) highestScore = score;
    }

    for (const genre of item.genres ?? []) {
      genreTotals.set(genre, (genreTotals.get(genre) ?? 0) + 1);
    }

    if (
      item.totalEpisodes !== null &&
      item.status !== "completed" &&
      item.status !== "dropped"
    ) {
      remainingEpisodes =
        (remainingEpisodes ?? 0) + Math.max(0, item.totalEpisodes - episodes);
    }
  }

  const topGenres = Array.from(genreTotals.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 8);

  return {
    total: items.length,
    byStatus,
    anime,
    donghua,
    episodesWatched,
    minutesWatched,
    ratedCount,
    averageScore: ratedCount ? Math.round((ratingSum / ratedCount) * 10) / 10 : null,
    highestScore,
    completionRate: items.length
      ? Math.round((byStatus.completed / items.length) * 100)
      : 0,
    scoreDistribution,
    topGenres,
    remainingEpisodes,
  };
}

/** Human friendly duration, e.g. "2d 5h", "7h 40m", "45m". */
export function formatWatchTime(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  if (safe === 0) return "0m";
  const days = Math.floor(safe / 1440);
  const hours = Math.floor((safe % 1440) / 60);
  const mins = safe % 60;

  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

/** Compact "time ago" used on cards and the activity feed. */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (!Number.isFinite(timestamp) || diff < 0) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function percentage(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
