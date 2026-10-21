import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  Globe2,
  Layers,
  Lock,
  Plus,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { FALLBACK_ANIME } from "@/lib/fallback-data";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  LandingHeaderActions,
  LandingHeroActions,
} from "@/components/layout/LandingCTA";

export const metadata: Metadata = {
  title: "MyWatchlist — Track anime & donghua, episode by episode",
};

const FEATURES = [
  {
    icon: Plus,
    title: "One-tap episode logging",
    description:
      "Log an episode straight from a card. Reach the final episode and the title completes itself.",
  },
  {
    icon: Search,
    title: "The whole AniList catalogue",
    description:
      "Search tens of thousands of titles, filter by genre, format and rating, and paginate without leaving the page.",
  },
  {
    icon: Globe2,
    title: "Donghua, properly supported",
    description:
      "A dedicated Chinese-animation library, not an afterthought bolted onto an anime tracker.",
  },
  {
    icon: BarChart3,
    title: "Insights worth reading",
    description:
      "Time watched, score distribution, genre leanings and completion rate — computed from your real history.",
  },
  {
    icon: Star,
    title: "Ratings & notes",
    description:
      "Score titles out of ten and keep private notes on where you stopped or what you loved.",
  },
  {
    icon: Download,
    title: "Your data, exportable",
    description:
      "Download a JSON backup or CSV at any time, and re-import it on another account in seconds.",
  },
];

const STEPS = [
  {
    title: "Find something",
    description: "Search or browse trending titles with ⌘K from anywhere in the app.",
  },
  {
    title: "Add it once",
    description: "Pick a status — watching, planned, completed — and it syncs instantly.",
  },
  {
    title: "Keep it current",
    description: "Log episodes as you watch. Progress, stats and insights update live.",
  },
];

