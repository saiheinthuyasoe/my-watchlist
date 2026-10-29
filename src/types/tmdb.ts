export interface TMDBTitle {
  name: string;
  original_name: string;
}

export interface TMDBImage {
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBNetwork {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBCreator {
  id: number;
  credit_id: string;
  name: string;
  gender: number;
  profile_path: string | null;
}

export interface TMDBSeason {
  air_date: string | null;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  air_date: string | null;
  episode_number: number;
  episode_type: string;
  production_code: string;
  runtime: number | null;
  season_number: number;
  show_id: number;
  still_path: string | null;
}

export interface TMDBSeasonDetails extends TMDBSeason {
  _id: string;
  episodes: TMDBEpisode[];
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  original_language: string;
  origin_country: string[];
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  last_air_date: string | null;
  genres: TMDBGenre[];
  homepage: string | null;
  in_production: boolean;
  languages: string[];
  last_episode_to_air: TMDBEpisode | null;
  next_episode_to_air: TMDBEpisode | null;
  networks: TMDBNetwork[];
  number_of_episodes: number;
  number_of_seasons: number;
  popularity: number;
  production_companies: TMDBProductionCompany[];
  seasons: TMDBSeason[];
  status: string;
  tagline: string;
  type: string;
  vote_average: number;
  vote_count: number;
  created_by: TMDBCreator[];
  episode_run_time: number[];
}

export interface TMDBSearchResult {
  id: number;
  name: string;
  original_name: string;
  original_language: string;
  origin_country: string[];
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  genre_ids: number[];
  popularity: number;
  vote_average: number;
  vote_count: number;
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBSearchResult[];
  total_pages: number;
  total_results: number;
}

// Type to convert TMDB data to our unified AniListMedia format
export interface TMDBToAniListAdapter {
  convertTVShow(tmdb: TMDBTVShow): import('./anime').AniListMedia;
  convertSearchResult(tmdb: TMDBSearchResult): import('./anime').AniListMedia;
}

export type TMDBApiProvider = 'anilist' | 'tmdb';
