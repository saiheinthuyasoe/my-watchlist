"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Globe2, LayoutDashboard, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/anime", label: "Anime", icon: BookOpen },
  { href: "/donghua", label: "Donghua", icon: Globe2 },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line glass lg:hidden"
      aria-label="Bottom navigation"
    >
      <div className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const target = !user && href === "/profile" ? "/auth/login" : href;
          return (
            <Link
              key={href}
              href={target}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 pb-2 pt-2.5 text-[10px] font-medium transition-colors",
                active ? "text-[var(--accent)]" : "text-subtle hover:text-fg"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                  active && "bg-accent-soft"
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
