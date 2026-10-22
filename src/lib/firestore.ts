import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  writeBatch,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  WatchlistItem,
  WatchStatus,
  AnimeCategory,
  WatchlistUpdate,
} from "@/types/watchlist";
import type { AniListMedia } from "@/types/anime";

const COLLECTION = "watchlist";

/** Raised when a title is already tracked by the user. */
export class DuplicateEntryError extends Error {
  constructor() {
    super("This title is already in your watchlist.");
    this.name = "DuplicateEntryError";
  }
}

export interface WatchlistImportRow {
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
}

function toMillis(value: unknown): number {
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  if (value && typeof (value as Timestamp).toMillis === "function") {
    return (value as Timestamp).toMillis();
  }
  return Date.now();
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Normalise a Firestore document into a fully-populated WatchlistItem. */
function mapDoc(snapshot: QueryDocumentSnapshot<DocumentData>): WatchlistItem {
  const data = snapshot.data();
  const totalEpisodes =
    typeof data.totalEpisodes === "number" ? data.totalEpisodes : null;
  const currentEpisode = clamp(Number(data.currentEpisode) || 0, 0, 100_000);

  return {
    id: snapshot.id,
    userId: String(data.userId ?? ""),
    anilistId: Number(data.anilistId) || 0,
    category: data.category === "donghua" ? "donghua" : "anime",
    title: String(data.title ?? "Untitled"),
    titleEnglish: (data.titleEnglish as string | null) ?? null,
    titleNative: String(data.titleNative ?? ""),
    coverImage: String(data.coverImage ?? ""),
    bannerImage: (data.bannerImage as string | null) ?? null,
    description: (data.description as string | null) ?? null,
    totalEpisodes,
    duration: typeof data.duration === "number" ? data.duration : null,
    seasonYear: typeof data.seasonYear === "number" ? data.seasonYear : null,
    format: (data.format as string | null) ?? null,
    genres: Array.isArray(data.genres) ? (data.genres as string[]) : [],
    countryOfOrigin: (data.countryOfOrigin as string | null) ?? null,
    airingStatus: (data.airingStatus as WatchlistItem["airingStatus"]) ?? null,
    nextAiringEpisode: (data.nextAiringEpisode as WatchlistItem["nextAiringEpisode"]) ?? null,
    startDate: (data.startDate as WatchlistItem["startDate"]) ?? null,
    studios: Array.isArray(data.studios) ? (data.studios as string[]) : [],
    averageScore: typeof data.averageScore === "number" ? data.averageScore : null,
    source: (data.source as string | null) ?? null,
    status: (data.status as WatchStatus) ?? "plan_to_watch",
    currentEpisode:
      totalEpisodes !== null
        ? Math.min(currentEpisode, Math.max(totalEpisodes, 0))
        : currentEpisode,
    userScore:
      typeof data.userScore === "number"
        ? clamp(data.userScore, 1, 10)
        : null,
    notes: String(data.notes ?? ""),
    nickname: String(data.nickname ?? ""),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

function sortItems(items: WatchlistItem[]) {
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Live subscription to a user's watchlist.
 * Sorted client-side so the app does not depend on deployed composite indexes.
 */
export function subscribeWatchlist(
  userId: string,
  onData: (items: WatchlistItem[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION), where("userId", "==", userId));
  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      onData(sortItems(snapshot.docs.map(mapDoc)));
    },
    (error) => onError(error)
  );
}

/** One-off fetch of every watchlist item for a user. */
export async function getWatchlist(
  userId: string,
  category?: AnimeCategory
): Promise<WatchlistItem[]> {
  const constraints = [where("userId", "==", userId)];
  if (category) constraints.push(where("category", "==", category));
  const snapshot = await getDocs(query(collection(db, COLLECTION), ...constraints));
  return sortItems(snapshot.docs.map(mapDoc));
}

/** Fetch a single entry by Firestore document id. */
export async function getWatchlistItem(itemId: string): Promise<WatchlistItem | null> {
  const snapshot = await getDoc(doc(db, COLLECTION, itemId));
  if (!snapshot.exists()) return null;
  return mapDoc(snapshot as QueryDocumentSnapshot<DocumentData>);
}

/** Look up an entry by its AniList id. */
export async function getExistingEntry(
  userId: string,
  anilistId: number
): Promise<WatchlistItem | null> {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where("userId", "==", userId),
      where("anilistId", "==", anilistId)
    )
  );
  const first = snapshot.docs[0];
  return first ? mapDoc(first) : null;
}

