import type {
  AniListMedia,
  AniListPageInfo,
  AniListSearchResult,
  AniListSort,
  MediaQueryOptions,
} from "@/types/anime";
import { FALLBACK_ANIME, FALLBACK_DONGHUA } from "@/lib/fallback-data";

const DEFAULT_PER_PAGE = 18;

function buildParams(
  action: "search" | "trending",
  options: MediaQueryOptions & { query?: string }
): URLSearchParams {
  const params = new URLSearchParams({
    action,
    page: String(options.page ?? 1),
    perPage: String(options.perPage ?? DEFAULT_PER_PAGE),
  });
  if (options.query?.trim()) params.set("query", options.query.trim());
  if (options.country) params.set("country", options.country);
  if (options.genre) params.set("genre", options.genre);
  if (options.format) params.set("format", options.format);
  if (options.sort) params.set("sort", options.sort);
  if (options.status) params.set("status", options.status);
  if (options.season) params.set("season", options.season);
  if (options.seasonYear) params.set("seasonYear", String(options.seasonYear));
  if (options.source) params.set("source", options.source);
  if (options.episodesMin) params.set("episodesMin", String(options.episodesMin));
  if (options.episodesMax) params.set("episodesMax", String(options.episodesMax));
  if (options.durationMin) params.set("durationMin", String(options.durationMin));
  if (options.durationMax) params.set("durationMax", String(options.durationMax));
  if (options.countryOfOrigin) params.set("country", options.countryOfOrigin);
  return params;
}

function sortFallback(media: AniListMedia[], sort: AniListSort): AniListMedia[] {
  const copy = [...media];
  switch (sort) {
    case "SCORE_DESC":
      return copy.sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0));
    case "START_DATE_DESC":
      return copy.sort((a, b) => (b.seasonYear ?? 0) - (a.seasonYear ?? 0));
    case "POPULARITY_DESC":
    case "TRENDING_DESC":
    default:
      return copy.sort((a, b) => b.popularity - a.popularity);
  }
}

function applyFallbackFilters(
  media: AniListMedia[],
  options: MediaQueryOptions & { query?: string }
): AniListMedia[] {
  return media.filter((entry) => {
    if (options.country && entry.countryOfOrigin !== options.country) return false;
    if (options.genre && !entry.genres.includes(options.genre)) return false;
    if (options.format && entry.format !== options.format) return false;
    if (options.status && entry.status !== options.status) return false;
    if (options.season && entry.season !== options.season) return false;
    if (options.seasonYear && entry.seasonYear !== options.seasonYear) return false;
    if (options.episodesMin && (entry.episodes ?? 0) < options.episodesMin) return false;
    if (options.episodesMax && (entry.episodes ?? 999) > options.episodesMax) return false;
    if (options.durationMin && (entry.duration ?? 0) < options.durationMin) return false;
    if (options.durationMax && (entry.duration ?? 999) > options.durationMax) return false;
    if (options.source && entry.source !== options.source) return false;
    if (options.countryOfOrigin && entry.countryOfOrigin !== options.countryOfOrigin) return false;
    
    const query = options.query?.trim().toLowerCase() ?? "";
    if (!query) return true;
    
    const haystack = [
      entry.title.romaji,
      entry.title.english ?? "",
      entry.title.native,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

/** Local, paginated fallback when AniList is unreachable. */
function fallbackResult(
  options: MediaQueryOptions & { query?: string }
): AniListSearchResult {
  const source = options.country === "CN" ? FALLBACK_DONGHUA : FALLBACK_ANIME;
  let media = applyFallbackFilters(source, options);
  media = sortFallback(media, options.sort ?? "TRENDING_DESC");

  const page = Math.max(1, options.page ?? 1);
  const perPage = options.perPage ?? DEFAULT_PER_PAGE;
  const total = media.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;

  const pageInfo: AniListPageInfo = {
    total,
    currentPage: page,
    lastPage,
    hasNextPage: page < lastPage,
  };

  return {
    Page: { media: media.slice(start, start + perPage), pageInfo },
  };
}

async function request(params: URLSearchParams): Promise<AniListSearchResult> {
  const response = await fetch(`/api/media?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Media API responded with ${response.status}`);
  }
  const data = (await response.json()) as AniListSearchResult;
  if (!data?.Page?.media) {
    throw new Error("Media API returned an unexpected payload");
  }
  return data;
}

/** Search Anime or Donghua by title. */
export async function searchMedia(
  query: string,
  options: MediaQueryOptions = {}
): Promise<AniListSearchResult> {
  if (!query.trim()) return fallbackResult({ ...options, query: "" });
  try {
    return await request(buildParams("search", { ...options, query }));
  } catch (error) {
    console.warn("AniList search fell back to curated data:", error);
    return fallbackResult({ ...options, query });
  }
}

/** Trending / popular titles, optionally filtered by genre or format. */
export async function getTrending(
  options: MediaQueryOptions = {}
): Promise<AniListSearchResult> {
  try {
    return await request(buildParams("trending", options));
  } catch (error) {
    console.warn("AniList trending fell back to curated data:", error);
    return fallbackResult(options);
  }
}

/** Full details for a single title. Returns null if it cannot be found. */
export async function getMediaById(id: number): Promise<AniListMedia | null> {
  // Always fetch from AniList API first to get complete details (studios, source, etc.)
  try {
    const params = new URLSearchParams({ action: "detail", id: String(id) });
    const response = await fetch(`/api/media?${params.toString()}`);
    if (!response.ok) {
      // Try fallback as last resort
      const local = [...FALLBACK_ANIME, ...FALLBACK_DONGHUA].find(
        (entry) => entry.id === id
      );
      return local ?? null;
    }
    const data = (await response.json()) as { Media: AniListMedia | null };
    return data.Media ?? null;
  } catch (error) {
    console.warn("AniList detail request failed, trying fallback:", error);
    // Use fallback only if API completely fails
    const local = [...FALLBACK_ANIME, ...FALLBACK_DONGHUA].find(
      (entry) => entry.id === id
    );
    return local ?? null;
  }
}
