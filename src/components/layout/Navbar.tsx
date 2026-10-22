"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Globe2,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { OPEN_PALETTE_EVENT } from "@/lib/constants";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/anime", label: "Anime", icon: BookOpen },
  { href: "/donghua", label: "Donghua", icon: Globe2 },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email?.split("@")[0] || "U";
  return source.slice(0, 1).toUpperCase();
}

export function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenus = () => {
    setUserMenuOpen(false);
  };

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen]);

  const openPalette = () =>
    window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    toast.success("Signed out", "See you next episode.");
    router.push("/");
  };

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "Account";

  return (
    <header className="sticky top-0 z-40 border-b border-line glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-1.5 px-3 sm:gap-2 sm:px-4 lg:px-8">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex shrink-0 items-center gap-2"
          aria-label="MyWatchlist home"
        >
          <Image
            src="/logo.png"
            alt="MyWatchlist"
            width={40}
            height={40}
            className="h-9 w-9 rounded-lg object-contain sm:h-10 sm:w-10"
            priority
            quality={100}
            unoptimized={true}
          />
          <span className="text-base font-bold tracking-tight text-fg sm:text-lg">
            MyWatchlist
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-0.5 md:ml-4 md:gap-1 lg:flex" aria-label="Main">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors lg:px-3",
                isActive(pathname, href)
                  ? "bg-accent-soft text-[var(--accent)]"
                  : "text-muted hover:bg-elevated hover:text-fg"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={openPalette}
            className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2 text-sm text-subtle transition hover:border-line-strong hover:text-fg md:flex lg:px-3"
            aria-label="Search anime, donghua and your watchlist"
          >
            <Search className="h-4 w-4" aria-hidden />
            <span className="hidden pr-6 lg:inline">Search…</span>
            <kbd className="hidden rounded border border-line bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-muted lg:inline">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={openPalette}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted transition hover:text-fg md:hidden"
            aria-label="Search"
          >
            <Search className="h-4 w-4" aria-hidden />
          </button>

          <ThemeToggle />

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-surface p-1 pr-1.5 transition hover:border-line-strong sm:gap-2 sm:pr-2.5"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Open account menu"
              >
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-md object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                    {initials(user.displayName, user.email)}
                  </span>
                )}
                <span className="hidden max-w-[90px] truncate text-sm font-medium text-fg sm:block md:max-w-[110px]">
                  {displayName}
                </span>
                <ChevronDown
                  className={cn(
                    "hidden h-3.5 w-3.5 text-subtle transition-transform sm:block",
                    userMenuOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-64 animate-[scale-in_0.15s_ease-out] overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold text-fg">{displayName}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>

                  {/* My List Section */}
                  <div className="border-b border-line p-1.5">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-subtle">
                      My Lists
                    </div>
                    <Link
                      href="/anime?tab=myList"
                      onClick={closeMenus}
                      role="menuitem"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-elevated hover:text-fg"
                    >
                      <BookOpen className="h-4 w-4" aria-hidden /> Anime List
                    </Link>
                    <Link
                      href="/donghua?tab=myList"
                      onClick={closeMenus}
                      role="menuitem"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-elevated hover:text-fg"
                    >
                      <Globe2 className="h-4 w-4" aria-hidden /> Donghua List
                    </Link>
                  </div>

                  {/* Profile Section */}
                  <div className="border-b border-line p-1.5">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-subtle">
                      Profile
                    </div>
                    <Link
                      href="/profile"
                      onClick={closeMenus}
                      role="menuitem"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-elevated hover:text-fg"
                    >
                      <UserIcon className="h-4 w-4" aria-hidden /> My Profile
                    </Link>
                    <Link
                      href="/insights"
                      onClick={closeMenus}
                      role="menuitem"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-elevated hover:text-fg"
                    >
                      <BarChart3 className="h-4 w-4" aria-hidden /> Insights
                    </Link>
                  </div>

                  {/* Settings Section */}
                  <div className="border-b border-line p-1.5">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-subtle">
                      Settings
                    </div>
                    <Link
                      href="/settings"
                      onClick={closeMenus}
                      role="menuitem"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-elevated hover:text-fg"
                    >
                      <Settings className="h-4 w-4" aria-hidden /> Preferences
                    </Link>
                  </div>

                  {/* Sign Out Section */}
                  <div className="p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-400 transition hover:bg-rose-500/10"
                    >
                      <LogOut className="h-4 w-4" aria-hidden /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/auth/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:text-fg"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
