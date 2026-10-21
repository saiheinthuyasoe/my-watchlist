import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer, icon }: AuthShellProps) {
  return (
    <div className="app-glow flex min-h-dvh flex-col bg-canvas">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="MyWatchlist home">
          <Image
            src="/logo.png"
            alt="MyWatchlist"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg object-contain"
            priority
          />
          <span className="text-base font-bold tracking-tight text-fg">MyWatchlist</span>
        </Link>
        <ThemeToggle />
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            {icon && (
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface text-[var(--accent)]">
                {icon}
              </span>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-fg">{title}</h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-6 shadow-[0_24px_60px_-30px_var(--shadow-color)] sm:p-8">
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
