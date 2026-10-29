"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  KeyRound,
  LogOut,
  Mail,
  ShieldAlert,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useWatchlist } from "@/lib/watchlist-context";
import { usePreferences } from "@/lib/preferences-context";
import { useToast } from "@/components/ui/Toast";
import type { TMDBApiProvider } from "@/types/tmdb";
import {
  downloadFile,
  exportFilename,
  parseImport,
  toCSV,
  toJSON,
} from "@/lib/export";
import { authErrorMessage } from "@/lib/firebase-errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ThemeSegmented } from "@/components/layout/ThemeToggle";

export function SettingsContent() {
  const router = useRouter();
  const {
    user,
    logout,
    updateDisplayName,
    sendVerificationEmail,
    refreshUser,
    resetPassword,
  } = useAuth();
  const { items, importRows, clearAll, loading } = useWatchlist();
  const { preferences, setAnimeProvider, setDonghuaProvider } = usePreferences();
  const toast = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [importing, setImporting] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [changingProvider, setChangingProvider] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const isPasswordAccount = user.providerData.some(
    (provider) => provider.providerId === "password"
  );

  const handleSaveName = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      toast.error("Name is too short", "Use at least 2 characters.");
      return;
    }
    try {
      setSavingName(true);
      await updateDisplayName(trimmed);
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Couldn't update profile", authErrorMessage(error));
    } finally {
      setSavingName(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setSendingVerification(true);
      await sendVerificationEmail();
      toast.success("Verification email sent", `Check ${user.email}.`);
    } catch (error) {
      toast.error("Couldn't send email", authErrorMessage(error));
    } finally {
      setSendingVerification(false);
    }
  };

  const handleCheckVerification = async () => {
    const fresh = await refreshUser();
    toast[fresh?.emailVerified ? "success" : "info"](
      fresh?.emailVerified ? "Email verified" : "Not verified yet",
      fresh?.emailVerified
        ? "Your account is fully set up."
        : "Open the link in your inbox, then try again."
    );
  };

  const handlePasswordReset = async () => {
    if (!user.email) return;
    try {
      setSendingReset(true);
      await resetPassword(user.email);
      toast.success("Reset link sent", `Check ${user.email}.`);
    } catch (error) {
      toast.error("Couldn't send reset link", authErrorMessage(error));
    } finally {
      setSendingReset(false);
    }
  };

  const handleExportJson = () => {
    downloadFile(exportFilename("json"), toJSON(items), "application/json");
    toast.success("Export ready", `${items.length} titles saved as JSON.`);
  };

  const handleExportCsv = () => {
    downloadFile(exportFilename("csv"), toCSV(items), "text/csv");
    toast.success("Export ready", `${items.length} titles saved as CSV.`);
  };

  const handleImportFile = async (file: File) => {
    try {
      setImporting(true);
      const text = await file.text();
      const parsed = parseImport(text);
      if (parsed.rows.length === 0) {
        toast.error("Nothing to import", "No valid titles were found in that file.");
        return;
      }
      await importRows(parsed.rows);
    } catch (error) {
      toast.error(
        "Import failed",
        error instanceof Error ? error.message : "That file couldn't be read."
      );
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSignOut = async () => {
    await logout();
    toast.success("Signed out");
    router.push("/");
  };

  const handleChangeAnimeProvider = async (provider: TMDBApiProvider) => {
    if (!user) return;
    
    try {
      setChangingProvider(true);
      await setAnimeProvider(provider);
      toast.success(
        "Anime provider updated",
        provider === "tmdb"
          ? "Now using TMDB for anime data."
          : "Now using AniList for anime data."
      );
    } catch (error) {
      toast.error("Failed to update provider", "Please try again.");
    } finally {
      setChangingProvider(false);
    }
  };

  const handleChangeDonghuaProvider = async (provider: TMDBApiProvider) => {
    if (!user) return;
    
    try {
      setChangingProvider(true);
      await setDonghuaProvider(provider);
      toast.success(
        "Donghua provider updated",
        provider === "tmdb"
          ? "Now using TMDB for better donghua episode tracking."
          : "Now using AniList for donghua data."
      );
    } catch (error) {
      toast.error("Failed to update provider", "Please try again.");
    } finally {
      setChangingProvider(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
          Account
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage your account, appearance and watchlist data.
        </p>
      </header>

      {/* Account details */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-fg">Account details</h2>
        <form onSubmit={handleSaveName} className="mt-4 space-y-4">
          <Input
            label="Display name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            leftIcon={<UserIcon className="h-4 w-4" />}
            autoComplete="name"
            maxLength={60}
          />
          <Input
            label="Email"
            value={user.email ?? ""}
            leftIcon={<Mail className="h-4 w-4" />}
            disabled
            hint="Email changes aren't supported yet."
          />
          {!user.emailVerified && isPasswordAccount && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
              <TriangleAlert className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
              <p className="flex-1 text-xs text-fg">
                Verify your email to keep your account recoverable.
              </p>
              <Button
                size="xs"
                variant="secondary"
                onClick={handleResendVerification}
                isLoading={sendingVerification}
              >
                Resend
              </Button>
              <Button size="xs" variant="ghost" onClick={handleCheckVerification}>
                I&apos;ve verified
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" isLoading={savingName}>
              Save changes
            </Button>
            {isPasswordAccount && (
              <Button variant="secondary" onClick={handlePasswordReset} isLoading={sendingReset}>
                <KeyRound className="h-4 w-4" aria-hidden /> Send password reset
              </Button>
            )}
          </div>
        </form>
      </section>

      {/* Preferences */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-fg">Appearance</h2>
        <p className="mt-0.5 text-xs text-muted">
          Choose a theme. System follows your device setting.
        </p>
        <div className="mt-4">
          <ThemeSegmented />
        </div>
      </section>

      {/* API Provider */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Database className="h-4 w-4" aria-hidden />
              Data Sources
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Choose which API to use for each category.
            </p>
          </div>
        </div>

        {/* Anime Provider */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Anime Provider
          </h3>
          <div className="mt-2 space-y-2">
            <button
              type="button"
              onClick={() => void handleChangeAnimeProvider("anilist")}
              disabled={changingProvider}
              className={`w-full rounded-lg border p-3 text-left transition ${
                preferences.animeProvider === "anilist"
                  ? "border-[var(--accent)] bg-accent/5"
                  : "border-line bg-elevated/40 hover:border-line-strong"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-fg">AniList</span>
                    {preferences.animeProvider === "anilist" && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">
                        Active
                      </span>
                    )}
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                      Recommended
                    </span>
                  </div>
                  <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted">
                    <li><strong className="text-fg">Browse:</strong> Trending & popular titles</li>
                    <li><strong className="text-fg">Search:</strong> Full database with metadata</li>
                  </ul>
                </div>
                <div
                  className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                    preferences.animeProvider === "anilist"
                      ? "border-[var(--accent)] bg-[var(--accent)]"
                      : "border-line"
                  }`}
                >
                  {preferences.animeProvider === "anilist" && (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => void handleChangeAnimeProvider("tmdb")}
              disabled={changingProvider}
              className={`w-full rounded-lg border p-3 text-left transition ${
                preferences.animeProvider === "tmdb"
                  ? "border-[var(--accent)] bg-accent/5"
                  : "border-line bg-elevated/40 hover:border-line-strong"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-fg">TMDB</span>
                    {preferences.animeProvider === "tmdb" && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted">
                    <li><strong className="text-fg">Browse:</strong> <span className="text-amber-500">Uses AniList</span> (TMDB has no browse)</li>
                    <li><strong className="text-fg">Search:</strong> Accurate episode counts</li>
                  </ul>
                </div>
                <div
                  className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                    preferences.animeProvider === "tmdb"
                      ? "border-[var(--accent)] bg-[var(--accent)]"
                      : "border-line"
                  }`}
                >
                  {preferences.animeProvider === "tmdb" && (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Donghua Provider */}
        <div className="mt-5 border-t border-line pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Donghua Provider
          </h3>
          <div className="mt-2 space-y-2">
            <button
              type="button"
              onClick={() => void handleChangeDonghuaProvider("tmdb")}
              disabled={changingProvider}
              className={`w-full rounded-lg border p-3 text-left transition ${
                preferences.donghuaProvider === "tmdb"
                  ? "border-[var(--accent)] bg-accent/5"
                  : "border-line bg-elevated/40 hover:border-line-strong"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-fg">TMDB</span>
                    {preferences.donghuaProvider === "tmdb" && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">
                        Active
                      </span>
                    )}
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                      Recommended
                    </span>
                  </div>
                  <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted">
                    <li><strong className="text-fg">Browse:</strong> <span className="text-amber-500">Uses AniList</span> (TMDB has no browse)</li>
                    <li><strong className="text-fg">Search:</strong> Accurate total episodes (no season splits)</li>
                  </ul>
                </div>
                <div
                  className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                    preferences.donghuaProvider === "tmdb"
                      ? "border-[var(--accent)] bg-[var(--accent)]"
                      : "border-line"
                  }`}
                >
                  {preferences.donghuaProvider === "tmdb" && (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => void handleChangeDonghuaProvider("anilist")}
              disabled={changingProvider}
              className={`w-full rounded-lg border p-3 text-left transition ${
                preferences.donghuaProvider === "anilist"
                  ? "border-[var(--accent)] bg-accent/5"
                  : "border-line bg-elevated/40 hover:border-line-strong"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-fg">AniList</span>
                    {preferences.donghuaProvider === "anilist" && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted">
                    <li><strong className="text-fg">Browse:</strong> Trending & popular titles</li>
                    <li><strong className="text-fg">Search:</strong> Full database, episodes may split by season</li>
                  </ul>
                </div>
                <div
                  className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                    preferences.donghuaProvider === "anilist"
                      ? "border-[var(--accent)] bg-[var(--accent)]"
                      : "border-line"
                  }`}
                >
                  {preferences.donghuaProvider === "anilist" && (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>

        <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] text-muted">
          <strong className="text-fg">How it works:</strong> When you select TMDB and browse (without searching), AniList is used automatically since TMDB doesn't have a browse/trending API. When you search for a specific title, your selected provider is used for accurate data.
        </p>
      </section>

      {/* Data */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-fg">Your data</h2>
            <p className="mt-0.5 text-xs text-muted">
              {loading ? "Loading…" : `${items.length} titles stored in your account.`}
            </p>
          </div>
          <Sparkles className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleExportJson}
            disabled={items.length === 0}
            className="flex items-center gap-3 rounded-lg border border-line bg-elevated/40 p-3 text-left transition hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileJson className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
            <span>
              <span className="block text-sm font-medium text-fg">Export JSON</span>
              <span className="block text-[11px] text-subtle">Full backup, re-importable</span>
            </span>
            <Download className="ml-auto h-3.5 w-3.5 text-subtle" aria-hidden />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={items.length === 0}
            className="flex items-center gap-3 rounded-lg border border-line bg-elevated/40 p-3 text-left transition hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
            <span>
              <span className="block text-sm font-medium text-fg">Export CSV</span>
              <span className="block text-[11px] text-subtle">For spreadsheets</span>
            </span>
            <Download className="ml-auto h-3.5 w-3.5 text-subtle" aria-hidden />
          </button>
        </div>

        <div className="mt-3">
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            id="import-file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImportFile(file);
            }}
          />
          <label
            htmlFor="import-file"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong px-4 py-3 text-sm font-medium text-muted transition hover:border-[var(--accent)] hover:text-fg"
          >
            <Upload className="h-4 w-4" aria-hidden />
            {importing ? "Importing…" : "Import from JSON"}
          </label>
          <p className="mt-2 text-[11px] text-subtle">
            Duplicates are skipped automatically. Existing entries are never overwritten.
          </p>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-rose-500/20 bg-surface p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <ShieldAlert className="h-4 w-4 text-rose-400" aria-hidden /> Danger zone
        </h2>
        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-fg">Clear watchlist</p>
              <p className="text-xs text-muted">
                Permanently delete every title and its progress. Export first if unsure.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setClearOpen(true)}
              disabled={items.length === 0}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Clear all
            </Button>
          </div>
          <div className="flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-fg">Sign out</p>
              <p className="text-xs text-muted">You can sign back in at any time.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
            </Button>
          </div>
        </div>
      </section>

      <p className="pb-2 text-center text-[11px] text-subtle">
        Metadata provided by{" "}
        {preferences.animeProvider === "tmdb" || preferences.donghuaProvider === "tmdb" ? (
          <>
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-fg"
            >
              TMDB
            </a>{" "}
            and{" "}
            <a
              href="https://anilist.co"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-fg"
            >
              AniList
            </a>
          </>
        ) : (
          <a
            href="https://anilist.co"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-fg"
          >
            AniList
          </a>
        )}
        . This app is not affiliated with {preferences.animeProvider === "tmdb" || preferences.donghuaProvider === "tmdb" ? "TMDB or AniList" : "AniList"}.
      </p>

      <ConfirmDialog
        isOpen={clearOpen}
        title="Clear your entire watchlist?"
        description={`All ${items.length} titles, episode progress, scores and notes will be permanently deleted. Consider exporting a backup first.`}
        confirmLabel="Delete everything"
        requireConfirmText={true}
        onClose={() => setClearOpen(false)}
        onConfirm={async () => {
          await clearAll();
        }}
      />
    </div>
  );
}
