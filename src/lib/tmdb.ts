import type {
  TMDBTVShow,
  TMDBSearchResponse,
  TMDBSeasonDetails,
} from "@/types/tmdb";
import type { AniListMedia } from "@/types/anime";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// TMDB uses API key or Bearer token
function getAuthHeaders(): Record<string, string> {
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json;charset=utf-8",
    };
  }

  if (!apiKey) {
    throw new Error("TMDB API credentials not configured");
  }

  return {
    "Content-Type": "application/json;charset=utf-8",
  };
}

function getApiKey(): string {
  return process.env.TMDB_API_KEY ?? "";
}

async function tmdbRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  
  // Add api_key to params if using API key auth (not Bearer)
  if (!process.env.TMDB_API_READ_ACCESS_TOKEN && getApiKey()) {
    params.api_key = getApiKey();
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Search for TV shows on TMDB
 */
export async function searchTMDB(
  query: string,
  page: number = 1,
  language: string = "en-US"
): Promise<TMDBSearchResponse> {
  return tmdbRequest<TMDBSearchResponse>("/search/tv", {
    query,
    page: String(page),
    language,
    include_adult: "false",
  });
}

/**
 * Get detailed information about a TV show
 */
export async function getTVShowById(
  id: number,
  language: string = "en-US"
): Promise<TMDBTVShow> {
  return tmdbRequest<TMDBTVShow>(`/tv/${id}`, {
    language,
  });
}

/**
 * Get season details including all episodes
 */
export async function getSeasonDetails(
  tvId: number,
  seasonNumber: number,
  language: string = "en-US"
): Promise<TMDBSeasonDetails> {
  return tmdbRequest<TMDBSeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`, {
    language,
  });
}

/**
 * Get full image URL from TMDB path
 */
export function getTMDBImageUrl(
  path: string | null,
  size: "w500" | "w780" | "original" = "w500"
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

/**
 * Convert TMDB status to AniList status
 */
function convertStatus(tmdbStatus: string): AniListMedia["status"] {
  const statusMap: Record<string, AniListMedia["status"]> = {
    "Returning Series": "RELEASING",
    "In Production": "RELEASING",
    "Planned": "NOT_YET_RELEASED",
    "Ended": "FINISHED",
    "Canceled": "CANCELLED",
    "Pilot": "NOT_YET_RELEASED",
  };

  return statusMap[tmdbStatus] ?? "FINISHED";
}

/**
 * Convert TMDB first_air_date to season/year
 */
function extractSeasonYear(airDate: string | null): {
  season: AniListMedia["season"];
  seasonYear: number | null;
} {
  if (!airDate) return { season: null, seasonYear: null };

  const date = new Date(airDate);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  let season: AniListMedia["season"] = null;
  if (month >= 1 && month <= 3) season = "WINTER";
  else if (month >= 4 && month <= 6) season = "SPRING";
  else if (month >= 7 && month <= 9) season = "SUMMER";
  else if (month >= 10 && month <= 12) season = "FALL";

  return { season, seasonYear: year };
}

/**
 * Parse air date into year/month/day
 */
function parseAirDate(airDate: string | null): {
  year: number | null;
  month: number | null;
  day: number | null;
} {
  if (!airDate) return { year: null, month: null, day: null };

  const date = new Date(airDate);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

/**
 * Convert TMDB TV show to AniList media format
 */
export function convertTMDBToAniList(tmdb: TMDBTVShow): AniListMedia {
  const { season, seasonYear } = extractSeasonYear(tmdb.first_air_date);
  const averageRuntime = tmdb.episode_run_time?.[0] ?? null;

  // Check if it's Chinese animation (donghua)
  const isChinese = tmdb.origin_country.includes("CN") || 
                    tmdb.original_language === "zh" ||
                    tmdb.original_language === "cn";

  return {
    id: tmdb.id,
    title: {
      romaji: tmdb.name,
      english: tmdb.name !== tmdb.original_name ? tmdb.name : null,
      native: tmdb.original_name,
    },
    coverImage: {
      large: getTMDBImageUrl(tmdb.poster_path, "w500") ?? "",
      medium: getTMDBImageUrl(tmdb.poster_path, "w500") ?? "",
      extraLarge: getTMDBImageUrl(tmdb.poster_path, "w780") || undefined,
      color: null,
    },
    bannerImage: getTMDBImageUrl(tmdb.backdrop_path, "original") || null,
    description: tmdb.overview || null,
    episodes: tmdb.number_of_episodes || null,
    duration: averageRuntime,
    status: convertStatus(tmdb.status),
    season,
    seasonYear,
    startDate: parseAirDate(tmdb.first_air_date),
    averageScore: tmdb.vote_average ? Math.round(tmdb.vote_average * 10) : null,
    popularity: Math.round(tmdb.popularity),
    genres: tmdb.genres.map((g) => g.name),
    tags: [], // TMDB doesn't have tags like AniList
    type: "ANIME",
    format: determineFormat(tmdb),
    countryOfOrigin: isChinese ? "CN" : tmdb.origin_country[0] ?? null,
    isAdult: false,
    // Detail fields
    trailer: null, // Would need separate TMDB videos endpoint
    studios: tmdb.production_companies.length > 0 
      ? { nodes: tmdb.production_companies.slice(0, 3).map((c) => ({ name: c.name })) }
      : undefined,
    nextAiringEpisode: tmdb.next_episode_to_air
      ? {
          episode: tmdb.next_episode_to_air.episode_number,
          timeUntilAiring: tmdb.next_episode_to_air.air_date
            ? Math.max(0, Math.floor((new Date(tmdb.next_episode_to_air.air_date).getTime() - Date.now()) / 1000))
            : 0,
        }
      : undefined,
    siteUrl: `https://www.themoviedb.org/tv/${tmdb.id}`,
    source: null,
  };
}

