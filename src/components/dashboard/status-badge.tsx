import type { ApplicationStatus } from "@/lib/api/applications";
import { cn } from "@/lib/utils";

const config: Record<ApplicationStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  under_review: { label: "Under review", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 ring-red-200" },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        c.className
      )}
    >
      {c.label}
    </span>
  );
}