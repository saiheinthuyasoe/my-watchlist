"use client";

import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { WatchlistItem } from "@/types/watchlist";
import { StatusBadge } from "./StatusBadge";
import { getProgressPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface WatchlistCardProps {
  item: WatchlistItem;
  onEdit: (item: WatchlistItem) => void;
  onDelete: (item: WatchlistItem) => void;
  onBump?: (item: WatchlistItem) => void;
  priority?: boolean;
}

export function WatchlistCard({ item, onEdit, onDelete, onBump, priority = false }: WatchlistCardProps) {
  const title = item.titleEnglish ?? item.title;
  const percent = getProgressPercent(item.currentEpisode, item.totalEpisodes);
  const finished =
    item.status === "completed" ||
    (item.totalEpisodes !== null && item.currentEpisode >= item.totalEpisodes);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--line))] hover:shadow-[0_16px_36px_-20px_var(--shadow-color)]">
      <div className="relative aspect-[3/4] overflow-hidden bg-elevated">
        <Link
          href={`/title/${item.anilistId}`}
          className="absolute inset-0"
          aria-label={`View ${title}`}
        >
          {item.coverImage ? (
            <Image
              src={item.coverImage}
              alt={title}
              fill
              priority={priority}
              fetchPriority={priority ? "high" : undefined}
              quality={95}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 300px"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-3xl text-subtle">
              ?
            </span>
          )}
        </Link>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

        <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
          <StatusBadge status={item.status} />
        </div>

        {item.userScore !== null && (
          <span className="pointer-events-none absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur sm:right-3 sm:top-3 sm:gap-1 sm:px-2 sm:text-[11px]">
            <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
            {item.userScore}
          </span>
        )}

        <div className="pointer-events-none absolute inset-x-2 bottom-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-lg p-2 sm:inset-x-3 sm:bottom-3 sm:p-2.5">
          <div className="flex items-center justify-between text-[9px] font-medium text-white/85 sm:text-[10px]">
            <span>
              {item.currentEpisode}
              {item.totalEpisodes ? ` / ${item.totalEpisodes}` : ""} ep
            </span>
            {item.totalEpisodes ? <span>{percent}%</span> : null}
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/25 sm:mt-1.5">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                finished ? "bg-emerald-400" : "bg-gradient-to-r from-violet-400 to-sky-400"
              )}
              style={{ width: `${item.totalEpisodes ? percent : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-2 sm:gap-3 sm:p-3">
        <Link
          href={`/title/${item.anilistId}`}
          className="min-w-0 rounded px-0.5 py-0.5 sm:px-1"
        >
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-fg transition group-hover:text-[var(--accent)] sm:text-sm"
            title={title}>
            {title}
          </h3>
          {item.nickname && (
            <p className="mt-0.5 text-[10px] font-medium text-[var(--accent)] sm:text-[11px]">
              aka "{item.nickname}"
            </p>
          )}
          <p className="mt-0.5 text-[10px] text-subtle sm:text-[11px]">
            {item.format?.replace(/_/g, " ") ?? item.category}
            {item.genres[0] ? ` · ${item.genres[0]}` : ""}
          </p>
        </Link>

        <div className="flex items-center gap-1">
          {onBump && (
            <button
              type="button"
              onClick={() => onBump(item)}
              disabled={finished}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg border transition shrink-0 sm:h-8 sm:w-8",
                finished
                  ? "cursor-not-allowed border-line text-subtle opacity-50"
                  : "border-line bg-elevated text-muted hover:border-transparent hover:bg-accent hover:text-white"
              )}
              aria-label={`Log one episode of ${title}`}
              title={finished ? "All episodes watched" : "Log +1 episode"}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-subtle transition hover:bg-elevated hover:text-fg shrink-0 sm:h-8 sm:w-8"
            aria-label={`Edit ${title}`}
            title="Edit entry"
          >
            <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-subtle transition hover:bg-rose-500/10 hover:text-rose-400 shrink-0 sm:h-8 sm:w-8"
            aria-label={`Remove ${title}`}
            title="Remove"
          >
            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}
