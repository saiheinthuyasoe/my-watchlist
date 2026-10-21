"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./auth-context";
import { useToast } from "@/components/ui/Toast";
import {
  DuplicateEntryError,
  addToWatchlist,
  clearWatchlist,
  importWatchlist,
  removeFromWatchlist,
  subscribeWatchlist,
  updateWatchlistItem,
  type WatchlistImportRow,
} from "./firestore";
import { computeStats, type WatchlistStats } from "./stats";
import type {
  AnimeCategory,
  WatchlistItem,
  WatchlistUpdate,
  WatchStatus,
} from "@/types/watchlist";
import type { AniListMedia } from "@/types/anime";

interface WatchlistContextValue {
  items: WatchlistItem[];
  byAniListId: Map<number, WatchlistItem>;
  loading: boolean;
  error: string | null;
  stats: WatchlistStats;
  addItem: (
    media: AniListMedia,
    category: AnimeCategory,
    status?: WatchStatus
  ) => Promise<boolean>;
  updateItem: (item: WatchlistItem, patch: WatchlistUpdate) => Promise<void>;
  bumpEpisode: (item: WatchlistItem, delta: number) => Promise<void>;
  setStatus: (item: WatchlistItem, status: WatchStatus) => Promise<void>;
  removeItem: (item: WatchlistItem) => Promise<void>;
  importRows: (
    rows: WatchlistImportRow[]
  ) => Promise<{ imported: number; skipped: number }>;
  clearAll: () => Promise<number>;
}

interface Snapshot {
  uid: string | null;
  items: WatchlistItem[];
  ready: boolean;
  error: string | null;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);
const NO_ITEMS: WatchlistItem[] = [];

