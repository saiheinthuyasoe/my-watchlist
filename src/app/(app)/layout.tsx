import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-glow app-layout flex min-h-dvh flex-col bg-canvas">
      <Navbar />
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-3 pb-28 pt-4 sm:px-4 sm:pt-6 lg:px-8 lg:pb-14"
      >
        <AuthGuard>
          <EmailVerificationBanner />
          {children}
        </AuthGuard>
      </main>
      <footer className="hidden border-t border-line py-6 text-center text-xs text-subtle lg:block">
        <p>
          <Link href="/" className="font-medium text-muted transition hover:text-fg">
            MyWatchlist
          </Link>{" "}
          · Track anime &amp; donghua · Metadata by{" "}
          <a
            href="https://anilist.co"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-muted transition hover:text-fg"
          >
            AniList
          </a>
        </p>
      </footer>
      <MobileNav />
      <CommandPalette />
      <ScrollToTop />
    </div>
  );
}
