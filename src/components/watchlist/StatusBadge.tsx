import { cn } from "@/lib/utils";
import {
  WATCH_STATUS_LABELS,
  WATCH_STATUS_COLORS,
  WATCH_STATUS_DOT,
  type WatchStatus,
} from "@/types/watchlist";

interface StatusBadgeProps {
  status: WatchStatus;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm",
        WATCH_STATUS_COLORS[status],
        className
      )}
    >
      {showDot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", WATCH_STATUS_DOT[status])}
          aria-hidden
        />
      )}
      {WATCH_STATUS_LABELS[status]}
    </span>
  );
}
