"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Flame,
  Globe2,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { getTrending, searchMedia } from "@/lib/anilist";
import { useAuth } from "@/lib/auth-context";
import { useWatchlist } from "@/lib/watchlist-context";
import { computeStats } from "@/lib/stats";
import { GENRES, SORT_OPTIONS } from "@/lib/constants";
import { cn, getProgressPercent } from "@/lib/utils";
import type { AniListMedia, AniListPageInfo, AniListSort } from "@/types/anime";
import type { AnimeCategory, WatchlistItem } from "@/types/watchlist";
import { WATCH_STATUS_LABELS, WATCH_STATUSES } from "@/types/watchlist";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MediaGridSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { MediaCard } from "@/components/watchlist/MediaCard";
import { WatchlistCard } from "@/components/watchlist/WatchlistCard";
import { WatchlistRow } from "@/components/watchlist/WatchlistRow";
import { AddToWatchlistModal } from "@/components/watchlist/AddToWatchlistModal";
import { EditWatchlistModal } from "@/components/watchlist/EditWatchlistModal";
import {
  AdvancedFilters,
  type AdvancedFilterValues,
} from "@/components/library/AdvancedFilters";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: "", label: "Any year" },
  ...Array.from({ length: 50 }, (_, i) => currentYear - i).map((year) => ({
    value: String(year),
    label: String(year),
  })),
];

const SEASON_OPTIONS = [
  { value: "", label: "Any season" },
  { value: "WINTER", label: "Winter" },
  { value: "SPRING", label: "Spring" },
  { value: "SUMMER", label: "Summer" },
  { value: "FALL", label: "Fall" },
];

const AIRING_STATUS_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "RELEASING", label: "Currently airing" },
  { value: "FINISHED", label: "Finished airing" },
  { value: "NOT_YET_RELEASED", label: "Not yet released" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "HIATUS", label: "On hiatus" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "Any source" },
  { value: "ORIGINAL", label: "Original" },
  { value: "MANGA", label: "Manga" },
  { value: "LIGHT_NOVEL", label: "Light novel" },
  { value: "VISUAL_NOVEL", label: "Visual novel" },
  { value: "VIDEO_GAME", label: "Video game" },
  { value: "OTHER", label: "Other" },
  { value: "NOVEL", label: "Novel" },
  { value: "DOUJINSHI", label: "Doujinshi" },
  { value: "ANIME", label: "Anime" },
];

const CATEGORY_CONFIG = {
  anime: {
    label: "Anime",
    heading: "Japanese animation",
    blurb:
      "Follow seasonal releases, binge the classics, and keep every episode count in sync.",
    icon: BookOpen,
    country: undefined as string | undefined,
    placeholder: "Search anime — Frieren, Solo Leveling, Jujutsu Kaisen…",
  },
  donghua: {
    label: "Donghua",
    heading: "Chinese animation",
    blurb:
      "Cultivation sagas, 3D epics and hidden gems — filtered to Chinese origin titles.",
    icon: Globe2,
    country: "CN",
    placeholder: "Search donghua — Soul Land, Link Click, Swallowed Star…",
  },
} as const;

const FORMAT_OPTIONS = [
  { value: "", label: "All formats" },
  { value: "TV", label: "TV series" },
  { value: "MOVIE", label: "Movies" },
  { value: "OVA", label: "OVA" },
  { value: "ONA", label: "ONA" },
  { value: "SPECIAL", label: "Specials" },
  { value: "TV_SHORT", label: "TV short" },
];

const BROWSE_SORT_OPTIONS = [
  { value: "TRENDING_DESC", label: "Trending" },
  { value: "POPULARITY_DESC", label: "Most popular" },
  { value: "SCORE_DESC", label: "Highest rated" },
  { value: "START_DATE_DESC", label: "Newest" },
];

const GENRE_OPTIONS = [
  { value: "", label: "All genres" },
  ...GENRES.map((genre) => ({ value: genre, label: genre })),
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...WATCH_STATUSES.map((status) => ({
    value: status,
    label: WATCH_STATUS_LABELS[status],
  })),
];

