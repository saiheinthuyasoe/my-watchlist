import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "accent" | "success" | "warning" | "danger";
}

const VARIANTS = {
  default: "bg-elevated text-muted border-line",
  outline: "bg-transparent text-muted border-line-strong",
  accent: "bg-accent-soft text-[var(--accent)] border-[color-mix(in_oklab,var(--accent)_35%,transparent)]",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  danger: "bg-rose-500/10 text-rose-400 border-rose-500/25",
} as const;

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
