import type { AgentStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        status === "active"
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-red-50 text-red-700 ring-red-200"
      )}
    >
      {status === "active" ? "Active" : "Suspended"}
    </span>
  );
}