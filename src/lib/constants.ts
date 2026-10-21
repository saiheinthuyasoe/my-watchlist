export const OPEN_PALETTE_EVENT = "mywatchlist:open-palette";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/anime", label: "Anime" },
  { href: "/donghua", label: "Donghua" },
  { href: "/insights", label: "Insights" },
] as const;

export const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
] as const;

export const SEASON_OPTIONS = [
  { value: "", label: "All seasons" },
  { value: "WINTER", label: "Winter" },
  { value: "SPRING", label: "Spring" },
  { value: "SUMMER", label: "Summer" },
  { value: "FALL", label: "Fall" },
] as const;

export const AIRING_STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "RELEASING", label: "Airing" },
  { value: "FINISHED", label: "Finished" },
  { value: "NOT_YET_RELEASED", label: "Not yet released" },
  { value: "HIATUS", label: "On hiatus" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const COUNTRY_OPTIONS = [
  { value: "", label: "All countries" },
  { value: "JP", label: "Japan" },
  { value: "CN", label: "China" },
  { value: "KR", label: "South Korea" },
  { value: "TW", label: "Taiwan" },
] as const;

export const SOURCE_OPTIONS = [
  { value: "", label: "Any source" },
  { value: "ORIGINAL", label: "Original" },
  { value: "MANGA", label: "Manga" },
  { value: "LIGHT_NOVEL", label: "Light novel" },
  { value: "NOVEL", label: "Novel" },
  { value: "WEB_NOVEL", label: "Web novel" },
  { value: "VISUAL_NOVEL", label: "Visual novel" },
  { value: "VIDEO_GAME", label: "Video game" },
  { value: "DOUJINSHI", label: "Doujinshi" },
  { value: "COMIC", label: "Comic" },
  { value: "MULTIMEDIA_PROJECT", label: "Multimedia project" },
  { value: "PICTURE_BOOK", label: "Picture book" },
  { value: "LIVE_ACTION", label: "Live action" },
  { value: "GAME", label: "Game" },
  { value: "OTHER", label: "Other" },
] as const;

/**
 * "Streaming on" maps to AniList's `licensedBy_in` filter. These values were
 * verified against the live API — empty strings return zero results.
 */
export const STREAMING_OPTIONS = [
  { value: "", label: "Any platform" },
  { value: "Crunchyroll", label: "Crunchyroll" },
  { value: "Netflix", label: "Netflix" },
  { value: "Hulu", label: "Hulu" },
  { value: "Amazon Prime Video", label: "Amazon Prime Video" },
  { value: "HiDive", label: "HiDive" },
  { value: "YouTube", label: "YouTube" },
  { value: "Apple TV+", label: "Apple TV+" },
  { value: "Retrocrush", label: "Retrocrush" },
  { value: "Bilibili", label: "Bilibili" },
  { value: "Tencent Video", label: "Tencent Video" },
  { value: "iQIYI", label: "iQIYI" },
  { value: "Youku", label: "Youku" },
  { value: "WeTV", label: "WeTV" },
] as const;

/**
 * Curated AniList tags for the quick filter. Every name here was verified
 * against the live tag collection (see scripts/refresh-fallback.mjs for the
 * harvesting technique) so `tag_in` never silently matches nothing.
 */
export const TAG_OPTIONS = [
  "Isekai",
  "Reincarnation",
  "Cultivation",
  "Wuxia",
  "Martial Arts",
  "Swordplay",
  "Magic",
  "Super Power",
  "Demons",
  "Gods",
  "Dragons",
  "Vampire",
  "Werewolf",
  "Youkai",
  "Ghost",
  "Aliens",
  "Space",
  "Cyberpunk",
  "Steampunk",
  "Dystopian",
  "Post-Apocalyptic",
  "Historical",
  "Medieval",
  "School",
  "College",
  "Military",
  "Crime",
  "Detective",
  "Police",
  "Espionage",
  "Assassins",
  "War",
  "Survival",
  "Death Game",
  "Battle Royale",
  "Revenge",
  "Philosophy",
  "Mythology",
  "Time Manipulation",
  "Time Skip",
  "Otaku Culture",
  "Parody",
  "Slapstick",
  "Satire",
  "Love Triangle",
  "Unrequited Love",
  "Tsundere",
  "Villainess",
  "Full CGI",
  "Kaiju",
  "Ninja",
  "Idol",
  "Food",
  "Iyashikei",
  "Ensemble Cast",
  "Female Protagonist",
  "Male Protagonist",
  "LGBTQ+ Themes",
  "Video Games",
  "E-Sports",
  "Robots",
  "Artificial Intelligence",
  "Virtual World",
  "Necromancy",
  "Alchemy",
  "Witch",
  "Fairy",
  "Found Family",
  "Coming of Age",
  "Animals",
  "Amnesia",
  "Shapeshifting",
] as const;

/** Season-year picker: current year back to 1970. */
export function buildYearOptions(label = "All years") {
  const options = [{ value: "", label }];
  for (let year = new Date().getFullYear(); year >= 1970; year -= 1) {
    options.push({ value: String(year), label: String(year) });
  }
  return options;
}

export const SORT_OPTIONS = [
  { value: "updated_desc", label: "Recently updated" },
  { value: "updated_asc", label: "Oldest updated" },
  { value: "score_desc", label: "Highest score" },
  { value: "score_asc", label: "Lowest score" },
  { value: "progress_desc", label: "Most progress" },
  { value: "title_asc", label: "Title A–Z" },
  { value: "title_desc", label: "Title Z–A" },
] as const;
