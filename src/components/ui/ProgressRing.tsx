import { cn } from "@/lib/utils";
import { getProgressPercent } from "@/lib/utils";

interface ProgressRingProps {
  current: number;
  total: number | null;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
  label?: string;
}

export function ProgressRing({
  current,
  total,
  size = 44,
  strokeWidth = 3.5,
  showValue = true,
  className,
  label,
}: ProgressRingProps) {
  const percent = getProgressPercent(current, total);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const complete = percent >= 100;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="img"
      aria-label={
        label ??
        `Episode progress: ${current} of ${total ?? "unknown"} (${percent}%)`
      }
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-elevated"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-500",
            complete ? "stroke-emerald-400" : "stroke-[var(--accent)]"
          )}
        />
      </svg>
      {showValue && (
        <span className="absolute text-[10px] font-semibold tabular-nums text-fg">
          {total ? `${current}/${total}` : current}
        </span>
      )}
    </div>
  );
}