function sortItems(
  items: WatchlistItem[],
  sort: string,
  direction: "asc" | "desc"
): WatchlistItem[] {
  const sorted = [...items];
  return sorted.sort((a, b) => {
    switch (sort) {
      case "score":
        return direction === "desc"
          ? (b.userScore ?? -1) - (a.userScore ?? -1)
          : (a.userScore ?? 11) - (b.userScore ?? 11);
      case "progress":
        return (
          getProgressPercent(b.currentEpisode, b.totalEpisodes) -
          getProgressPercent(a.currentEpisode, a.totalEpisodes)
        );
      case "title":
        return direction === "asc"
          ? (a.titleEnglish ?? a.title).localeCompare(b.titleEnglish ?? b.title)
          : (b.titleEnglish ?? b.title).localeCompare(a.titleEnglish ?? a.title);
      case "updated":
      default:
        return direction === "desc" ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt;
    }
  });
}

function applySortOption(items: WatchlistItem[], value: string) {
  switch (value) {
    case "updated_asc":
      return sortItems(items, "updated", "asc");
    case "score_desc":
      return sortItems(items, "score", "desc");
    case "score_asc":
      return sortItems(items, "score", "asc");
    case "progress_desc":
      return sortItems(items, "progress", "desc");
    case "title_asc":
      return sortItems(items, "title", "asc");
    case "title_desc":
      return sortItems(items, "title", "desc");
    case "updated_desc":
    default:
      return sortItems(items, "updated", "desc");
  }
}

interface BrowseState {
  key: string;
  results: AniListMedia[];
  pageInfo: AniListPageInfo | null;
  error: string | null;
}

