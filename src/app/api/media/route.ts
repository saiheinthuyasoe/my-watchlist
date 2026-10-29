import { NextResponse } from "next/server";
import { FALLBACK_ANIME, FALLBACK_DONGHUA } from "@/lib/fallback-data";
import type { AniListMedia, AniListSearchResult } from "@/types/anime";
import {
  searchTMDB,
  getTVShowById,
  convertTMDBToAniList,
  convertTMDBSearchToAniList,
  calculateTotalEpisodes,
} from "@/lib/tmdb";
import type { TMDBApiProvider } from "@/types/tmdb";

const ANILIST_API = "https://graphql.anilist.co";

// Simple in-memory rate limiter
const rateLimiter = {
  requests: [] as number[],
  maxRequests: 90, // AniList allows 90 requests per minute
  windowMs: 60000, // 1 minute
  
  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove requests older than the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  },
  
  getWaitTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = this.requests[0];
    const timeToWait = this.windowMs - (Date.now() - oldestRequest);
    return Math.max(0, timeToWait);
  }
};

const MEDIA_FIELDS = `
  id
  title {
    romaji
    english
    native
  }
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  description(asHtml: false)
  episodes
  duration
  status
  season
  seasonYear
  startDate {
    year
    month
    day
  }
  averageScore
  popularity
  genres
  tags {
    name
    category
  }
  type
  format
  countryOfOrigin
  isAdult
`;

const DETAIL_FIELDS = `
  ${MEDIA_FIELDS}
  trailer {
    id
    site
  }
  studios(isMain: true) {
    nodes {
      name
    }
  }
  nextAiringEpisode {
    episode
    timeUntilAiring
  }
  siteUrl
  source
  relations {
    edges {
      id
      relationType
      node {
        id
        type
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
          large
          medium
        }
        format
        status
        seasonYear
      }
    }
  }
`;

const SORT_VALUES = [
  "TRENDING_DESC",
  "POPULARITY_DESC",
  "SCORE_DESC",
  "START_DATE_DESC",
] as const;

const FORMAT_VALUES = [
  "TV",
  "TV_SHORT",
  "MOVIE",
  "SPECIAL",
  "OVA",
  "ONA",
  "MUSIC",
] as const;

const STATUS_VALUES = [
  "RELEASING",
  "FINISHED",
  "NOT_YET_RELEASED",
  "CANCELLED",
  "HIATUS",
] as const;

const SEASON_VALUES = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;

const SOURCE_VALUES = [
  "ORIGINAL",
  "MANGA",
  "LIGHT_NOVEL",
  "VISUAL_NOVEL",
  "VIDEO_GAME",
  "OTHER",
  "NOVEL",
  "DOUJINSHI",
  "ANIME",
] as const;

interface CacheEntry {
  expires: number;
  body: unknown;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const cache = new Map<string, CacheEntry>();

function readCache(key: string) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.body;
}

function writeCache(key: string, body: unknown) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, body });
}