const STATUS_LABELS: Record<WatchStatus, string> = {
  watching: "Watching",
  completed: "Completed",
  plan_to_watch: "Plan to Watch",
  on_hold: "On Hold",
  dropped: "Dropped",
};

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const uid = user?.uid ?? null;

  const [snapshot, setSnapshot] = useState<Snapshot>({
    uid: null,
    items: [],
    ready: false,
    error: null,
  });

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = subscribeWatchlist(
      uid,
      (items) => setSnapshot({ uid, items, ready: true, error: null }),
      (error) => {
        console.error("Watchlist subscription failed", error);
        setSnapshot((previous) => ({
          ...previous,
          uid,
          ready: true,
          error: "We couldn't sync your watchlist. Check your connection, then retry.",
        }));
      }
    );
    return unsubscribe;
  }, [uid]);

  const items = snapshot.uid === uid ? snapshot.items : NO_ITEMS;
  const loading = Boolean(uid) && !(snapshot.uid === uid && snapshot.ready);
  const error = snapshot.uid === uid ? snapshot.error : null;

  const byAniListId = useMemo(() => {
    const map = new Map<number, WatchlistItem>();
    for (const item of items) map.set(item.anilistId, item);
    return map;
  }, [items]);

  const stats = useMemo(() => computeStats(items), [items]);

  const addItem = useCallback(
    async (
      media: AniListMedia,
      category: AnimeCategory,
      status: WatchStatus = "plan_to_watch"
    ) => {
      if (!user) {
        toast.info("Sign in required", "Create a free account to start tracking.");
        return false;
      }
      if (byAniListId.has(media.id)) {
        toast.info("Already in your watchlist");
        return false;
      }
      try {
        await addToWatchlist(user.uid, media, category, status);
        toast.success(
          "Added to watchlist",
          media.title.english ?? media.title.romaji
        );
        return true;
      } catch (err) {
        if (err instanceof DuplicateEntryError) {
          toast.info("Already in your watchlist");
        } else {
          console.error(err);
          toast.error("Couldn't add that title", "Please try again.");
        }
        return false;
      }
    },
    [user, byAniListId, toast]
  );

  const updateItem = useCallback(
    async (item: WatchlistItem, patch: WatchlistUpdate) => {
      try {
        await updateWatchlistItem(item.id, patch, item.totalEpisodes);
      } catch (err) {
        console.error(err);
        toast.error("Couldn't save changes", "Please try again.");
      }
    },
    [toast]
  );

  const bumpEpisode = useCallback(
    async (item: WatchlistItem, delta: number) => {
      const max = item.totalEpisodes ?? 100_000;
      const next = Math.min(max, Math.max(0, item.currentEpisode + delta));
      if (next === item.currentEpisode) {
        if (delta > 0 && item.totalEpisodes !== null) {
          toast.info("That was the last episode", "Mark it as completed?");
        }
        return;
      }

      const reachingEnd =
        item.totalEpisodes !== null && next >= item.totalEpisodes && delta > 0;
      const patch: WatchlistUpdate = { currentEpisode: next };

      if (reachingEnd) {
        patch.status = "completed";
      } else if (
        delta > 0 &&
        item.status !== "watching" &&
        item.status !== "completed"
      ) {
        patch.status = "watching";
      }

      await updateItem(item, patch);
    },
    [updateItem, toast]
  );

  const setStatus = useCallback(
    async (item: WatchlistItem, status: WatchStatus) => {
      if (item.status === status) return;
      const patch: WatchlistUpdate = { status };
      if (status === "completed" && item.totalEpisodes) {
        patch.currentEpisode = item.totalEpisodes;
      }
      await updateItem(item, patch);
      toast.success(`Moved to ${STATUS_LABELS[status]}`);
    },
    [updateItem, toast]
  );

  const removeItem = useCallback(
    async (item: WatchlistItem) => {
      setSnapshot((previous) => ({
        ...previous,
        items: previous.items.filter((entry) => entry.id !== item.id),
      }));
      try {
        await removeFromWatchlist(item.id);
        toast.success(
          "Removed from watchlist",
          item.titleEnglish ?? item.title
        );
      } catch (err) {
        console.error(err);
        setSnapshot((previous) => ({
          ...previous,
          items: [item, ...previous.items].sort((a, b) => b.updatedAt - a.updatedAt),
        }));
        toast.error("Couldn't remove that title", "Please try again.");
      }
    },
    [toast]
  );

  const importRows = useCallback(
    async (rows: WatchlistImportRow[]) => {
      if (!user) return { imported: 0, skipped: rows.length };
      try {
        const result = await importWatchlist(
          user.uid,
          rows,
          new Set(items.map((item) => item.anilistId))
        );
        toast.success(
          `Imported ${result.imported} ${result.imported === 1 ? "title" : "titles"}`,
          result.skipped > 0
            ? `${result.skipped} skipped (duplicates or invalid).`
            : undefined
        );
        return result;
      } catch (err) {
        console.error(err);
        toast.error("Import failed", "Please check the file and try again.");
        return { imported: 0, skipped: rows.length };
      }
    },
    [user, items, toast]
  );

  const clearAll = useCallback(async () => {
    if (!user) return 0;
    try {
      const deleted = await clearWatchlist(user.uid);
      toast.success(
        `Cleared ${deleted} ${deleted === 1 ? "title" : "titles"}`
      );
      return deleted;
    } catch (err) {
      console.error(err);
      toast.error("Couldn't clear your watchlist", "Please try again.");
      return 0;
    }
  }, [user, toast]);

  const value = useMemo<WatchlistContextValue>(
    () => ({
      items,
      byAniListId,
      loading,
      error,
      stats,
      addItem,
      updateItem,
      bumpEpisode,
      setStatus,
      removeItem,
      importRows,
      clearAll,
    }),
    [
      items,
      byAniListId,
      loading,
      error,
      stats,
      addItem,
      updateItem,
      bumpEpisode,
      setStatus,
      removeItem,
      importRows,
      clearAll,
    ]
  );

  return (
    <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be used within WatchlistProvider");
  return ctx;
}
