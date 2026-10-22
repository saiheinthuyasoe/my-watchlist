"use client";

import { useState } from "react";
import { Minus, Plus, Star } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useWatchlist } from "@/lib/watchlist-context";
import { useToast } from "@/components/ui/Toast";
import type { WatchlistItem, WatchStatus } from "@/types/watchlist";
import { statusOptions } from "@/types/watchlist";
import { cn } from "@/lib/utils";

interface EditWatchlistModalProps {
  item: WatchlistItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

function EditWatchlistForm({
  item,
  onClose,
  onSaved,
}: {
  item: WatchlistItem;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { updateItem } = useWatchlist();
  const toast = useToast();
  const [status, setStatus] = useState<WatchStatus>(item.status);
  const maxEpisodes = item.totalEpisodes ?? undefined;
  const [episode, setEpisode] = useState<number>(item.currentEpisode);
  const [episodeInput, setEpisodeInput] = useState<string>(String(item.currentEpisode));
  const [score, setScore] = useState<number | null>(item.userScore);
  const [notes, setNotes] = useState(item.notes);
  const [nickname, setNickname] = useState(item.nickname || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      setEpisode(value === "" ? 0 : clampEpisode(num));
    }
  };

  const handleEpisodeBlur = () => {
    setEpisodeInput(String(episode));
  };

  const handleSave = async () => {
    setError("");
    const safeEpisode = clampEpisode(episode);
    
    // Validation: if status is completed, must have progress
    if (status === "completed") {
      if (maxEpisodes && safeEpisode < maxEpisodes) {
        setError("Mark all episodes as watched to complete this title.");
        return;
      }
      if (!maxEpisodes && safeEpisode === 0) {
        setError("Mark as watched to complete this title.");
        return;
      }
    }

    try {
      setSaving(true);
      await updateItem(item, {
        status,
        currentEpisode: safeEpisode,
        userScore: score,
        notes,
        nickname,
      });
      toast.success("Entry updated", item.titleEnglish ?? item.title);
      onSaved?.();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-elevated/50 p-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">
            {item.titleEnglish ?? item.title}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {item.format?.replace(/_/g, " ") ?? "Anime"}
            {item.totalEpisodes ? ` · ${item.totalEpisodes} episodes` : item.airingStatus === "RELEASING" ? " · Airing" : " · Episode count unknown"}
            {item.airingStatus === "RELEASING" && item.nextAiringEpisode && (
              <span className="text-sky-400">
                {" · "}Ep {item.nextAiringEpisode.episode} in {Math.ceil(item.nextAiringEpisode.timeUntilAiring / 86400)}d
              </span>
            )}
          </p>
          {item.studios.length > 0 && (
            <p className="mt-0.5 text-xs text-subtle">
              Studio: {item.studios.join(", ")}
            </p>
          )}
        </div>
      </div>

      <Select
        label="Status"
        value={status}
        onChange={(event) => {
          const newStatus = event.target.value as WatchStatus;
          setStatus(newStatus);
          // Auto-complete episodes when marking as completed
          if (newStatus === "completed") {
            if (maxEpisodes && episode < maxEpisodes) {
              // Series: set to total episodes
              setEpisode(maxEpisodes);
              setEpisodeInput(String(maxEpisodes));
            } else if (!maxEpisodes && episode === 0) {
              // Movie: set to 1 to indicate watched
              setEpisode(1);
              setEpisodeInput("1");
            }
          }
        }}
        options={statusOptions()}
      />

      <Input
        label="Nickname (optional)"
        placeholder="A shorter name or memorable alias"
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        maxLength={100}
        hint="Makes searching easier — e.g., 'AOT' for Attack on Titan"
      />

      <div>
        <label htmlFor="episode-input" className="text-sm font-medium text-fg">
          Episode progress
        </label>
        <div className="mt-1.5 flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setEpisode((value) => clampEpisode(value - 1))}
            aria-label="Decrease episode"
            disabled={episode <= 0}
          >
            <Minus className="h-4 w-4" aria-hidden />
          </Button>
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
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setEpisode((value) => clampEpisode(value + 1))}
            aria-label="Increase episode"
            disabled={maxEpisodes ? episode >= maxEpisodes : false}
          >
            <Plus className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        {maxEpisodes ? (
          <button
            type="button"
            onClick={() => {
              setEpisode(maxEpisodes);
              setEpisodeInput(String(maxEpisodes));
              setStatus("completed");
            }}
            className="mt-2 text-xs font-medium text-[var(--accent)] transition hover:opacity-80"
          >
            Mark all {maxEpisodes} episodes as watched
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEpisode(1);
              setEpisodeInput("1");
              setStatus("completed");
            }}
            className="mt-2 text-xs font-medium text-[var(--accent)] transition hover:opacity-80"
          >
            Mark as watched
          </button>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-fg">Your score</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => {
            const selected = score !== null && value <= score;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setScore(score === value ? null : value)}
                aria-label={`Rate ${value} out of 10`}
                aria-pressed={score === value}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition",
                  selected
                    ? "border-transparent bg-amber-400/20 text-amber-500"
                    : "border-line text-subtle hover:border-line-strong hover:text-fg"
                )}
              >
                <Star
                  className={cn("h-3.5 w-3.5", selected && "fill-current")}
                  aria-hidden
                />
              </button>
            );
          })}
          <span className="ml-1 text-xs text-muted">
            {score ? `${score}/10` : "Not rated"}
          </span>
        </div>
      </div>

      <Textarea
        label="Notes"
        rows={3}
        maxLength={2000}
        placeholder="Where you left off, favourite arc, thoughts…"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        hint={`${notes.length}/2000 characters`}
      />

      {error && (
        <p role="alert" className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSave} isLoading={saving}>
          Save changes
        </Button>
      </div>
    </div>
  );
}

export function EditWatchlistModal({
  item,
  isOpen,
  onClose,
  onSaved,
}: EditWatchlistModalProps) {
  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit entry"
      description="Keep your progress and rating up to date."
      size="md"
    >
      <EditWatchlistForm key={item.id} item={item} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}
