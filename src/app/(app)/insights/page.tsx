import { Suspense } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { InsightsContent } from "@/components/insights/InsightsContent";

export const instant = false;

export default function InsightsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-56" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      }
    >
      <InsightsContent />
    </Suspense>
  );
}
