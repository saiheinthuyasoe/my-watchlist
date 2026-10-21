import { Suspense } from "react";
import { Skeleton, StatsSkeleton } from "@/components/ui/Skeleton";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export const instant = false;

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-8">
          <Skeleton className="h-10 w-64" />
          <StatsSkeleton />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