/**
 * Convert TMDB search result to AniList media format
 */
export function convertTMDBSearchToAniList(tmdb: {
  id: number;
  name: string;
  original_name: string;
  original_language: string;
  origin_country: string[];
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  vote_average: number;
  popularity: number;
}): AniListMedia {
  const { season, seasonYear } = extractSeasonYear(tmdb.first_air_date);
  
  const isChinese = tmdb.origin_country.includes("CN") || 
                    tmdb.original_language === "zh" ||
                    tmdb.original_language === "cn";

  return {
    id: tmdb.id,
    title: {
      romaji: tmdb.name,
      english: tmdb.name !== tmdb.original_name ? tmdb.name : null,
      native: tmdb.original_name,
    },
    coverImage: {
      large: getTMDBImageUrl(tmdb.poster_path, "w500") ?? "",
      medium: getTMDBImageUrl(tmdb.poster_path, "w500") ?? "",
      extraLarge: getTMDBImageUrl(tmdb.poster_path, "w780") || undefined,
      color: null,
    },
    bannerImage: getTMDBImageUrl(tmdb.backdrop_path, "original") || null,
    description: tmdb.overview || null,
    episodes: null, // Not available in search results
    duration: null,
    status: "FINISHED", // Unknown from search results
    season,
    seasonYear,
    startDate: parseAirDate(tmdb.first_air_date),
    averageScore: tmdb.vote_average ? Math.round(tmdb.vote_average * 10) : null,
    popularity: Math.round(tmdb.popularity),
    genres: [], // genre_ids need separate lookup
    tags: [],
    type: "ANIME",
    format: "TV", // Default, can be refined with more data
    countryOfOrigin: isChinese ? "CN" : tmdb.origin_country[0] ?? null,
    isAdult: false,
  };
}

/**
 * Determine format based on TMDB type and episode count
 */
function determineFormat(tmdb: TMDBTVShow): AniListMedia["format"] {
  // TMDB type can be: Scripted, Reality, Documentary, News, Talk Show, Miniseries, Video
  if (tmdb.type === "Miniseries" || (tmdb.number_of_episodes && tmdb.number_of_episodes <= 3)) {
    return "SPECIAL";
  }

  if (tmdb.number_of_episodes === 1) {
    return "MOVIE";
  }

  // Most donghua and anime are TV series
  return "TV";
}

/**
 * Calculate total episodes across all seasons (excluding season 0/specials)
 */
export function calculateTotalEpisodes(tmdb: TMDBTVShow): number {
  return tmdb.seasons
    .filter((season) => season.season_number > 0) // Exclude specials
    .reduce((total, season) => total + season.episode_count, 0);
}
