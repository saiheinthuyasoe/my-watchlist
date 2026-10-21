import test from "node:test";
import assert from "node:assert/strict";
import {
  computeStats,
  formatRelativeTime,
  formatWatchTime,
  percentage,
} from "./stats.ts";
import type { WatchlistItem } from "../types/watchlist.ts";

function item(overrides: Partial<WatchlistItem> = {}): WatchlistItem {
  return {
    id: "1",
    userId: "user",
    anilistId: 1,
    category: "anime",
    title: "Test title",
    titleEnglish: null,
    titleNative: "",
    coverImage: "",
    totalEpisodes: 12,
    duration: 24,
    seasonYear: 2024,
    format: "TV",
    genres: [],
    countryOfOrigin: "JP",
    status: "watching",
    currentEpisode: 0,
    userScore: null,
    notes: "",
    nickname: "",
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

test("computeStats returns zeroed values for an empty list", () => {
  const stats = computeStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.episodesWatched, 0);
  assert.equal(stats.minutesWatched, 0);
  assert.equal(stats.averageScore, null);
  assert.equal(stats.completionRate, 0);
  assert.deepEqual(stats.topGenres, []);
  assert.equal(stats.scoreDistribution.length, 10);
});

test("computeStats counts statuses, categories and episodes", () => {
  const stats = computeStats([
    item({ status: "watching", currentEpisode: 5, totalEpisodes: 12 }),
    item({ id: "2", status: "completed", currentEpisode: 24, totalEpisodes: 24 }),
    item({ id: "3", category: "donghua", status: "plan_to_watch" }),
    item({ id: "4", status: "dropped", currentEpisode: 3 }),
  ]);

  assert.equal(stats.total, 4);
  assert.equal(stats.byStatus.watching, 1);
  assert.equal(stats.byStatus.completed, 1);
  assert.equal(stats.byStatus.plan_to_watch, 1);
  assert.equal(stats.byStatus.dropped, 1);
  assert.equal(stats.byStatus.on_hold, 0);
  assert.equal(stats.anime, 3);
  assert.equal(stats.donghua, 1);
  assert.equal(stats.episodesWatched, 32);
  assert.equal(stats.minutesWatched, 32 * 24);
  assert.equal(stats.completionRate, 25);
});

test("computeStats falls back to 24 minutes when duration is unknown", () => {
  const stats = computeStats([
    item({ currentEpisode: 10, duration: null, totalEpisodes: 10 }),
  ]);
  assert.equal(stats.minutesWatched, 240);
});

test("computeStats averages and distributes scores", () => {
  const stats = computeStats([
    item({ id: "a", userScore: 10 }),
    item({ id: "b", userScore: 8 }),
    item({ id: "c", userScore: 6 }),
    item({ id: "d", userScore: null }),
  ]);

  assert.equal(stats.ratedCount, 3);
  assert.equal(stats.averageScore, 8);
  assert.equal(stats.highestScore, 10);
  assert.equal(stats.scoreDistribution[9].count, 1);
  assert.equal(stats.scoreDistribution[7].count, 1);
  assert.equal(stats.scoreDistribution[5].count, 1);
});

test("computeStats aggregates top genres by frequency", () => {
  const stats = computeStats([
    item({ id: "a", genres: ["Action", "Fantasy"] }),
    item({ id: "b", genres: ["Action"] }),
    item({ id: "c", genres: ["Fantasy", "Drama"] }),
  ]);

  assert.deepEqual(stats.topGenres[0], { name: "Action", count: 2 });
  assert.deepEqual(
    stats.topGenres.map((genre) => genre.name).sort(),
    ["Action", "Drama", "Fantasy"]
  );
});

test("computeStats excludes finished and dropped titles from remaining episodes", () => {
  const stats = computeStats([
    item({ id: "a", status: "watching", currentEpisode: 4, totalEpisodes: 12 }),
    item({ id: "b", status: "completed", currentEpisode: 12, totalEpisodes: 12 }),
    item({ id: "c", status: "dropped", currentEpisode: 2, totalEpisodes: 10 }),
  ]);

  assert.equal(stats.remainingEpisodes, 8);
});

test("formatWatchTime produces readable durations", () => {
  assert.equal(formatWatchTime(0), "0m");
  assert.equal(formatWatchTime(45), "45m");
  assert.equal(formatWatchTime(60), "1h");
  assert.equal(formatWatchTime(100), "1h 40m");
  assert.equal(formatWatchTime(1440), "1d");
  assert.equal(formatWatchTime(1500), "1d 1h");
  assert.equal(formatWatchTime(-20), "0m");
});

test("formatRelativeTime handles recent timestamps", () => {
  const original = Date.now;
  Date.now = () => 1_700_000_000_000;
  try {
    assert.equal(formatRelativeTime(1_700_000_000_000), "just now");
    assert.equal(formatRelativeTime(1_700_000_000_000 - 5 * 60_000), "5m ago");
    assert.equal(formatRelativeTime(1_700_000_000_000 - 3 * 3_600_000), "3h ago");
    assert.equal(formatRelativeTime(1_700_000_000_000 - 2 * 86_400_000), "2d ago");
  } finally {
    Date.now = original;
  }
});

test("percentage guards against division by zero", () => {
  assert.equal(percentage(3, 4), 75);
  assert.equal(percentage(1, 0), 0);
  assert.equal(percentage(2, 3), 67);
});
