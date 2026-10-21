import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryView } from "@/components/library/LibraryView";

export const metadata: Metadata = {
  title: "Anime",
  description:
    "Discover trending anime, search the AniList catalogue, and track every episode you watch.",
};

function LibraryFallback() {
  return (
    <div className="space-y-6">
      <div className="h-32 w-full animate-pulse rounded-xl bg-elevated" />
      <div className="h-64 w-full animate-pulse rounded-xl bg-elevated" />
    </div>
  );
}

export default function AnimePage() {
  return (
    <Suspense fallback={<LibraryFallback />}>
      <LibraryView category="anime" />
    </Suspense>
  );
}
