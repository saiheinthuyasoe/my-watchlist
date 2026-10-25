"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ExternalLink,
  Film,
  Minus,
  Pencil,
  Play,
  Plus,
  Star,
  Trash2,
  Tv,
} from "lucide-react";
import { getMediaById } from "@/lib/anilist";
import { useAuth } from "@/lib/auth-context";
import { useWatchlist } from "@/lib/watchlist-context";
import { stripHtml } from "@/lib/utils";
import type { AniListMedia } from "@/types/anime";
import type { AnimeCategory, WatchStatus } from "@/types/watchlist";
import { statusOptions } from "@/types/watchlist";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusBadge } from "@/components/watchlist/StatusBadge";
import { AddToWatchlistModal } from "@/components/watchlist/AddToWatchlistModal";
import { EditWatchlistModal } from "@/components/watchlist/EditWatchlistModal";
import { RelatedMedia } from "@/components/title/RelatedMedia";

const MEDIA_STATUS_LABELS: Record<string, string> = {
  FINISHED: "Finished airing",
  RELEASING: "Currently airing",
  NOT_YET_RELEASED: "Not yet released",
  CANCELLED: "Cancelled",
  HIATUS: "On hiatus",
};

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "available now";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function TitleDetail({ mediaId }: { mediaId: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    byAniListId,
    addItem,
    bumpEpisode,
    setStatus,
    removeItem,
  } = useWatchlist();

  const invalidId = !Number.isFinite(mediaId) || mediaId <= 0;
  const [attempt, setAttempt] = useState(0);
  const [fetched, setFetched] = useState<{
    key: string;
    media: AniListMedia | null;
    failed: boolean;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [quickAdding, setQuickAdding] = useState(false);

  const fetchKey = `${mediaId}:${attempt}`;

  useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    getMediaById(mediaId)
      .then((result) => {
        if (!cancelled) {
          setFetched({ key: fetchKey, media: result, failed: result === null });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetched({ key: fetchKey, media: null, failed: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetchKey, invalidId, mediaId]);

  const loading = !invalidId && fetched?.key !== fetchKey;
  const media = fetched?.key === fetchKey ? fetched.media : null;
  const notFound = invalidId || (!loading && !media);

  const entry = useMemo(
    () => (media ? byAniListId.get(media.id) ?? null : null),
    [media, byAniListId]
  );

  const title = media?.title.english ?? media?.title.romaji ?? "Title";
  const category: AnimeCategory = entry
    ? entry.category
    : media?.countryOfOrigin === "CN"
      ? "donghua"
      : "anime";

  useEffect(() => {
    if (media) document.title = `${title} · MyWatchlist`;
  }, [media, title]);

  const handleQuickAdd = async (status: WatchStatus) => {
    if (!media) return;
    setQuickAdding(true);
    await addItem(media, category, status);
    setQuickAdding(false);
  };

  if (loading) return <DetailSkeleton />;

  if (notFound || !media) {
    const failed = fetched?.failed ?? false;
    return (
      <EmptyState
        icon={Film}
        title={failed ? "Couldn't load this title" : "We couldn't find that title"}
        description={
          failed
            ? "AniList may be temporarily unavailable. Your watchlist is unaffected."
            : "It may have been removed from AniList, or the link is incorrect."
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {failed && !invalidId && (
              <Button onClick={() => setAttempt((value) => value + 1)}>
                Try again
              </Button>
            )}
            <Button variant="secondary" onClick={() => router.push("/anime")}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back to anime
            </Button>
          </div>
        }
      />
    );
  }

  const description = media.description ? stripHtml(media.description) : "";
  const studios = media.studios?.nodes?.map((studio) => studio.name).join(", ");
  const totalEpisodes = entry?.totalEpisodes ?? media.episodes;
  const currentEpisode = entry?.currentEpisode ?? 0;
  const remaining = totalEpisodes ? Math.max(0, totalEpisodes - currentEpisode) : null;
  const trailerUrl =
    media.trailer && media.trailer.site === "youtube"
      ? `https://www.youtube.com/watch?v=${media.trailer.id}`
      : null;

  const formatStartDate = (date: { year: number | null; month: number | null; day: number | null } | null | undefined) => {
    if (!date?.year) return "—";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (date.month && date.day) {
      return `${months[date.month - 1]} ${date.day}, ${date.year}`;
    }
    if (date.month) {
      return `${months[date.month - 1]} ${date.year}`;
    }
    return String(date.year);
  };

  const detailRows = [
    ...(media.nextAiringEpisode ? [{
      label: "Airing",
      value: `Ep ${media.nextAiringEpisode.episode}: ${formatCountdown(media.nextAiringEpisode.timeUntilAiring)}`,
      highlight: true,
    }] : []),
    { label: "Format", value: media.format?.replace(/_/g, " ") ?? "—" },
    { label: "Episodes", value: media.episodes ? String(media.episodes) : "Unknown" },
    { label: "Episode Duration", value: media.duration ? `${media.duration} mins` : "—" },
    { label: "Status", value: MEDIA_STATUS_LABELS[media.status] ?? media.status },
    { label: "Start Date", value: formatStartDate(media.startDate) },
    {
      label: "Season",
      value:
        media.season && media.seasonYear
          ? `${media.season.charAt(0)}${media.season.slice(1).toLowerCase()} ${media.seasonYear}`
          : media.seasonYear
            ? String(media.seasonYear)
            : "—",
    },
    { label: "Average Score", value: media.averageScore ? `${media.averageScore}%` : "—" },
    { label: "Popularity", value: media.popularity ? media.popularity.toLocaleString() : "—" },
    { label: "Studios", value: studios || "—" },
    { label: "Source", value: media.source?.replace(/_/g, " ") ?? "—" },
    { label: "Origin", value: media.countryOfOrigin ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back
      </button>

      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="relative h-36 w-full sm:h-52">
          {media.bannerImage ? (
            <Image
              src={media.bannerImage}
              alt=""
              fill
              priority
              quality={95}
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-violet-600/30 via-indigo-600/20 to-sky-500/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
        </div>

        <div className="relative -mt-20 px-4 pb-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            <div className="relative h-52 w-36 shrink-0 self-center overflow-hidden rounded-xl bg-elevated shadow-2xl ring-1 ring-line sm:self-auto">
              {(media.coverImage?.extraLarge ?? media.coverImage?.large) && (
                <Image
                  src={media.coverImage.extraLarge ?? media.coverImage.large}
                  alt={title}
                  fill
                  priority
                  quality={95}
                  sizes="144px"
                  className="object-cover"
                />
              )}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {media.format && (
                  <Badge variant="accent">{media.format.replace(/_/g, " ")}</Badge>
                )}
                {media.seasonYear && <Badge variant="outline">{media.seasonYear}</Badge>}
                {media.status === "RELEASING" && (
                  <Badge variant="success">Airing</Badge>
                )}
                {media.countryOfOrigin === "CN" && (
                  <Badge variant="default">Donghua</Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold leading-tight tracking-tight text-fg sm:text-3xl">
                {title}
              </h1>
              {media.title.native && media.title.native !== title && (
                <p className="mt-1 text-sm text-muted">{media.title.native}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
                {media.averageScore ? (
                  <span className="inline-flex items-center gap-1 font-medium text-amber-500">
                    <Star className="h-4 w-4 fill-current" aria-hidden />
                    {(media.averageScore / 10).toFixed(1)}
                    <span className="font-normal text-subtle">/ 10</span>
                  </span>
                ) : null}
                {media.episodes ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Tv className="h-4 w-4 text-subtle" aria-hidden />
                    {media.episodes} episodes
                  </span>
                ) : null}
                {media.duration ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-subtle" aria-hidden />
                    {media.duration} min
                  </span>
                ) : null}
                {media.season && media.seasonYear ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-subtle" aria-hidden />
                    {media.season.charAt(0) + media.season.slice(1).toLowerCase()}{" "}
                    {media.seasonYear}
                  </span>
                ) : null}
                {entry && <StatusBadge status={entry.status} />}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {media.genres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/anime`}
                    className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted transition hover:border-line-strong hover:text-fg"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="space-y-6">
          {media.nextAiringEpisode && (
            <div className="flex items-center gap-3 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3">
              <Play className="h-4 w-4 shrink-0 text-sky-500" aria-hidden />
              <p className="text-sm text-fg">
                Episode {media.nextAiringEpisode.episode} airs in{" "}
                <span className="font-semibold text-sky-500">
                  {formatCountdown(media.nextAiringEpisode.timeUntilAiring)}
                </span>
              </p>
            </div>
          )}

          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">
              Synopsis
            </h2>
            {description ? (
              <>
                <p
                  className={
                    expanded
                      ? "mt-3 whitespace-pre-line text-sm leading-relaxed text-muted"
                      : "mt-3 line-clamp-5 whitespace-pre-line text-sm leading-relaxed text-muted"
                  }
                >
                  {description}
                </p>
                {description.length > 320 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="mt-2 text-xs font-medium text-[var(--accent)] transition hover:opacity-80"
                  >
                    {expanded ? "Show less" : "Read more"}
                  </button>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">No synopsis available for this title.</p>
            )}
          </section>

          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">
              Details
            </h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {detailRows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-subtle">{row.label}</dt>
                  <dd className={`truncate text-right text-sm font-medium capitalize ${(row as any).highlight ? 'text-sky-400' : 'text-fg'}`}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            {media.genres.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle">
                  Genres
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {media.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {media.tags.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle">
                  Themes
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {media.tags.slice(0, 14).map((tag) => (
                    <span
                      key={`${tag.category}-${tag.name}`}
                      className="rounded-md bg-elevated px-2 py-0.5 text-[11px] text-muted"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 border-t border-line pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle">
                All Titles
              </h3>
              <dl className="mt-2 space-y-1.5">
                <div>
                  <dt className="inline text-xs text-subtle">Romaji: </dt>
                  <dd className="inline text-xs text-fg">{media.title.romaji}</dd>
                </div>
                {media.title.english && media.title.english !== media.title.romaji && (
                  <div>
                    <dt className="inline text-xs text-subtle">English: </dt>
                    <dd className="inline text-xs text-fg">{media.title.english}</dd>
                  </div>
                )}
                <div>
                  <dt className="inline text-xs text-subtle">Native: </dt>
                  <dd className="inline text-xs text-fg">{media.title.native}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
              {trailerUrl && (
                <a
                  href={trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-fg transition hover:bg-elevated"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden /> Watch trailer
                </a>
              )}
              {media.siteUrl && (
                <a
                  href={media.siteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-fg transition hover:bg-elevated"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden /> View on AniList
                </a>
              )}
            </div>
          </section>
        </div>

        {/* Right column: tracking */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-5">
            {!user ? (
              <div className="space-y-4 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-elevated text-subtle">
                  <Plus className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-fg">Track this title</h2>
                  <p className="mt-1 text-sm text-muted">
                    Sign in to save progress, rate episodes and keep notes.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/auth/login?next=${encodeURIComponent(`/title/${media.id}`)}`}
                    className="flex-1 rounded-lg border border-line px-3 py-2 text-sm font-medium text-fg transition hover:bg-elevated"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            ) : entry ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">
                    Your progress
                  </h2>
                  <StatusBadge status={entry.status} />
                </div>

                <div className="flex items-center gap-4">
                  <ProgressRing
                    current={entry.currentEpisode}
                    total={entry.totalEpisodes}
                    size={64}
                    strokeWidth={5}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold tabular-nums text-fg">
                      {entry.currentEpisode}
                      <span className="text-base font-normal text-subtle">
                        {entry.totalEpisodes ? ` / ${entry.totalEpisodes}` : ""}
                      </span>
                    </p>
                    <p className="text-xs text-muted">
                      episodes watched
                      {remaining !== null && remaining > 0
                        ? ` · ${remaining} left`
                        : remaining === 0
                          ? " · complete"
                          : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => void bumpEpisode(entry, -1)}
                    disabled={entry.currentEpisode <= 0}
                    aria-label="Remove one episode"
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => void bumpEpisode(entry, 1)}
                    disabled={
                      entry.totalEpisodes !== null &&
                      entry.currentEpisode >= entry.totalEpisodes
                    }
                  >
                    <Plus className="h-4 w-4" aria-hidden /> Log episode
                  </Button>
                </div>

                <Select
                  label="Status"
                  value={entry.status}
                  options={statusOptions()}
                  onChange={(event) =>
                    void setStatus(entry, event.target.value as WatchStatus)
                  }
                />

                {entry.userScore !== null && (
                  <div className="flex items-center justify-between rounded-lg border border-line bg-elevated/50 px-3 py-2">
                    <span className="text-xs text-muted">Your score</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                      {entry.userScore}/10
                    </span>
                  </div>
                )}

                {entry.notes && (
                  <div className="rounded-lg border border-line bg-elevated/50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">
                      Notes
                    </p>
                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-muted">
                      {entry.notes}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit entry
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteOpen(true)}
                    aria-label="Remove from watchlist"
                    className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-fg">Track this title</h2>
                <p className="text-sm text-muted">
                  Add it to your watchlist and start logging episodes as you watch.
                </p>
                <Button
                  className="w-full"
                  isLoading={quickAdding}
                  onClick={() => void handleQuickAdd("watching")}
                >
                  <Play className="h-4 w-4" aria-hidden /> Start watching
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="h-4 w-4" aria-hidden /> Add to watchlist
                </Button>
                <p className="pt-1 text-center text-[11px] text-subtle">
                  Already tracked elsewhere? Adding is safe — duplicates are blocked.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-line bg-surface p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle">
              Popularity
            </h3>
            <p className="mt-1 text-sm text-fg">
              {media.popularity.toLocaleString()} AniList members
            </p>
            <p className="mt-1 text-xs text-muted">
              {media.averageScore
                ? `Rated ${(media.averageScore / 10).toFixed(1)}/10 on average`
                : "Not enough ratings yet"}
            </p>
          </div>

          {items.length > 0 && (
            <div className="mt-4 rounded-xl border border-line bg-surface p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle">
                In your library
              </h3>
              <p className="mt-1 text-sm text-muted">
                {items.filter((item) => item.category === category).length}{" "}
                {category === "donghua" ? "donghua" : "anime"} titles ·{" "}
                {items.filter((item) => item.status === "watching").length} watching
              </p>
              <Link
                href={category === "donghua" ? "/donghua" : "/anime"}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:opacity-80"
              >
                Open {category === "donghua" ? "donghua" : "anime"} library
                <ArrowLeft className="h-3 w-3 rotate-180" aria-hidden />
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* Related Media Section */}
      {media.relations?.edges && media.relations.edges.length > 0 && (
        <RelatedMedia relations={media.relations.edges} />
      )}

      <AddToWatchlistModal
        media={media}
        category={category}
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
      />

      <EditWatchlistModal
        item={entry}
        isOpen={editOpen && Boolean(entry)}
        onClose={() => setEditOpen(false)}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        title="Remove from watchlist?"
        description={`“${title}” and all of your progress will be deleted.`}
        confirmLabel="Remove"
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          if (entry) await removeItem(entry);
        }}
      />
    </div>
  );
}
