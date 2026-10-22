export interface AniListTitle {
  romaji: string;
  english: string | null;
  native: string;
}

export interface AniListCoverImage {
  extraLarge?: string;
  large: string;
  medium: string;
  color: string | null;
}

export interface AniListTag {
  name: string;
  category: string;
}

export type AniListSort =
  | "TRENDING_DESC"
  | "POPULARITY_DESC"
  | "SCORE_DESC"
  | "START_DATE_DESC";

export interface AniListAiringEpisode {
  episode: number;
  timeUntilAiring: number;
}

export interface AniListMedia {
  id: number;
  title: AniListTitle;
  coverImage: AniListCoverImage;
  bannerImage: string | null;
  description: string | null;
  episodes: number | null;
  duration: number | null;
  status: "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL" | null;
  seasonYear: number | null;
  averageScore: number | null;
  popularity: number;
  genres: string[];
  tags: AniListTag[];
  type: "ANIME" | "MANGA";
  format: "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA" | "MUSIC" | null;
  countryOfOrigin: string | null;
  isAdult: boolean;
  startDate?: { year: number | null; month: number | null; day: number | null } | null;

  // Present on detail responses
  trailer?: { id: string; site: string } | null;
  studios?: { nodes: { name: string }[] };
  nextAiringEpisode?: AniListAiringEpisode | null;
  siteUrl?: string | null;
  source?: string | null;
}

export interface AniListPageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface AniListSearchResult {
  Page: {
    media: AniListMedia[];
    pageInfo: AniListPageInfo;
  };
}

export type AnimeCategory = "anime" | "donghua";

export interface MediaQueryOptions {
  page?: number;
  perPage?: number;
  country?: string;
  genre?: string | null;
  format?: string | null;
  sort?: AniListSort;
  status?: string | null;
  season?: string | null;
  seasonYear?: number | null;
  source?: string | null;
  episodesMin?: number | null;
  episodesMax?: number | null;
  durationMin?: number | null;
  durationMax?: number | null;
  countryOfOrigin?: string | null;
}
