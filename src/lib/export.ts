import type { WatchlistItem, WatchStatus, AnimeCategory } from "../types/watchlist";

export interface ExportBundle {
  app: "mywatchlist";
  version: 1;
  exportedAt: string;
  count: number;
  items: WatchlistItem[];
}

export interface ImportRow {
  anilistId: number;
  category: AnimeCategory;
  title: string;
  titleEnglish: string | null;
  titleNative: string;
  coverImage: string;
  totalEpisodes: number | null;
  duration: number | null;
  format: string | null;
  genres: string[];
  countryOfOrigin: string | null;
  status: WatchStatus;
  currentEpisode: number;
  userScore: number | null;
  notes: string;
  nickname: string;
}

export interface ImportResult {
  rows: ImportRow[];
  skipped: number;
}

export function buildExportBundle(items: WatchlistItem[]): ExportBundle {
  return {
    app: "mywatchlist",
    version: 1,
    exportedAt: new Date().toISOString(),
    count: items.length,
    items,
  };
}

export function toJSON(items: WatchlistItem[]): string {
  return JSON.stringify(buildExportBundle(items), null, 2);
}

const CSV_HEADERS = [
  "title",
  "titleEnglish",
  "titleNative",
  "nickname",
  "category",
  "status",
  "currentEpisode",
  "totalEpisodes",
  "score",
  "genres",
  "anilistId",
  "notes",
];

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCSV(items: WatchlistItem[]): string {
  const rows = items.map((item) =>
    [
      item.title,
      item.titleEnglish ?? "",
      item.titleNative,
      item.nickname ?? "",
      item.category,
      item.status,
      item.currentEpisode,
      item.totalEpisodes ?? "",
      item.userScore ?? "",
      item.genres.join(" | "),
      item.anilistId,
      item.notes,
    ]
      .map(csvCell)
      .join(",")
  );
  return [CSV_HEADERS.join(","), ...rows].join("\r\n");
}

const STATUS_VALUES: WatchStatus[] = [
  "watching",
  "completed",
  "plan_to_watch",
  "on_hold",
  "dropped",
];

function clampNumber(value: unknown, min: number, max: number): number | null {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (typeof numeric !== "number" || !Number.isFinite(numeric)) return null;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normaliseStatus(value: unknown): WatchStatus {
  if (typeof value === "string") {
    const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (STATUS_VALUES.includes(key as WatchStatus)) return key as WatchStatus;
    if (key === "planned" || key === "plan") return "plan_to_watch";
  }
  return "plan_to_watch";
}

/**
 * Parse an exported JSON bundle (or a bare array of items).
 * Returns sanitised rows ready for Firestore and a count of unusable entries.
 */
export function parseImport(text: string): ImportResult {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }

  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { items?: unknown }).items)
      ? ((payload as { items: unknown[] }).items)
      : null;

  if (!rawItems) {
    throw new Error("No watchlist items were found in that file.");
  }

  const rows: ImportRow[] = [];
  let skipped = 0;

  for (const entry of rawItems) {
    if (!entry || typeof entry !== "object") {
      skipped += 1;
      continue;
    }
    const record = entry as Record<string, unknown>;
    const title = asString(record.title) || asString(record.titleRomaji);
    const anilistId = clampNumber(record.anilistId ?? record.id, 1, Number.MAX_SAFE_INTEGER);

    if (!title || anilistId === null) {
      skipped += 1;
      continue;
    }

    const totalEpisodes = clampNumber(record.totalEpisodes, 0, 100_000);
    const rawEpisode = clampNumber(record.currentEpisode, 0, 100_000) ?? 0;
    const category: AnimeCategory = record.category === "donghua" ? "donghua" : "anime";
    const genres = Array.isArray(record.genres)
      ? record.genres.filter((g): g is string => typeof g === "string").slice(0, 25)
      : [];

    rows.push({
      anilistId,
      category,
      title,
      titleEnglish: typeof record.titleEnglish === "string" ? record.titleEnglish : null,
      titleNative: asString(record.titleNative),
      coverImage: asString(record.coverImage),
      totalEpisodes: totalEpisodes && totalEpisodes > 0 ? totalEpisodes : null,
      duration: clampNumber(record.duration, 1, 600),
      format: typeof record.format === "string" ? record.format : null,
      genres,
      countryOfOrigin:
        typeof record.countryOfOrigin === "string" ? record.countryOfOrigin : null,
      status: normaliseStatus(record.status),
      currentEpisode:
        totalEpisodes && totalEpisodes > 0
          ? Math.min(rawEpisode, totalEpisodes)
          : rawEpisode,
      userScore: clampNumber(record.userScore, 1, 10),
      notes: asString(record.notes).slice(0, 5000),
      nickname: asString(record.nickname).slice(0, 100),
    });
  }

  return { rows, skipped };
}

export function downloadFile(filename: string, contents: string, mime: string) {
  // For CSV files, ensure UTF-8 encoding is preserved
  const isCsv = mime === "text/csv" || filename.endsWith(".csv");
  const blob = isCsv
    ? new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), contents], { type: "text/csv;charset=utf-8;" })
    : new Blob([contents], { type: `${mime};charset=utf-8;` });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportFilename(extension: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `mywatchlist-${date}.${extension}`;
}
