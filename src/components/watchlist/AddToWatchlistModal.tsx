"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/lib/auth-context";
import { useWatchlist } from "@/lib/watchlist-context";
import { statusOptions } from "@/types/watchlist";
import type { WatchStatus, AnimeCategory } from "@/types/watchlist";
import type { AniListMedia } from "@/types/anime";
import { stripHtml } from "@/lib/utils";

interface AddToWatchlistModalProps {
  media: AniListMedia | null;
  category: AnimeCategory;
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

function AddForm({
  media,
  category,
  onClose,
  onAdded,
}: {
  media: AniListMedia;
  category: AnimeCategory;
  onClose: () => void;
  onAdded?: () => void;
}) {
  const { user } = useAuth();
  const { addItem, byAniListId } = useWatchlist();
  const [status, setStatus] = useState<WatchStatus>("plan_to_watch");
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [episodeInput, setEpisodeInput] = useState("0");
  const [adding, setAdding] = useState(false);

  const title = media.title.english ?? media.title.romaji;
  const existing = byAniListId.get(media.id);
  const maxEpisodes = media.episodes ?? undefined;

  const handleAdd = async () => {
    setAdding(true);
    const added = await addItem(media, category, status, currentEpisode);
    setAdding(false);
    if (added) {
      onAdded?.();
      onClose();
    }
  };

  const handleStatusChange = (newStatus: WatchStatus) => {
    setStatus(newStatus);
    // Auto-set episode based on status
    if (newStatus === "completed") {
      if (maxEpisodes) {
        // Series: set to total episodes
        setCurrentEpisode(maxEpisodes);
        setEpisodeInput(String(maxEpisodes));
      } else {
        // Movie: set to 1 to indicate watched
        setCurrentEpisode(1);
        setEpisodeInput("1");
      }
    } else if (newStatus === "plan_to_watch") {
      setCurrentEpisode(0);
      setEpisodeInput("0");
    }
  };

  const clampEpisode = (value: number) => {
    if (!Number.isFinite(value)) return 0;
    const rounded = Math.round(value);
    if (rounded < 0) return 0;
    if (maxEpisodes && rounded > maxEpisodes) return maxEpisodes;
    return rounded;
  };

  const handleEpisodeChange = (value: string) => {
    setEpisodeInput(value);
    const num = Number(value);
    if (value === "" || !isNaN(num)) {
      setCurrentEpisode(value === "" ? 0 : clampEpisode(num));
    }
  };

  const handleEpisodeBlur = () => {
    setEpisodeInput(String(currentEpisode));
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-elevated">
          {(media.coverImage?.extraLarge ?? media.coverImage?.large ?? media.coverImage?.medium) && (
            <Image
              src={media.coverImage.extraLarge ?? media.coverImage.large ?? media.coverImage.medium}
              alt=""
              fill
              quality={95}
              sizes="64px"
              className="object-cover"
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug text-fg">{title}</p>
          <p className="mt-1 text-xs text-muted">
            {[media.format?.replace(/_/g, " "), media.seasonYear, media.episodes ? `${media.episodes} episodes` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {media.averageScore ? (
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-amber-500">
              <Star className="h-3 w-3 fill-current" aria-hidden />
              {(media.averageScore / 10).toFixed(1)} average on AniList
            </p>
          ) : null}
          {media.description && (
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-subtle">
              {stripHtml(media.description)}
            </p>
          )}
        </div>
      </div>

      {!user ? (
        <div className="space-y-3 rounded-xl border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] bg-accent-soft p-4 text-center">
          <p className="text-sm text-muted">
            Sign in to save titles, track episodes, and keep notes across devices.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Link
              href={`/auth/login?next=${encodeURIComponent(`/title/${media.id}`)}`}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
            >
              Sign in
            </Link>
          </div>
        </div>
      ) : existing ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
            <Check className="h-4 w-4" aria-hidden />
            Already in your watchlist.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Link
              href={`/title/${media.id}`}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
            >
              Open details
            </Link>
          </div>
        </div>
      ) : (
        <>
          <Select
            label="Add as"
            value={status}
            onChange={(event) => handleStatusChange(event.target.value as WatchStatus)}
            options={statusOptions()}
          />
          
          {status === "watching" && (
            <div>
              <label htmlFor="episode-input" className="text-sm font-medium text-fg">
                Current episode
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  id="episode-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={maxEpisodes}
                  value={episodeInput}
                  onChange={(event) => handleEpisodeChange(event.target.value)}
                  onBlur={handleEpisodeBlur}
                  className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-center text-sm tabular-nums text-fg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <span className="shrink-0 text-sm text-subtle">/ {maxEpisodes ?? "?"}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleAdd} isLoading={adding}>
              Add to watchlist
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function AddToWatchlistModal({
  media,
  category,
  isOpen,
  onClose,
  onAdded,
}: AddToWatchlistModalProps) {
  if (!media) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add to watchlist"
      description="Choose how you want to start tracking this title."
      size="md"
    >
      <AddForm
        key={media.id}
        media={media}
        category={category}
        onClose={onClose}
        onAdded={onAdded}
      />
    </Modal>
  );
}
