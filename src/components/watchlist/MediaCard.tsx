"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Plus, Star } from "lucide-react";
import type { AniListMedia } from "@/types/anime";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  media: AniListMedia;
  isInList: boolean;
  onAdd: (media: AniListMedia) => void;
  priority?: boolean;
}

export function MediaCard({ media, isInList, onAdd, priority = false }: MediaCardProps) {
  const title = media.title.english ?? media.title.romaji;
  const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--line))] hover:shadow-[0_16px_36px_-18px_var(--shadow-color)]">
      <Link
        href={`/title/${media.id}`}
        className="relative block aspect-[3/4] overflow-hidden bg-elevated focus-visible:outline-none"
        aria-label={`View details for ${title}`}
      >
        {media.coverImage?.large ? (
          <Image
            src={media.coverImage.large}
            alt={title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 48vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, (max-width: 1280px) 20vw, 16vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-subtle">?</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 opacity-70 transition-opacity group-hover:opacity-90" />

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1 sm:left-3 sm:top-3">
          {media.format && (
            <span className="rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur sm:px-2 sm:text-[10px]">
              {media.format.replace(/_/g, " ")}
            </span>
          )}
          {media.countryOfOrigin === "CN" && (
            <span className="rounded bg-indigo-500/85 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white sm:px-2 sm:text-[10px]">
              CN
            </span>
          )}
        </div>

        {score && (
          <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur sm:right-3 sm:top-3 sm:gap-1 sm:px-2 sm:text-[11px]">
            <Star className="h-2.5 w-2.5 fill-current" aria-hidden />
            {score}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 sm:p-3">
          <p className="line-clamp-2 text-xs font-semibold leading-snug text-white drop-shadow sm:text-sm"
            title={title}>
            {title}
          </p>
          <p className="mt-0.5 text-[10px] text-white/70 sm:mt-1 sm:text-[11px]">
            {[media.seasonYear, media.episodes ? `${media.episodes} ep` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </Link>

      <div className="flex flex-col gap-2 p-2 sm:gap-3 sm:p-3">
        <div className="flex flex-wrap gap-1">
          {media.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="rounded-full border border-line px-1.5 py-0.5 text-[10px] font-medium text-muted sm:px-2 sm:py-1 sm:text-[11px]"
            >
              {genre}
            </span>
          ))}
        </div>
        <Button
          size="sm"
          variant={isInList ? "secondary" : "primary"}
          className={cn("w-full text-[11px] font-medium sm:text-xs", isInList && "text-emerald-500")}
          onClick={() => !isInList && onAdd(media)}
          disabled={isInList}
        >
          {isInList ? (
            <>
              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden /> In watchlist
            </>
          ) : (
            <>
              <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden /> Add to watchlist
            </>
          )}
        </Button>
      </div>
    </article>
  );
}
