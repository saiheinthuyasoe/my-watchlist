import { cn } from "@/lib/utils";
import { getProgressPercent } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  total: number | null;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
  tone?: "accent" | "light";
}

export function ProgressBar({
  current,
  total,
  className,
  showLabel = true,
  size = "md",
  tone = "accent",
}: ProgressBarProps) {
  const percent = getProgressPercent(current, total);

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {total === null 
              ? `${current} episodes`
              : `${current} / ${total} episodes`
            }
          </span>
          <span className="tabular-nums">{percent}%</span>
        </div>
      )}
      <div
        className={cn(
          "overflow-hidden rounded-full",
          size === "sm" ? "h-1.5" : "h-2",
          tone === "light" ? "bg-white/20" : "bg-elevated"
        )}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={
          total === null 
            ? `${current} episodes watched`
            : `${current} of ${total} episodes watched`
        }
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            tone === "light"
              ? "bg-white"
              : "bg-gradient-to-r from-violet-500 to-sky-400"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