async function anilistRequest(
  query: string,
  variables: Record<string, unknown>
): Promise<unknown> {
  // Check rate limit before making request
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = rateLimiter.getWaitTime();
    console.warn(`Rate limit reached. Need to wait ${Math.ceil(waitTime / 1000)}s`);
    throw new Error("Rate limit exceeded. Please try again in a moment.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "MyWatchlist/1.0 (https://github.com/yourrepo/my-watchlist)",
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`AniList responded with ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: unknown;
      errors?: { message?: string }[];
    };

    if (payload.errors?.length) {
      throw new Error(payload.errors[0]?.message ?? "AniList returned an error");
    }
    if (!payload.data) throw new Error("AniList returned no data");
    return payload.data;
  } finally {
    clearTimeout(timeout);
  }
}

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function fallbackPage(options: {
  query: string;
  country: string | null;
  genre: string | null;
  format: string | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  episodesMin: number | null;
  episodesMax: number | null;
  durationMin: number | null;
  durationMax: number | null;
  source: string | null;
  sort: string;
  page: number;
  perPage: number;
}): AniListSearchResult {
  const source: AniListMedia[] =
    options.country === "CN" ? FALLBACK_DONGHUA : FALLBACK_ANIME;
  const needle = options.query.toLowerCase();

  let media = source.filter((entry) => {
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
    if (!needle) return true;
    return [entry.title.romaji, entry.title.english ?? "", entry.title.native]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  media = [...media].sort((a, b) => {
    if (options.sort === "SCORE_DESC") {
      return (b.averageScore ?? 0) - (a.averageScore ?? 0);
    }
    if (options.sort === "START_DATE_DESC") {
      return (b.seasonYear ?? 0) - (a.seasonYear ?? 0);
    }
    return b.popularity - a.popularity;
  });

  const total = media.length;
  const lastPage = Math.max(1, Math.ceil(total / options.perPage));
  const start = (options.page - 1) * options.perPage;

  return {
    Page: {
      media: media.slice(start, start + options.perPage),
      pageInfo: {
        total,
        currentPage: options.page,
        lastPage,
        hasNextPage: options.page < lastPage,
      },
    },
  };
}

function json(body: unknown, cacheStatus: "HIT" | "MISS" | "BYPASS") {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      "X-Cache": cacheStatus,
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") ?? "trending";
  const provider = (searchParams.get("provider") ?? "anilist") as TMDBApiProvider;
  const query = (searchParams.get("query") ?? "").trim();
  const country = searchParams.get("country");
  const genre = searchParams.get("genre");
  const formatParam = searchParams.get("format");
  const sortParam = searchParams.get("sort");
  const statusParam = searchParams.get("status");
  const seasonParam = searchParams.get("season");
  const seasonYearParam = searchParams.get("seasonYear");
  const sourceParam = searchParams.get("source");
  const episodesMinParam = searchParams.get("episodesMin");
  const episodesMaxParam = searchParams.get("episodesMax");
  const durationMinParam = searchParams.get("durationMin");
  const durationMaxParam = searchParams.get("durationMax");
  const page = clampInt(searchParams.get("page"), 1, 1, 500);
  const perPage = clampInt(searchParams.get("perPage"), 18, 1, 50);

  const format = FORMAT_VALUES.includes(
    (formatParam ?? "") as (typeof FORMAT_VALUES)[number]
  )
    ? formatParam
    : null;

  const status = STATUS_VALUES.includes(
    (statusParam ?? "") as (typeof STATUS_VALUES)[number]
  )
    ? statusParam
    : null;

  const season = SEASON_VALUES.includes(
    (seasonParam ?? "") as (typeof SEASON_VALUES)[number]
  )
    ? seasonParam
    : null;

  const source = SOURCE_VALUES.includes(
    (sourceParam ?? "") as (typeof SOURCE_VALUES)[number]
  )
    ? sourceParam
    : null;

  const seasonYear = seasonYearParam
    ? clampInt(seasonYearParam, null as any, 1940, new Date().getFullYear())
    : null;

  const episodesMin = episodesMinParam ? clampInt(episodesMinParam, null as any, 1, 9999) : null;
  const episodesMax = episodesMaxParam ? clampInt(episodesMaxParam, null as any, 1, 9999) : null;
  const durationMin = durationMinParam ? clampInt(durationMinParam, null as any, 1, 999) : null;
  const durationMax = durationMaxParam ? clampInt(durationMaxParam, null as any, 1, 999) : null;

  const sort: string = SORT_VALUES.includes(
    (sortParam ?? "") as (typeof SORT_VALUES)[number]
  )
    ? (sortParam as string)
    : "TRENDING_DESC";

  const cacheKey = new URL(request.url).search;
  const cached = readCache(cacheKey);
  if (cached) return json(cached, "HIT");

  // ── Detail ────────────────────────────────────────────────────────────────
  if (action === "detail") {
    const id = clampInt(searchParams.get("id"), 0, 1, Number.MAX_SAFE_INTEGER);
    if (!id) {
      return NextResponse.json({ error: "A valid id is required" }, { status: 400 });
    }

    // TMDB Provider
    if (provider === "tmdb") {
      try {
        const tmdbShow = await getTVShowById(id);
        const media = convertTMDBToAniList(tmdbShow);
        // Calculate accurate total episodes across all seasons
        const totalEpisodes = calculateTotalEpisodes(tmdbShow);
        media.episodes = totalEpisodes;
        
        const body = { Media: media };
        writeCache(cacheKey, body);
        return json(body, "MISS");
      } catch (error) {
        console.warn("TMDB detail failed:", error);
        return NextResponse.json(
          { error: "Could not load this title from TMDB" },
          { status: 502 }
        );
      }
    }

    // AniList Provider (default)
    // Always fetch from AniList to get complete detailed information (studios, source, etc.)
    // Don't use fallback data for details as it lacks comprehensive fields
    try {
      const data = (await anilistRequest(
        `query ($id: Int) {
          Media(id: $id, type: ANIME) { ${DETAIL_FIELDS} }
        }`,
        { id }
      )) as { Media: AniListMedia | null };

      if (!data?.Media) {
        // Try fallback only if AniList doesn't have it
        const local = [...FALLBACK_ANIME, ...FALLBACK_DONGHUA].find(
          (entry) => entry.id === id
        );
        if (local) {
          const body = { Media: local };
          writeCache(cacheKey, body);
          return json(body, "MISS");
        }
        return NextResponse.json({ Media: null }, { status: 404 });
      }
      writeCache(cacheKey, data);
      return json(data, "MISS");
    } catch (error) {
      console.warn("AniList detail failed, trying fallback:", error);
      // Use fallback as last resort
      const local = [...FALLBACK_ANIME, ...FALLBACK_DONGHUA].find(
        (entry) => entry.id === id
      );
      if (local) {
        const body = { Media: local };
        return json(body, "MISS");
      }
      return NextResponse.json(
        { error: "Could not load this title right now" },
        { status: 502 }
      );
    }
  }

  // ── Search / Trending ─────────────────────────────────────────────────────
  const isSearch = action === "search" && query.length > 0;

  // TMDB Provider
  if (provider === "tmdb") {
    if (isSearch) {
      try {
        const tmdbResults = await searchTMDB(query, page);
        const media = tmdbResults.results.map((result) =>
          convertTMDBSearchToAniList(result)
        );

        const body: AniListSearchResult = {
          Page: {
            media,
            pageInfo: {
              total: tmdbResults.total_results,
              currentPage: tmdbResults.page,
              lastPage: tmdbResults.total_pages,
              hasNextPage: tmdbResults.page < tmdbResults.total_pages,
            },
          },
        };

        writeCache(cacheKey, body);
        return json(body, "MISS");
      } catch (error) {
        console.warn("TMDB search failed:", error);
        return json(
          {
            Page: {
              media: [],
              pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false },
            },
          },
          "BYPASS"
        );
      }
    } else {
      // TMDB doesn't have a "trending" endpoint like AniList
      // Automatically fall back to AniList for browse/trending
      console.log("TMDB doesn't support trending, falling back to AniList");
      // Don't return error, let it continue to AniList provider below
    }
  }

  // AniList Provider (default) or fallback when TMDB doesn't support the action
  // AniList treats explicit `null` filter arguments as real filters (returning
  // zero results), so only send the arguments the caller actually used.
  const declarations = ["$page: Int", "$perPage: Int"];
  const mediaArgs = ["type: ANIME", "isAdult: false"];
  const variables: Record<string, unknown> = { page, perPage };

  if (country) {
    declarations.push("$country: CountryCode");
    mediaArgs.push("countryOfOrigin: $country");
    variables.country = country;
  }
  if (genre) {
    declarations.push("$genre: String");
    mediaArgs.push("genre_in: [$genre]");
    variables.genre = genre;
  }
  if (format) {
    declarations.push("$format: MediaFormat");
    mediaArgs.push("format: $format");
    variables.format = format;
  }
  if (status) {
    declarations.push("$status: MediaStatus");
    mediaArgs.push("status: $status");
    variables.status = status;
  }
  if (season) {
    declarations.push("$season: MediaSeason");
    mediaArgs.push("season: $season");
    variables.season = season;
  }
  if (seasonYear) {
    declarations.push("$seasonYear: Int");
    mediaArgs.push("seasonYear: $seasonYear");
    variables.seasonYear = seasonYear;
  }
  if (source) {
    declarations.push("$source: MediaSource");
    mediaArgs.push("source: $source");
    variables.source = source;
  }
  if (episodesMin !== null) {
    declarations.push("$episodesMin: Int");
    mediaArgs.push("episodes_greater: $episodesMin");
    variables.episodesMin = episodesMin;
  }
  if (episodesMax !== null) {
    declarations.push("$episodesMax: Int");
    mediaArgs.push("episodes_lesser: $episodesMax");
    variables.episodesMax = episodesMax;
  }
  if (durationMin !== null) {
    declarations.push("$durationMin: Int");
    mediaArgs.push("duration_greater: $durationMin");
    variables.durationMin = durationMin;
  }
  if (durationMax !== null) {
    declarations.push("$durationMax: Int");
    mediaArgs.push("duration_lesser: $durationMax");
    variables.durationMax = durationMax;
  }

  if (isSearch) {
    declarations.push("$search: String");
    mediaArgs.push("search: $search", "sort: SEARCH_MATCH");
    variables.search = query;
  } else {
    declarations.push("$sort: [MediaSort]");
    mediaArgs.push("sort: $sort");
    variables.sort = [sort];
  }

  const gql = `query (${declarations.join(", ")}) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(${mediaArgs.join(", ")}) { ${MEDIA_FIELDS} }
    }
  }`;

  try {
    const data = (await anilistRequest(gql, variables)) as AniListSearchResult;
    if (data?.Page?.media?.length) {
      writeCache(cacheKey, data);
      return json(data, "MISS");
    }
    // An empty result set is still a valid response, but a curated fallback
    // keeps discovery useful during AniList outages.
    if (!isSearch) throw new Error("No media returned");
    return json(data, "MISS");
  } catch (error) {
    console.warn("AniList query failed, serving curated fallback:", error);
    return json(
      fallbackPage({
        query,
        country,
        genre,
        format,
        status,
        season,
        seasonYear,
        episodesMin,
        episodesMax,
        durationMin,
        durationMax,
        source,
        sort,
        page,
        perPage,
      }),
      "BYPASS"
    );
  }
}