/** Add a title. Throws DuplicateEntryError if it is already tracked. */
export async function addToWatchlist(
  userId: string,
  media: AniListMedia,
  category: AnimeCategory,
  status: WatchStatus = "plan_to_watch",
  currentEpisode?: number
): Promise<string> {
  if (await getExistingEntry(userId, media.id)) {
    throw new DuplicateEntryError();
  }

  // Auto-complete progress when adding as completed, or use provided episode
  const totalEpisodes = media.episodes ?? null;
  let initialEpisode = currentEpisode ?? 0;
  
  if (status === "completed") {
    if (totalEpisodes && !currentEpisode) {
      // Series: set to total episodes
      initialEpisode = totalEpisodes;
    } else if (!totalEpisodes && !currentEpisode) {
      // Movie: set to 1 to indicate watched (will show 100%)
      initialEpisode = 1;
    }
  }

  const now = serverTimestamp();
  const docRef = await addDoc(collection(db, COLLECTION), {
    userId,
    anilistId: media.id,
    category,
    title: media.title.romaji,
    titleEnglish: media.title.english ?? null,
    titleNative: media.title.native,
    coverImage: media.coverImage?.extraLarge ?? media.coverImage?.large ?? media.coverImage?.medium ?? "",
    bannerImage: media.bannerImage ?? null,
    description: media.description ?? null,
    totalEpisodes,
    duration: media.duration ?? null,
    seasonYear: media.seasonYear ?? null,
    format: media.format ?? null,
    genres: media.genres ?? [],
    countryOfOrigin: media.countryOfOrigin ?? null,
    airingStatus: media.status ?? null,
    nextAiringEpisode: media.nextAiringEpisode ?? null,
    startDate: media.startDate ?? null,
    studios: media.studios?.nodes.map(s => s.name) ?? [],
    averageScore: media.averageScore ?? null,
    source: media.source ?? null,
    status,
    currentEpisode: initialEpisode,
    userScore: null,
    notes: "",
    nickname: "",
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

/** Update editable fields, sanitising values before they reach the database. */
export async function updateWatchlistItem(
  itemId: string,
  updates: WatchlistUpdate,
  totalEpisodes?: number | null
): Promise<void> {
  const payload: Record<string, unknown> = {};

  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.notes !== undefined) payload.notes = updates.notes.slice(0, 5000);
  if (updates.nickname !== undefined) payload.nickname = updates.nickname.slice(0, 100);
  if (updates.currentEpisode !== undefined) {
    const max = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : 100_000;
    payload.currentEpisode = clamp(updates.currentEpisode, 0, max);
  }
  if (updates.userScore !== undefined) {
    payload.userScore =
      updates.userScore === null ? null : clamp(updates.userScore, 1, 10);
  }

  await updateDoc(doc(db, COLLECTION, itemId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

/** Remove a single entry. */
export async function removeFromWatchlist(itemId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, itemId));
}

const BATCH_LIMIT = 400;

/** Import many rows in chunked batches, skipping titles that already exist. */
export async function importWatchlist(
  userId: string,
  rows: WatchlistImportRow[],
  existingAniListIds: Set<number> = new Set()
): Promise<{ imported: number; skipped: number }> {
  const seen = new Set(existingAniListIds);
  const unique = rows.filter((row) => {
    if (seen.has(row.anilistId)) return false;
    seen.add(row.anilistId);
    return true;
  });

  for (let index = 0; index < unique.length; index += BATCH_LIMIT) {
    const chunk = unique.slice(index, index + BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const row of chunk) {
      const ref = doc(collection(db, COLLECTION));
      const now = serverTimestamp();
      batch.set(ref, {
        ...row,
        userId,
        createdAt: now,
        updatedAt: now,
      });
    }
    await batch.commit();
  }

  return { imported: unique.length, skipped: rows.length - unique.length };
}

/** Delete every watchlist entry owned by the user. */
export async function clearWatchlist(userId: string): Promise<number> {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId))
  );
  const docs = snapshot.docs;
  for (let index = 0; index < docs.length; index += BATCH_LIMIT) {
    const batch = writeBatch(db);
    docs.slice(index, index + BATCH_LIMIT).forEach((entry) => batch.delete(entry.ref));
    await batch.commit();
  }
  return docs.length;
}
