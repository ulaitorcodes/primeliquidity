import type { ApplicationStatus } from "@/lib/api/applications";
import { toISODate } from "@/lib/dates";
import { formatNaira } from "@/lib/utils";

export const statusLabels: Record<ApplicationStatus, string> = {
  pending: "Pending",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
};

/** approvalRate is already 0-100; null means "no decisions yet". */
export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

export function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("en-NG");
}

/** Whole naira (analytics). */
export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return formatNaira(value);
}

const exactMoney = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactMoney = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Naira with kobo (finance). Display only: never do math on the result. */
export function formatMoneyExact(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return exactMoney.format(value);
}

/** Short form for chart axes, e.g. ₦1.2M. */
export function formatCompactMoney(value: number) {
  return compactMoney.format(value);
}

export function formatHours(hours: number | null | undefined) {
  if (hours === null || hours === undefined) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${hours.toFixed(1)} hrs`;
  return `${(hours / 24).toFixed(1)} days`;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** For YYYY-MM-DD strings (no timezone shifting). */
export function formatDay(day: string | null | undefined) {
  if (!day) return "—";
  return new Date(`${day.slice(0, 10)}T00:00:00`).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG");
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return "—";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function todayISO() {
  return toISODate(new Date());
}

/** "written_off" -> "Written off" */
export function humanize(value: string) {
  const s = value.replace(/[_-]+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The spec doesn't pin down the shape of createdBy: accept a name or an object. */
export function actorName(value: unknown): string {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object") {
    const name = (value as { name?: unknown }).name;
    if (typeof name === "string" && name) return name;
  }
  return "—";
}

/** reverses / reversedBy: accept an id string or an object with an id. */
export function refId(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object") {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" && id) return id;
  }
  return null;
}

/** byProgram.loans may be a count or a per-status object: count either way. */
export function countLoans(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (n, v) => n + (typeof v === "number" ? v : 0),
      0
    );
  }
  return 0;
}