"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const PUBLIC_PREFIXES = ["/anime", "/donghua", "/title"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  useEffect(() => {
    if (loading || isPublic) return;
    if (!user) {
      const next = encodeURIComponent(pathname);
      router.replace(`/auth/login?next=${next}`);
    }
  }, [user, loading, router, pathname, isPublic]);

  if (loading && !isPublic) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div
          className="h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--accent)] border-t-transparent"
          role="status"
          aria-label="Loading"
        />
        <p className="text-sm text-muted">Loading your watchlist…</p>
      </div>
    );
  }

  if (!user && !isPublic) return null;

  return <>{children}</>;
}
