"use client";

import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { WatchlistItem } from "@/types/watchlist";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { cn } from "@/lib/utils";

interface WatchlistRowProps {
  item: WatchlistItem;
  onEdit: (item: WatchlistItem) => void;
  onDelete: (item: WatchlistItem) => void;
  onBump?: (item: WatchlistItem) => void;
}

export function WatchlistRow({ item, onEdit, onDelete, onBump }: WatchlistRowProps) {
  const title = item.titleEnglish ?? item.title;
  const finished =
    item.status === "completed" ||
    (item.totalEpisodes !== null && item.currentEpisode >= item.totalEpisodes);

  return (
    <article className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 transition hover:border-[color-mix(in_oklab,var(--accent)_35%,var(--line))]">
      <Link
        href={`/title/${item.anilistId}`}
        className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-elevated"
        aria-label={`View ${title}`}
      >
        {item.coverImage ? (
          <Image 
            src={item.coverImage} 
            alt="" 
            fill 
            sizes="44px" 
            quality={95}
            className="object-cover" 
          />
        ) : null}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/title/${item.anilistId}`}
            className="truncate text-sm font-medium text-fg transition hover:text-[var(--accent)]"
          >
            {title}
            {item.nickname && (
              <span className="ml-1.5 text-xs font-medium text-[var(--accent)]">
                ({item.nickname})
              </span>
            )}
          </Link>
          <StatusBadge status={item.status} showDot={false} className="shrink-0" />
          {item.airingStatus === "RELEASING" && (
            <span className="shrink-0 rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sky-500 border border-sky-500/20">
              Airing
            </span>
          )}
          {item.airingStatus === "NOT_YET_RELEASED" && (
            <span className="shrink-0 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-500 border border-violet-500/20">
              Upcoming
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-subtle">
          {[item.format?.replace(/_/g, " "), item.seasonYear, item.genres[0]]
            .filter(Boolean)
            .join(" · ")}
          {item.airingStatus === "RELEASING" && item.nextAiringEpisode && (
            <span className="text-sky-400">
              {" · "}Ep {item.nextAiringEpisode.episode} in {Math.ceil(item.nextAiringEpisode.timeUntilAiring / 86400)}d
            </span>
          )}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <ProgressBar
            current={item.currentEpisode}
            total={item.totalEpisodes}
            showLabel={false}
            size="sm"
            className="max-w-[240px] flex-1"
          />
          <span className="shrink-0 text-[11px] tabular-nums text-muted">
            {item.totalEpisodes === null
              ? `${item.currentEpisode} ep`
              : `${item.currentEpisode}/${item.totalEpisodes} ep`
            }
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {item.userScore !== null && (
          <span className="hidden items-center gap-1 rounded-md bg-amber-400/10 px-1.5 py-1 text-xs font-semibold text-amber-500 sm:flex">
            <Star className="h-3 w-3 fill-current" aria-hidden />
            {item.userScore}
          </span>
        )}
        {onBump && (
          <button
            type="button"
            onClick={() => onBump(item)}
            disabled={finished}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border transition",
              finished
                ? "cursor-not-allowed border-line text-subtle opacity-50"
                : "border-line text-muted hover:border-transparent hover:bg-accent hover:text-white"
            )}
            aria-label={`Log one episode of ${title}`}
            title="Log +1 episode"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-subtle transition hover:bg-elevated hover:text-fg"
          aria-label={`Edit ${title}`}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-subtle transition hover:bg-rose-500/10 hover:text-rose-400"
          aria-label={`Remove ${title}`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </article>
  );
}
