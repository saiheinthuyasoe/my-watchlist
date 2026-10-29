import type { TMDBApiProvider } from "./tmdb";

export interface UserPreferences {
  animeProvider: TMDBApiProvider;
  donghuaProvider: TMDBApiProvider;
  theme?: "light" | "dark" | "system";
  createdAt?: number;
  updatedAt?: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  animeProvider: "anilist",
  donghuaProvider: "tmdb", // TMDB is better for donghua episode tracking
  theme: "system",
};
