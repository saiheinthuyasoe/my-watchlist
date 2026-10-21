import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryView } from "@/components/library/LibraryView";

export const metadata: Metadata = {
  title: "Donghua",
  description:
    "Track Chinese donghua and 3D animation — cultivation sagas, epics and hidden gems.",
};

function LibraryFallback() {
  return (
    <div className="space-y-6">
      <div className="h-32 w-full animate-pulse rounded-xl bg-elevated" />
      <div className="h-64 w-full animate-pulse rounded-xl bg-elevated" />
    </div>
  );
}

export default function DonghuaPage() {
  return (
    <Suspense fallback={<LibraryFallback />}>
      <LibraryView category="donghua" />
    </Suspense>
  );
}
