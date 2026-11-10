import type { PaymentStatus } from "@/lib/api/payments";
import { cn } from "@/lib/utils";

const labels: Record<PaymentStatus, string> = {
  pending: "Awaiting transfer",
  partially_paid: "Partly paid",
  paid: "Paid",
  expired: "Expired",
};

const styles: Record<PaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  partially_paid: "bg-orange-50 text-orange-700 ring-orange-200",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  expired: "bg-slate-100 text-slate-500 ring-slate-200",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        styles[status] ?? styles.expired
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}