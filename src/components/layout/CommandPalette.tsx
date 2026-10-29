"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CornerDownLeft,
  Globe2,
  LayoutDashboard,
  Loader2,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { searchMedia } from "@/lib/anilist";
import { OPEN_PALETTE_EVENT } from "@/lib/constants";
import { useWatchlist } from "@/lib/watchlist-context";
import { usePreferences } from "@/lib/preferences-context";
import { cn } from "@/lib/utils";
import type { WatchlistItem } from "@/types/watchlist";
import type { AniListMedia } from "@/types/anime";
import { StatusBadge } from "@/components/watchlist/StatusBadge";

type Row =
  | { kind: "nav"; id: string; label: string; href: string; icon: LucideIcon }
  | { kind: "watchlist"; id: string; item: WatchlistItem }
  | { kind: "media"; id: string; media: AniListMedia; inList: boolean };

const NAV_ROWS: Row[] = [
  { kind: "nav", id: "nav-dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { kind: "nav", id: "nav-anime", label: "Anime", href: "/anime", icon: BookOpen },
  { kind: "nav", id: "nav-donghua", label: "Donghua", href: "/donghua", icon: Globe2 },
  { kind: "nav", id: "nav-insights", label: "Insights", href: "/insights", icon: BarChart3 },
];

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function CommandPalette() {
  const router = useRouter();
  const { items, byAniListId } = useWatchlist();
  const { preferences } = usePreferences();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<AniListMedia[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPalette = useCallback(() => {
    setQuery("");
    setRemote([]);
    setSearching(false);
    setActive(0);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // Global shortcut + external open trigger from the navbar.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCommandK =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isCommandK) {
        event.preventDefault();
        setOpen((value) => {
          if (value) return false;
          setQuery("");
          setRemote([]);
          setSearching(false);
          setActive(0);
          return true;
        });
        return;
      }
      if (event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault();
        openPalette();
      }
    };
    const onOpen = () => openPalette();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, [openPalette]);

  // Focus the input and lock scrolling while open.
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Debounced remote search. State updates happen inside the async callback.
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    let ignore = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        // Use anime provider for command palette search (could be improved to search both)
        const result = await searchMedia(trimmed, { perPage: 6, provider: preferences.animeProvider });
        if (!ignore) setRemote(result.Page.media);
      } catch {
        if (!ignore) setRemote([]);
      } finally {
        if (!ignore) setSearching(false);
      }
    }, 300);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  const trimmed = query.trim().toLowerCase();

  const localItems = useMemo(() => {
    if (!trimmed) return items.slice(0, 3);
    return items
      .filter(
        (item) =>
          item.title.toLowerCase().includes(trimmed) ||
          (item.titleEnglish ?? "").toLowerCase().includes(trimmed) ||
          item.titleNative.toLowerCase().includes(trimmed)
      )
      .slice(0, 6);
  }, [items, trimmed]);

  const groups = useMemo(() => {
    const built: { label: string; rows: Row[] }[] = [];
    if (!trimmed) {
      built.push({ label: "Go to", rows: NAV_ROWS });
    }
    if (localItems.length > 0) {
      built.push({
        label: trimmed ? "In your watchlist" : "Recently updated",
        rows: localItems.map<Row>((item) => ({
          kind: "watchlist",
          id: `watchlist-${item.id}`,
          item,
        })),
      });
    }
    if (trimmed.length >= 2 && remote.length > 0) {
      built.push({
        label: "From AniList",
        rows: remote.map<Row>((media) => ({
          kind: "media",
          id: `media-${media.id}`,
          media,
          inList: byAniListId.has(media.id),
        })),
      });
    }
    return built;
  }, [trimmed, localItems, remote, byAniListId]);

  const flatRows = useMemo(() => groups.flatMap((group) => group.rows), [groups]);
  const safeActive = flatRows.length
    ? Math.min(active, flatRows.length - 1)
    : 0;

  useEffect(() => {
    if (!open) return;
    const row = flatRows[safeActive];
    const node = row ? document.getElementById(`palette-${row.id}`) : null;
    node?.scrollIntoView({ block: "nearest" });
  }, [safeActive, flatRows, open]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActive(0);
    if (value.trim().length < 2) {
      setRemote([]);
      setSearching(false);
    }
  };

  const select = (row: Row) => {
    if (row.kind === "nav") router.push(row.href);
    else if (row.kind === "watchlist") router.push(`/title/${row.item.anilistId}`);
    else router.push(`/title/${row.media.id}`);
    close();
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) =>
        flatRows.length ? (index + 1) % flatRows.length : 0
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) =>
        flatRows.length ? (index - 1 + flatRows.length) % flatRows.length : 0
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const row = flatRows[safeActive];
      if (row) select(row);
    } else if (event.key === "Escape") {
      close();
    }
  };

  if (!open || typeof document === "undefined") return null;

  let runningIndex = -1;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[10vh] sm:pt-[14vh]">
      <div
        className="absolute inset-0 animate-[fade-in_0.15s_ease-out] bg-[var(--overlay)] backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and commands"
        className="relative w-full max-w-2xl animate-[fade-up_0.2s_cubic-bezier(0.22,1,0.36,1)] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search anime, donghua, or jump to a page…"
            className="h-14 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-subtle"
            aria-label="Search anime, donghua and pages"
            autoComplete="off"
          />
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin text-subtle" aria-label="Searching" />
          ) : (
            <kbd className="hidden rounded border border-line bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-subtle sm:block">
              ESC
            </kbd>
          )}
        </div>

        <div
          id="command-results"
          role="listbox"
          aria-label="Results"
          className="max-h-[52vh] overflow-y-auto p-2"
        >
          {groups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
                {group.label}
              </p>
              {group.rows.map((row) => {
                runningIndex += 1;
                const index = runningIndex;
                const selected = index === safeActive;

                return (
                  <button
                    key={row.id}
                    id={`palette-${row.id}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => select(row)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      selected ? "bg-elevated" : "hover:bg-elevated/60"
                    )}
                  >
                    {row.kind === "nav" && (
                      <>
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted">
                          <row.icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="flex-1 text-sm font-medium text-fg">
                          {row.label}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-subtle" aria-hidden />
                      </>
                    )}

                    {row.kind === "watchlist" && (
                      <>
                        <span className="relative h-11 w-8 shrink-0 overflow-hidden rounded bg-elevated">
                          {row.item.coverImage && (
                            <Image
                              src={row.item.coverImage}
                              alt=""
                              fill
                              quality={95}
                              sizes="32px"
                              className="object-cover"
                            />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-fg">
                            {row.item.titleEnglish ?? row.item.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {row.item.currentEpisode}
                            {row.item.totalEpisodes
                              ? ` / ${row.item.totalEpisodes}`
                              : ""}{" "}
                            episodes
                          </span>
                        </span>
                        <StatusBadge status={row.item.status} showDot={false} />
                      </>
                    )}

                    {row.kind === "media" && (
                      <>
                        <span className="relative h-11 w-8 shrink-0 overflow-hidden rounded bg-elevated">
                          {(row.media.coverImage?.extraLarge ?? row.media.coverImage?.large ?? row.media.coverImage?.medium) && (
                            <Image
                              src={row.media.coverImage.extraLarge ?? row.media.coverImage.large ?? row.media.coverImage.medium}
                              alt=""
                              fill
                              quality={95}
                              sizes="32px"
                              className="object-cover"
                            />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-fg">
                            {row.media.title.english ?? row.media.title.romaji}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {[
                              row.media.format?.replace(/_/g, " "),
                              row.media.seasonYear,
                              row.media.episodes ? `${row.media.episodes} ep` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                        {row.inList ? (
                          <span className="shrink-0 text-[11px] font-medium text-emerald-400">
                            In list
                          </span>
                        ) : (
                          <CornerDownLeft
                            className="h-3.5 w-3.5 shrink-0 text-subtle"
                            aria-hidden
                          />
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {flatRows.length === 0 && !searching && (
            <p className="px-4 py-10 text-center text-sm text-muted">
              {trimmed.length >= 2
                ? `No results for “${query.trim()}”. Try another spelling.`
                : "Search for a title to get started."}
            </p>
          )}

          {trimmed.length === 1 && (
            <p className="px-4 pb-3 pt-1 text-center text-xs text-subtle">
              Keep typing to search AniList…
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-2.5 text-[11px] text-subtle">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-elevated px-1 py-0.5 font-mono">
                ↑
              </kbd>
              <kbd className="rounded border border-line bg-elevated px-1 py-0.5 font-mono">
                ↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-line bg-elevated px-1 py-0.5 font-mono">
                ↵
              </kbd>
              open
            </span>
          </div>
          <span>Data from AniList</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
