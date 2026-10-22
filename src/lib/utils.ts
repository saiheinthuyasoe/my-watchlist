import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number | null): string {
  if (score === null) return "—";
  return `${score}/10`;
}

export function formatEpisodes(current: number, total: number | null): string {
  if (total === null) return `${current} ep`;
  return `${current} / ${total} ep`;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, (match) => {
    const map: Record<string, string> = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
      "&nbsp;": " ",
    };
    return map[match] ?? match;
  });
}

export function getProgressPercent(current: number, total: number | null): number {
  if (total === null) {
    // For movies/content without episode count, progress is binary (watched or not)
    return current > 0 ? 100 : 0;
  }
  if (total === 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}