export default function LandingPage() {
  const preview = FALLBACK_ANIME.slice(0, 3);

  return (
    <div className="app-glow app-layout min-h-dvh bg-canvas text-fg">
      <header className="sticky top-0 z-40 border-b border-line glass">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="MyWatchlist home">
            <Image
              src="/logo.png"
              alt="MyWatchlist"
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-contain"
              priority
            />
            <span className="text-base font-bold tracking-tight">MyWatchlist</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Landing">
            <a href="#features" className="transition hover:text-fg">
              Features
            </a>
            <a href="#how" className="transition hover:text-fg">
              How it works
            </a>
            <a href="#insights" className="transition hover:text-fg">
              Insights
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LandingHeaderActions />
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-3 pb-12 pt-10 sm:px-4 sm:pb-16 sm:pt-14 lg:px-8 lg:pt-20">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--accent)_30%,transparent)] bg-accent-soft px-3 py-1 text-xs font-medium text-[var(--accent)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Anime · Donghua · Insights
              </div>

              <h1 className="mt-4 text-3xl font-extrabold leading-[1.05] tracking-tight sm:mt-5 sm:text-4xl lg:text-5xl xl:text-6xl">
                Every episode.
                <br />
                <span className="gradient-text">Every series.</span>
                <br />
                One watchlist.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:mt-5 sm:text-base lg:text-lg">
                Track anime and donghua episode by episode, rate what you finish, and
                see the patterns behind what you watch. Free, fast and private.
              </p>

              <div className="mt-8">
                <LandingHeroActions />
              </div>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                {["No ads, no paywall", "Syncs in real time", "Your data stays yours"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Product preview */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div
                className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-violet-600/25 via-indigo-500/10 to-sky-400/20 blur-3xl"
                aria-hidden
              />
              <div className="relative rounded-2xl border border-line bg-surface/90 p-3 shadow-[0_40px_90px_-40px_var(--shadow-color)] backdrop-blur">
                <div className="flex items-center justify-between px-1 pb-3">
                  <div className="flex gap-1.5" aria-hidden>
                    <span className="h-2 w-2 rounded-full bg-rose-400/70" />
                    <span className="h-2 w-2 rounded-full bg-amber-400/70" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                  </div>
                  <span className="rounded-md bg-elevated px-2 py-0.5 font-mono text-[10px] text-subtle">
                    mywatchlist / dashboard
                  </span>
                </div>

                <div className="rounded-xl border border-line bg-canvas/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">Continue watching</p>
                    <span className="text-[10px] text-subtle">3 in progress</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {preview.map((media, index) => {
                      const total = media.episodes ?? 12;
                      const current = [7, 19, 3][index] ?? 1;
                      return (
                        <div
                          key={media.id}
                          className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-2"
                        >
                          <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-elevated">
                            <Image
                              src={media.coverImage.medium}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-medium">
                              {media.title.english ?? media.title.romaji}
                            </span>
                            <span className="block text-[10px] text-subtle">
                              {current} / {total} episodes
                            </span>
                            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-elevated">
                              <span
                                className="block h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400"
                                style={{ width: `${Math.min(100, (current / total) * 100)}%` }}
                              />
                            </span>
                          </span>
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-white">
                            <Plus className="h-3 w-3" aria-hidden />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { icon: Layers, label: "Episodes", value: "248" },
                    { icon: Clock, label: "Watched", value: "4d 3h" },
                    { icon: TrendingUp, label: "Avg score", value: "8.6" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="rounded-lg border border-line bg-surface p-2 text-center"
                    >
                      <Icon className="mx-auto h-3.5 w-3.5 text-subtle" aria-hidden />
                      <p className="mt-0.5 text-xs font-semibold">{value}</p>
                      <p className="text-[9px] uppercase tracking-wide text-subtle">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <span className="sr-only">Product preview, sample data</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-line py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                Everything included
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Built like a tool, not a chore.
              </h2>
              <p className="mt-3 text-muted">
                The parts of a watchlist that actually matter, finished properly.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-[color-mix(in_oklab,var(--accent)_35%,var(--line))]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-elevated text-[var(--accent)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-line py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                  How it works
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Three steps, then it stays out of your way.
                </h2>
                <p className="mt-3 max-w-md text-muted">
                  Press{" "}
                  <kbd className="rounded border border-line bg-elevated px-1.5 py-0.5 font-mono text-xs">
                    ⌘K
                  </kbd>{" "}
                  anywhere to search the catalogue, add a title, and start logging.
                </p>
                <Link
                  href="/auth/register"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] transition hover:opacity-80"
                >
                  Create your free account <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <ol className="space-y-3">
                {STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-line bg-surface p-5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-sm font-bold text-[var(--accent)]">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Insights */}
        <section id="insights" className="border-t border-line py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-line bg-surface">
              <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                    Insights
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                    See what you actually watch.
                  </h2>
                  <p className="mt-3 text-muted">
                    Your library becomes a dashboard: time spent, completion rate, the
                    genres you return to and how you score the things you finish.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm">
                    {[
                      "Total episodes and hours watched",
                      "Score distribution and average rating",
                      "Top genres and most-watched titles",
                      "Completion rate across every status",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-muted">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-line bg-canvas/60 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Score distribution</p>
                    <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-subtle">
                      Example
                    </span>
                  </div>
                  <div className="mt-5 flex h-32 items-end gap-1.5" aria-hidden>
                    {[2, 4, 7, 12, 18, 24, 31, 26, 14, 6].map((value, index) => (
                      <div key={index} className="flex flex-1 flex-col justify-end">
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-violet-600 to-sky-400"
                          style={{ height: `${(value / 31) * 100}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-subtle">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                      <span key={score} className="flex-1 text-center">
                        {score}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4">
                    <div>
                      <p className="text-lg font-bold">8.4</p>
                      <p className="text-[11px] text-subtle">average score</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">4d 3h</p>
                      <p className="text-[11px] text-subtle">time watched</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-16 lg:px-8 lg:py-20">
          <div className="relative overflow-hidden rounded-3xl border border-[color-mix(in_oklab,var(--accent)_30%,transparent)] bg-gradient-to-br from-violet-600/15 via-surface to-sky-500/10 p-8 text-center sm:p-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Start your watchlist tonight.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Sign in with Google or email. Your list is waiting on every device.
            </p>
            <div className="mx-auto mt-7 max-w-md">
              <LandingHeroActions />
            </div>
            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-subtle">
              <Lock className="h-3.5 w-3.5" aria-hidden /> Private by default · Free forever
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-6 sm:py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-3 text-xs text-subtle sm:flex-row sm:px-4 lg:px-8">
          <p>© MyWatchlist. Metadata and imagery by AniList.</p>
          <div className="flex items-center gap-5">
            <Link href="/anime" className="transition hover:text-fg">
              Anime
            </Link>
            <Link href="/donghua" className="transition hover:text-fg">
              Donghua
            </Link>
            <Link href="/auth/login" className="transition hover:text-fg">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
