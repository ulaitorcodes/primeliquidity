import type { KycStatus } from "@/lib/api/kyc";
import { kycStatusLabels } from "@/lib/kyc-options";
import { cn } from "@/lib/utils";

const styles: Record<KycStatus, string> = {
  not_started: "bg-slate-100 text-slate-600 ring-slate-200",
  draft: "bg-blue-50 text-blue-700 ring-blue-200",
  submitted: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  changes_requested: "bg-orange-50 text-orange-700 ring-orange-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

export function KycStatusBadge({ status }: { status: KycStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        styles[status] ?? styles.not_started
      )}
    >
      {kycStatusLabels[status] ?? status}
    </span>
  );
}