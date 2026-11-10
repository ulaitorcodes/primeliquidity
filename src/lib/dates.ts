import type { DateRange, Granularity } from "@/lib/api/types";

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Inclusive range ending today. */
export function rangeForDays(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: toISODate(from), to: toISODate(to) };
}

export function defaultGranularity(days: number): Granularity {
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
}

export function daysBetween(from: string, to: string) {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

export function lastDaysRange(days: number): DateRange {
  return { ...rangeForDays(days), granularity: defaultGranularity(days) };
}

export function formatBucket(date: string, granularity: Granularity) {
  const d = new Date(`${date.slice(0, 10)}T00:00:00`);
  return granularity === "month"
    ? d.toLocaleDateString("en-NG", { month: "short", year: "2-digit" })
    : d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}