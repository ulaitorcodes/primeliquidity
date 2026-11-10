"use client";

import type { Application, ApplicationStatus } from "@/lib/api/applications";
import { cn } from "@/lib/utils";

export type StatusFilter = "all" | "pending" | "approved" | "rejected";

export function matchesFilter(status: ApplicationStatus, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "pending") return status === "pending" || status === "under_review";
  return status === filter;
}

const tabs: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export function StatusTabs({
  value,
  onChange,
  applications,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
  applications: Application[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const count = applications.filter((a) => matchesFilter(a.status, t.key)).length;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              value === t.key
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            {t.label} <span className="opacity-70">({count})</span>
          </button>
        );
      })}
    </div>
  );
}