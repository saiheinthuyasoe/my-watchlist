import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsContent } from "@/components/settings/SettingsContent";
import { Skeleton } from "@/components/ui/Skeleton";

export const instant = false;

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account preferences and data.",
};

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
