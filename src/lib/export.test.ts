import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExportBundle,
  parseImport,
  toCSV,
  toJSON,
} from "./export.ts";
import type { WatchlistItem } from "../types/watchlist.ts";

function item(overrides: Partial<WatchlistItem> = {}): WatchlistItem {
  return {
    id: "doc-1",
    userId: "user",
    anilistId: 151807,
    category: "anime",
    title: "Solo Leveling",
    titleEnglish: "Solo Leveling",
    titleNative: "俺だけレベルアップな件",
    coverImage: "https://example.com/cover.jpg",
    totalEpisodes: 12,
    duration: 24,
    seasonYear: 2024,
    format: "TV",
    genres: ["Action", "Fantasy"],
    countryOfOrigin: "JP",
    airingStatus: "FINISHED",
    nextAiringEpisode: null,
    startDate: { year: 2024, month: 1, day: 7 },
    studios: ["A-1 Pictures"],
    averageScore: 85,
    source: "MANGA",
    status: "watching",
    currentEpisode: 5,
    userScore: 8,
    notes: "Great animation",
    nickname: "",
    createdAt: 1000,
    updatedAt: 2000,
    ...overrides,
  };
}

test("buildExportBundle includes metadata and items", () => {
  const bundle = buildExportBundle([item(), item({ id: "doc-2", anilistId: 2 })]);
  assert.equal(bundle.app, "mywatchlist");
  assert.equal(bundle.version, 1);
  assert.equal(bundle.count, 2);
  assert.equal(bundle.items.length, 2);
  assert.ok(!Number.isNaN(Date.parse(bundle.exportedAt)));
});

test("toJSON round-trips through parseImport", () => {
  const json = toJSON([item()]);
  const parsed = parseImport(json);
  assert.equal(parsed.skipped, 0);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].anilistId, 151807);
  assert.equal(parsed.rows[0].currentEpisode, 5);
  assert.equal(parsed.rows[0].userScore, 8);
});

test("parseImport accepts a bare array of items", () => {
  const parsed = parseImport(JSON.stringify([{ anilistId: 5, title: "Bare" }]));
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].status, "plan_to_watch");
  assert.equal(parsed.rows[0].category, "anime");
});

test("parseImport rejects invalid JSON and empty payloads", () => {
  assert.throws(() => parseImport("{not json"), /valid JSON/);
  assert.throws(() => parseImport(JSON.stringify({ hello: "world" })), /No watchlist items/);
});

test("parseImport skips entries without a title or id", () => {
  const parsed = parseImport(
    JSON.stringify([
      { anilistId: 1, title: "Valid" },
      { title: "Missing id" },
      { anilistId: 2 },
      null,
      "nope",
    ])
  );
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.skipped, 4);
});

test("parseImport clamps and normalises values", () => {
  const parsed = parseImport(
    JSON.stringify([
      {
        anilistId: 3,
        title: "Clamp me",
        status: "on hold",
        currentEpisode: 99,
        totalEpisodes: 12,
        userScore: 42,
        category: "donghua",
        genres: ["Action", 5, "Drama"],
      },
    ])
  );

  const row = parsed.rows[0];
  assert.equal(row.status, "on_hold");
  assert.equal(row.currentEpisode, 12);
  assert.equal(row.userScore, 10);
  assert.equal(row.category, "donghua");
  assert.deepEqual(row.genres, ["Action", "Drama"]);
});

test("toCSV escapes commas, quotes and newlines", () => {
  const csv = toCSV([
    item({ title: 'Show, "The" Best', notes: "line one\nline two" }),
  ]);
  const lines = csv.split("\r\n");
  assert.equal(lines.length, 2);
  assert.match(lines[1], /"Show, ""The"" Best"/);
  assert.match(lines[1], /"line one\nline two"/);
  assert.ok(lines[0].startsWith("title,titleEnglish,titleNative"));
});
