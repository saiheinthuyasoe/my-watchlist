import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { WatchlistProvider } from "@/lib/watchlist-context";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MyWatchlist — Track Anime & Donghua",
    template: "%s · MyWatchlist",
  },
  description:
    "A fast, private watchlist for anime and Chinese donghua. Track episodes, rate titles, keep notes, and see your viewing stats.",
  applicationName: "MyWatchlist",
  keywords: [
    "anime watchlist",
    "donghua tracker",
    "anime tracker",
    "watchlist",
    "AniList",
  ],
  authors: [{ name: "MyWatchlist" }],
  openGraph: {
    title: "MyWatchlist — Track Anime & Donghua",
    description:
      "Track every episode, rate what you love, and see your viewing stats in one place.",
    type: "website",
    siteName: "MyWatchlist",
  },
  twitter: {
    card: "summary",
    title: "MyWatchlist",
    description: "Track anime and donghua, episode by episode.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07070d" },
    { media: "(prefers-color-scheme: light)", color: "#f6f6fb" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-canvas text-fg">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <WatchlistProvider>{children}</WatchlistProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