export function LibraryView({ category }: { category: AnimeCategory }) {
  const config = CATEGORY_CONFIG[category];
  const toast = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const {
    items,
    byAniListId,
    loading: watchlistLoading,
    bumpEpisode,
    removeItem,
  } = useWatchlist();

  // Read URL parameter for tab (safe to use in client component)
  const searchParams = useSearchParams();
  const urlTab = searchParams?.get("tab") ?? null;

  // Null until the user picks a tab; until then the list wins for returning users.
  // But if URL has ?tab=myList, force to list tab
  const [tabOverride, setTabOverride] = useState<"browse" | "list" | null>(
    urlTab === "myList" ? "list" : null
  );

  // ── Discovery state ──────────────────────────────────────────────────────
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [format, setFormat] = useState("");
  const [browseSort, setBrowseSort] = useState("TRENDING_DESC");
  const [reloadToken, setReloadToken] = useState(0);
  const [browse, setBrowse] = useState<BrowseState | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterValues>({
    airingStatus: "",
    streaming: "",
    countryOfOrigin: "",
    source: "",
    yearMin: "",
    yearMax: "",
    episodesMin: "",
    episodesMax: "",
    durationMin: "",
    durationMax: "",
    year: "",
    season: "",
  });

  // ── Watchlist state ──────────────────────────────────────────────────────
  const [listQuery, setListQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [listGenre, setListGenre] = useState("");
  const [listSort, setListSort] = useState("updated_desc");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [listPageSize, setListPageSize] = useState(24); // Items per page
  const [listDisplayCount, setListDisplayCount] = useState(24); // Currently displayed items

  // Update tab when URL param changes
  useEffect(() => {
    if (urlTab === "myList") {
      setTabOverride("list");
    }
  }, [urlTab]);

  // Function to switch tabs and update URL
  const switchTab = (newTab: "browse" | "list") => {
    setTabOverride(newTab);
    
    // Update URL to reflect tab state
    if (newTab === "list") {
      router.replace(`${pathname}?tab=myList`, { scroll: false });
    } else {
      router.replace(pathname, { scroll: false });
    }
  };

  // ── Modals ───────────────────────────────────────────────────────────────
  const [addMedia, setAddMedia] = useState<AniListMedia | null>(null);
  const [editItem, setEditItem] = useState<WatchlistItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WatchlistItem | null>(null);

  const updateSearchInput = (value: string) => {
    setQueryInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(value.trim()), 400);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        category,
        query,
        genre,
        format,
        sort: browseSort,
        reloadToken,
        ...advancedFilters,
      }),
    [category, query, genre, format, browseSort, reloadToken, advancedFilters]
  );

  useEffect(() => {
    let cancelled = false;
    const options = {
      page: 1,
      perPage: 18,
      country: config.country,
      genre: genre || null,
      format: format || null,
      sort: browseSort as AniListSort,
      status: advancedFilters.airingStatus || null,
      season: advancedFilters.season || null,
      seasonYear: advancedFilters.year ? parseInt(advancedFilters.year) : null,
      source: advancedFilters.source || null,
      episodesMin: advancedFilters.episodesMin ? parseInt(advancedFilters.episodesMin) : null,
      episodesMax: advancedFilters.episodesMax ? parseInt(advancedFilters.episodesMax) : null,
      durationMin: advancedFilters.durationMin ? parseInt(advancedFilters.durationMin) : null,
      durationMax: advancedFilters.durationMax ? parseInt(advancedFilters.durationMax) : null,
      countryOfOrigin: advancedFilters.countryOfOrigin || null,
    };

    const run = async () => {
      try {
        const response = query
          ? await searchMedia(query, options)
          : await getTrending(options);
        if (!cancelled) {
          setBrowse({
            key: requestKey,
            results: response.Page.media,
            pageInfo: response.Page.pageInfo,
            error: null,
          });
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setBrowse({
            key: requestKey,
            results: [],
            pageInfo: null,
            error: "We couldn't reach AniList. Check your connection and retry.",
          });
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [requestKey, query, genre, format, browseSort, config.country, advancedFilters]);

  const categoryItems = useMemo(
    () => items.filter((item) => item.category === category),
    [items, category]
  );

  const tab =
    tabOverride ??
    (!watchlistLoading && categoryItems.length > 0 ? "list" : "browse");

  const results = browse?.key === requestKey ? browse.results : [];
  const pageInfo = browse?.key === requestKey ? browse.pageInfo : null;
  const browseError = browse?.key === requestKey ? browse.error : null;
  const loadingBrowse = !browse || browse.key !== requestKey;

  const loadMore = async () => {
    if (!pageInfo?.hasNextPage || loadingMore) return;
    const nextPage = (pageInfo.currentPage ?? 1) + 1;
    setLoadingMore(true);
    try {
      const options = {
        page: nextPage,
        perPage: 18,
        country: config.country,
        genre: genre || null,
        format: format || null,
        sort: browseSort as AniListSort,
        status: advancedFilters.airingStatus || null,
        season: advancedFilters.season || null,
        seasonYear: advancedFilters.year ? parseInt(advancedFilters.year) : null,
        source: advancedFilters.source || null,
        episodesMin: advancedFilters.episodesMin ? parseInt(advancedFilters.episodesMin) : null,
        episodesMax: advancedFilters.episodesMax ? parseInt(advancedFilters.episodesMax) : null,
        durationMin: advancedFilters.durationMin ? parseInt(advancedFilters.durationMin) : null,
        durationMax: advancedFilters.durationMax ? parseInt(advancedFilters.durationMax) : null,
        countryOfOrigin: advancedFilters.countryOfOrigin || null,
      };
      const response = query
        ? await searchMedia(query, options)
        : await getTrending(options);
      setBrowse((previous) =>
        previous && previous.key === requestKey
          ? {
              key: previous.key,
              results: [...previous.results, ...response.Page.media],
              pageInfo: response.Page.pageInfo,
              error: null,
            }
          : previous
      );
    } catch (error) {
      console.error(error);
      toast.error("Couldn't load more titles", "Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const categoryStats = useMemo(() => computeStats(categoryItems), [categoryItems]);

  const listGenres = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of categoryItems) {
      for (const name of item.genres) totals.set(name, (totals.get(name) ?? 0) + 1);
    }
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ value: name, label: `${name} (${count})` }));
  }, [categoryItems]);

  const filteredList = useMemo(() => {
    let list = categoryItems;
    if (statusFilter !== "all") {
      list = list.filter((item) => item.status === statusFilter);
    }
    if (listGenre) {
      list = list.filter((item) => item.genres.includes(listGenre));
    }
    const needle = listQuery.trim().toLowerCase();
    if (needle) {
      // AniList-like search: match words anywhere in the title or nickname
      const searchTerms = needle.split(/\s+/);
      list = list.filter((item) => {
        const searchText = [
          item.title,
          item.titleEnglish || "",
          item.titleNative,
          item.nickname || "",
        ].join(" ").toLowerCase();
        
        // All search terms must be found somewhere in the title or nickname
        return searchTerms.every(term => searchText.includes(term));
      });
    }
    return applySortOption(list, listSort);
  }, [categoryItems, statusFilter, listGenre, listQuery, listSort]);

  // Reset display count when filters change
  useEffect(() => {
    setListDisplayCount(listPageSize);
  }, [statusFilter, listGenre, listQuery, listSort, listPageSize]);

  const displayedList = useMemo(() => {
    return filteredList.slice(0, listDisplayCount);
  }, [filteredList, listDisplayCount]);

  const hasMoreListItems = filteredList.length > listDisplayCount;

  const loadMoreListItems = () => {
    setListDisplayCount((prev) => Math.min(prev + listPageSize, filteredList.length));
  };

  const activeFilters = Boolean(
    genre || format || query || Object.values(advancedFilters).some((v) => v)
  );
  const Icon = config.icon;

  const clearBrowseFilters = () => {
    setGenre("");
    setFormat("");
    setBrowseSort("TRENDING_DESC");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQueryInput("");
    setQuery("");
    setAdvancedFilters({
      airingStatus: "",
      streaming: "",
      countryOfOrigin: "",
      source: "",
      yearMin: "",
      yearMax: "",
      episodesMin: "",
      episodesMax: "",
      durationMin: "",
      durationMax: "",
      year: "",
      season: "",
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-subtle">
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {config.label}
            <span className="h-1 w-1 rounded-full bg-subtle" aria-hidden />
            {categoryStats.total} tracked
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {config.heading}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{config.blurb}</p>
        </div>

        <div className="flex shrink-0 items-center rounded-xl border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => switchTab("browse")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
              tab === "browse"
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-fg"
            )}
            aria-pressed={tab === "browse"}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Discover
          </button>
          <button
            type="button"
            onClick={() => switchTab("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
              tab === "list"
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-fg"
            )}
            aria-pressed={tab === "list"}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            My list
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px]",
                tab === "list" ? "bg-white/20" : "bg-elevated text-muted"
              )}
            >
              {categoryItems.length}
            </span>
          </button>
        </div>
      </header>

      {tab === "browse" ? (
        <div className="space-y-4">
          {/* Professional Filter Bar */}
          <div className="rounded-xl border border-line bg-white p-4 shadow-sm dark:bg-surface">
            {/* Header: Search + Quick Actions */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-accent" />
                <h3 className="text-lg font-semibold text-fg">
                  Discover {config.label}
                </h3>
              </div>
              
              {/* Advanced Filters + Clear */}
              <div className="flex items-center gap-2">
                <AdvancedFilters
                  values={advancedFilters}
                  onChange={(updates) =>
                    setAdvancedFilters((prev) => ({ ...prev, ...updates }))
                  }
                  onClear={() => {
                    setAdvancedFilters({
                      airingStatus: "",
                      streaming: "",
                      countryOfOrigin: "",
                      source: "",
                      yearMin: "",
                      yearMax: "",
                      episodesMin: "",
                      episodesMax: "",
                      durationMin: "",
                      durationMax: "",
                      year: "",
                      season: "",
                    });
                  }}
                  hideCountryFilter={category === "donghua"}
                />

                {activeFilters && (
                  <button
                    type="button"
                    onClick={clearBrowseFilters}
                    className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm text-accent transition hover:bg-accent/10"
                    aria-label="Clear all filters"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear all</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search Bar - Prominent Position */}
            <div className="mb-4">
              <Input
                placeholder={config.placeholder}
                value={queryInput}
                onChange={(event) => updateSearchInput(event.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                aria-label={`Search ${config.label}`}
                className="h-12 rounded-lg text-base"
                rightSlot={
                  queryInput ? (
                    <button
                      type="button"
                      onClick={() => updateSearchInput("")}
                      className="rounded-md p-1.5 text-subtle transition hover:bg-elevated hover:text-fg"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : undefined
                }
              />
            </div>

            {/* Primary Filters Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Genre */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Genre
                </label>
                <Select
                  options={GENRE_OPTIONS}
                  value={genre}
                  onChange={(event) => setGenre(event.target.value)}
                  aria-label="Filter by genre"
                  className="h-10 w-full"
                />
              </div>

              {/* Format */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Format
                </label>
                <Select
                  options={FORMAT_OPTIONS}
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                  aria-label="Filter by format"
                  className="h-10 w-full"
                />
              </div>

              {/* Year (Moved from advanced filters) */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Year
                </label>
                <Select
                  options={YEAR_OPTIONS}
                  value={advancedFilters.year}
                  onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, year: e.target.value }))}
                  aria-label="Filter by year"
                  className="h-10 w-full"
                />
              </div>

              {/* Season (Moved from advanced filters) */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Season
                </label>
                <Select
                  options={SEASON_OPTIONS}
                  value={advancedFilters.season}
                  onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, season: e.target.value }))}
                  aria-label="Filter by season"
                  className="h-10 w-full"
                />
              </div>
            </div>

            {/* Secondary Row: Sort */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Mobile: Dropdown */}
              <div className="flex items-center gap-2 sm:hidden">
                <span className="shrink-0 text-xs font-medium text-muted">Sort:</span>
                <Select
                  options={BROWSE_SORT_OPTIONS}
                  value={browseSort}
                  onChange={(event) => setBrowseSort(event.target.value)}
                  aria-label="Sort browse results"
                  className="h-9 flex-1 text-sm"
                />
              </div>

              {/* Desktop: Button pills */}
              <div className="hidden items-center gap-3 sm:flex">
                <span className="text-sm text-muted">Sort by:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {BROWSE_SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setBrowseSort(option.value)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                        browseSort === option.value
                          ? "bg-accent text-white"
                          : "text-muted hover:bg-elevated hover:text-fg"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Filters Pills */}
            {activeFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <span className="text-sm font-medium text-muted">Active:</span>
                <div className="flex flex-wrap gap-2">
                  {genre && (
                    <button
                      type="button"
                      onClick={() => setGenre("")}
                      className="inline-flex items-center gap-1"
                    >
                      <Badge variant="accent" className="cursor-pointer hover:bg-accent/80">
                        {genre} <X className="ml-1 h-3 w-3" />
                      </Badge>
                    </button>
                  )}
                  {format && (
                    <button
                      type="button"
                      onClick={() => setFormat("")}
                      className="inline-flex items-center gap-1"
                    >
                      <Badge variant="accent" className="cursor-pointer hover:bg-accent/80">
                        {FORMAT_OPTIONS.find((o) => o.value === format)?.label}{" "}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    </button>
                  )}
                  {advancedFilters.year && (
                    <button
                      type="button"
                      onClick={() =>
                        setAdvancedFilters((prev) => ({ ...prev, year: "" }))
                      }
                      className="inline-flex items-center gap-1"
                    >
                      <Badge variant="accent" className="cursor-pointer hover:bg-accent/80">
                        Year: {advancedFilters.year} <X className="ml-1 h-3 w-3" />
                      </Badge>
                    </button>
                  )}
                  {advancedFilters.season && (
                    <button
                      type="button"
                      onClick={() =>
                        setAdvancedFilters((prev) => ({ ...prev, season: "" }))
                      }
                      className="inline-flex items-center gap-1"
                    >
                      <Badge variant="accent" className="cursor-pointer hover:bg-accent/80">
                        {advancedFilters.season} <X className="ml-1 h-3 w-3" />
                      </Badge>
                    </button>
                  )}
                  {advancedFilters.airingStatus && (
                    <button
                      type="button"
                      onClick={() =>
                        setAdvancedFilters((prev) => ({ ...prev, airingStatus: "" }))
                      }
                      className="inline-flex items-center gap-1"
                    >
                      <Badge variant="accent" className="cursor-pointer hover:bg-accent/80">
                        {AIRING_STATUS_OPTIONS.find((o) => o.value === advancedFilters.airingStatus)?.label}{" "}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    </button>
                  )}
                  {advancedFilters.source && (
                    <button
                      type="button"
                      onClick={() =>
                        setAdvancedFilters((prev) => ({ ...prev, source: "" }))
                      }
                      className="inline-flex items-center gap-1"
                    >
                      <Badge variant="accent" className="cursor-pointer hover:bg-accent/80">
                        {SOURCE_OPTIONS.find((o) => o.value === advancedFilters.source)?.label}{" "}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
              {query ? (
                <>
                  Results for <span className="text-[var(--accent)]">“{query}”</span>
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4 text-orange-400" aria-hidden /> Trending now
                </>
              )}
              {pageInfo && (
                <Badge variant="outline" className="font-normal">
                  {pageInfo.total.toLocaleString()} titles
                </Badge>
              )}
            </h2>
            <span className="text-[11px] text-subtle">Metadata by AniList</span>
          </div>

          {loadingBrowse ? (
            <MediaGridSkeleton count={12} />
          ) : browseError ? (
            <EmptyState
              icon={RefreshCw}
              title="Couldn't load titles"
              description={browseError}
              action={
                <Button onClick={() => setReloadToken((token) => token + 1)}>Try again</Button>
              }
            />
          ) : results.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No titles found"
              description={`Nothing matched ${query ? `“${query}”` : "these filters"}. Try a different spelling or clear the filters.`}
              action={
                activeFilters ? (
                  <Button variant="secondary" onClick={clearBrowseFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {results.map((media, index) => (
                  <MediaCard
                    key={`${media.id}-${index}`}
                    media={media}
                    isInList={byAniListId.has(media.id)}
                    onAdd={setAddMedia}
                    priority={index < 6}
                  />
                ))}
              </div>

              {pageInfo?.hasNextPage && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => void loadMore()}
                    isLoading={loadingMore}
                  >
                    Load more titles
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {!user ? (
            <EmptyState
              icon={BookOpen}
              title="Sign in to build your list"
              description="Create a free account to track episodes, rate titles and sync across devices."
              action={
                <>
                  <Link
                    href="/auth/login"
                    className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-fg transition hover:bg-elevated"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
                  >
                    Create account
                  </Link>
                </>
              }
            />
          ) : watchlistLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : categoryItems.length === 0 ? (
            <EmptyState
              icon={Plus}
              title={`Your ${config.label.toLowerCase()} list is empty`}
              description="Find something to watch and it will show up here with progress tracking."
              action={
                <Button onClick={() => switchTab("browse")}>
                  <Sparkles className="h-4 w-4" aria-hidden /> Browse trending titles
                </Button>
              }
            />
          ) : (
            <>
              {/* Stats Dashboard */}
              <div className="rounded-xl border border-line bg-white p-4 shadow-sm dark:bg-surface">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-fg">List Statistics</h3>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                    {filteredList.length} of {categoryItems.length} shown
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-fg">{categoryStats.total}</div>
                    <div className="text-xs text-muted">Titles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-fg">{categoryStats.episodesWatched}</div>
                    <div className="text-xs text-muted">Episodes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-fg">{categoryStats.completionRate}%</div>
                    <div className="text-xs text-muted">Completed</div>
                  </div>
                  {categoryStats.averageScore !== null && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-fg">{categoryStats.averageScore.toFixed(1)}</div>
                      <div className="text-xs text-muted">Avg Score</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Filter Bar for My List */}
              <div className="rounded-xl border border-line bg-white p-4 shadow-sm dark:bg-surface">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <h3 className="text-lg font-semibold text-fg">
                      My {config.label} List
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex rounded-lg border border-line p-1" role="group" aria-label="View mode">
                      <button
                        type="button"
                        onClick={() => setView("grid")}
                        className={cn(
                          "rounded-md p-1.5 transition",
                          view === "grid"
                            ? "bg-accent text-white"
                            : "text-subtle hover:bg-elevated hover:text-fg"
                        )}
                        aria-label="Grid view"
                        aria-pressed={view === "grid"}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setView("list")}
                        className={cn(
                          "rounded-md p-1.5 transition",
                          view === "list"
                            ? "bg-accent text-white"
                            : "text-subtle hover:bg-elevated hover:text-fg"
                        )}
                        aria-label="List view"
                        aria-pressed={view === "list"}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                  <Input
                    placeholder="Search your list…"
                    value={listQuery}
                    onChange={(event) => setListQuery(event.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                    aria-label="Filter your list"
                    className="h-12 rounded-lg text-base"
                    rightSlot={
                      listQuery ? (
                        <button
                          type="button"
                          onClick={() => setListQuery("")}
                          className="rounded-md p-1.5 text-subtle transition hover:bg-elevated hover:text-fg"
                          aria-label="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : undefined
                    }
                  />
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {/* Status */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">
                      Watch Status
                    </label>
                    <Select
                      options={STATUS_OPTIONS}
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      aria-label="Filter by status"
                      className="h-10 w-full"
                    />
                  </div>

                  {/* Genre */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">
                      Genre
                    </label>
                    <Select
                      options={[{ value: "", label: "All genres" }, ...listGenres]}
                      value={listGenre}
                      onChange={(event) => setListGenre(event.target.value)}
                      aria-label="Filter by genre"
                      className="h-10 w-full"
                    />
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">
                      Sort by
                    </label>
                    <Select
                      options={SORT_OPTIONS.map((option) => ({ ...option }))}
                      value={listSort}
                      onChange={(event) => setListSort(event.target.value)}
                      aria-label="Sort your list"
                      className="h-10 w-full"
                    />
                  </div>
                </div>

                {/* Active Filters Pills (for My List) */}
                {(statusFilter !== "all" || listGenre || listQuery) && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    <span className="text-sm font-medium text-muted">Active:</span>
                    <div className="flex flex-wrap gap-2">
                      {statusFilter !== "all" && (
                        <button
                          type="button"
                          onClick={() => setStatusFilter("all")}
                          className="inline-flex items-center gap-1"
                        >
                          <Badge variant="accent" className="cursor-pointer hover:bg-accent/80">
                            {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}{" "}
                            <X className="ml-1 h-3 w-3" />
                          </Badge>
                        </button>
                      )}
                      {listGenre && (
                        <button
                          type="button"
                          onClick={() => setListGenre("")}
                          className="inline-flex items-center gap-1"
                        >
                          <Badge variant="accent" className="cursor-pointer hover:bg-accent/80">
                            {listGenre} <X className="ml-1 h-3 w-3" />
                          </Badge>
                        </button>
                      )}
                      {listQuery && (
                        <button
                          type="button"
                          onClick={() => setListQuery("")}
                          className="inline-flex items-center gap-1"
                        >
                          <Badge variant="accent" className="cursor-pointer hover:bg-accent/80">
                            "{listQuery}" <X className="ml-1 h-3 w-3" />
                          </Badge>
                        </button>
                      )}
                    </div>
                    {(statusFilter !== "all" || listGenre || listQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("all");
                          setListGenre("");
                          setListQuery("");
                        }}
                        className="ml-auto text-sm text-accent transition hover:text-accent-hover"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}
              </div>

              {filteredList.length === 0 ? (
                <EmptyState
                  compact
                  icon={Search}
                  title="Nothing matches those filters"
                  description="Try a different status, genre or search term."
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setStatusFilter("all");
                        setListGenre("");
                        setListQuery("");
                      }}
                    >
                      Reset filters
                    </Button>
                  }
                />
              ) : view === "grid" ? (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {displayedList.map((item) => (
                      <WatchlistCard
                        key={item.id}
                        item={item}
                        onEdit={setEditItem}
                        onDelete={setDeleteTarget}
                        onBump={(entry) => void bumpEpisode(entry, 1)}
                      />
                    ))}
                  </div>
                  
                  {hasMoreListItems && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="secondary"
                        onClick={loadMoreListItems}
                      >
                        Load more ({filteredList.length - listDisplayCount} remaining)
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    {displayedList.map((item) => (
                      <WatchlistRow
                        key={item.id}
                        item={item}
                        onEdit={setEditItem}
                        onDelete={setDeleteTarget}
                        onBump={(entry) => void bumpEpisode(entry, 1)}
                      />
                    ))}
                  </div>
                  
                  {hasMoreListItems && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="secondary"
                        onClick={loadMoreListItems}
                      >
                        Load more ({filteredList.length - listDisplayCount} remaining)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      <AddToWatchlistModal
        media={addMedia}
        category={category}
        isOpen={Boolean(addMedia)}
        onClose={() => setAddMedia(null)}
      />

      <EditWatchlistModal
        item={editItem}
        isOpen={Boolean(editItem)}
        onClose={() => setEditItem(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Remove from watchlist?"
        description={
          deleteTarget
            ? `“${deleteTarget.titleEnglish ?? deleteTarget.title}” and its progress will be deleted. This can't be undone.`
            : undefined
        }
        confirmLabel="Remove"
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await removeItem(deleteTarget);
        }}
      />
    </div>
  );
}
