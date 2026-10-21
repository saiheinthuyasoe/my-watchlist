export type WatchStatus =
  | "watching"
  | "completed"
  | "plan_to_watch"
  | "on_hold"
  | "dropped";

export type AnimeCategory = "anime" | "donghua";

export interface WatchlistItem {
  id: string; // Firestore document ID
  userId: string;
  anilistId: number;
  category: AnimeCategory;

  // Cached info from AniList (avoids re-fetching on every render)
  title: string;
  titleEnglish: string | null;
  titleNative: string;
  coverImage: string;
  bannerImage?: string | null;
  description?: string | null;
  totalEpisodes: number | null;
  duration: number | null; // minutes per episode
  seasonYear: number | null;
  format: string | null;
  genres: string[];
  countryOfOrigin: string | null;

  // User-specific data
  status: WatchStatus;
  currentEpisode: number;
  userScore: number | null; // 1-10
  notes: string;
  nickname: string; // User-defined nickname for easy searching and remembering

  createdAt: number; // Unix timestamp ms
  updatedAt: number;
}

/** Fields the user can edit from the UI. */
export type WatchlistUpdate = Partial<
  Pick<WatchlistItem, "status" | "currentEpisode" | "userScore" | "notes" | "nickname">
>;

export const WATCH_STATUSES: WatchStatus[] = [
  "watching",
  "completed",
  "plan_to_watch",
  "on_hold",
  "dropped",
];

export const WATCH_STATUS_LABELS: Record<WatchStatus, string> = {
  watching: "Watching",
  completed: "Completed",
  plan_to_watch: "Plan to Watch",
  on_hold: "On Hold",
  dropped: "Dropped",
};

export const WATCH_STATUS_COLORS: Record<WatchStatus, string> = {
  watching:
    "bg-black/75 text-sky-300 border-sky-500/40 backdrop-blur-md shadow-lg",
  completed:
    "bg-black/75 text-emerald-300 border-emerald-500/40 backdrop-blur-md shadow-lg",
  plan_to_watch:
    "bg-black/75 text-violet-300 border-violet-500/40 backdrop-blur-md shadow-lg",
  on_hold:
    "bg-black/75 text-amber-300 border-amber-500/40 backdrop-blur-md shadow-lg",
  dropped:
    "bg-black/75 text-rose-300 border-rose-500/40 backdrop-blur-md shadow-lg",
};

export const WATCH_STATUS_DOT: Record<WatchStatus, string> = {
  watching: "bg-sky-500",
  completed: "bg-emerald-500",
  plan_to_watch: "bg-violet-500",
  on_hold: "bg-amber-500",
  dropped: "bg-rose-500",
};

export function statusOptions(includeAll = false) {
  const options = WATCH_STATUSES.map((status) => ({
    value: status,
    label: WATCH_STATUS_LABELS[status],
  }));
  return includeAll ? [{ value: "all", label: "All statuses" }, ...options] : options;
}

export function categoryLabel(category: AnimeCategory) {
  return category === "donghua" ? "Donghua" : "Anime";
}
