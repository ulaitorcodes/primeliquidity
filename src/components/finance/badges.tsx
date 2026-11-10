import type {
  DisbursementStatus,
  InstallmentState,
  LoanStatus,
  MerchantStatus,
  TransactionType,
} from "@/lib/api/finance-types";
import type { DueState } from "@/lib/api/my";
import { cn } from "@/lib/utils";

const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset";

export const loanStatusLabels: Record<LoanStatus, string> = {
  approved: "Awaiting disbursement",
  active: "Active",
  completed: "Completed",
  written_off: "Written off",
  cancelled: "Cancelled",
};

const loanStatusStyles: Record<LoanStatus, string> = {
  approved: "bg-blue-50 text-blue-700 ring-blue-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  written_off: "bg-red-50 text-red-700 ring-red-200",
  cancelled: "bg-slate-100 text-slate-500 ring-slate-200",
};

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span className={cn(base, loanStatusStyles[status] ?? "bg-slate-100 text-slate-700 ring-slate-200")}>
      {loanStatusLabels[status] ?? status}
    </span>
  );
}

export const transactionTypeLabels: Record<TransactionType, string> = {
  funding: "Funding",
  withdrawal: "Withdrawal",
  disbursement: "Disbursement",
  repayment: "Repayment",
  recovery: "Recovery",
  write_off: "Write-off",
  credit_refund: "Credit refund",
  reversal: "Reversal",
};

const typeStyles: Record<TransactionType, string> = {
  funding: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  withdrawal: "bg-amber-50 text-amber-700 ring-amber-200",
  disbursement: "bg-blue-50 text-blue-700 ring-blue-200",
  repayment: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  recovery: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  write_off: "bg-red-50 text-red-700 ring-red-200",
  credit_refund: "bg-amber-50 text-amber-700 ring-amber-200",
  reversal: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function TransactionTypeBadge({ type }: { type: TransactionType }) {
  return (
    <span className={cn(base, typeStyles[type] ?? "bg-slate-100 text-slate-700 ring-slate-200")}>
      {transactionTypeLabels[type] ?? type}
    </span>
  );
}

const stateStyles: Record<InstallmentState, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  partial: "bg-amber-50 text-amber-700 ring-amber-200",
  overdue: "bg-red-50 text-red-700 ring-red-200",
  scheduled: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function InstallmentStateBadge({ state }: { state?: InstallmentState }) {
  const s: InstallmentState = state ?? "scheduled";
  return (
    <span className={cn(base, stateStyles[s] ?? stateStyles.scheduled)}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        base,
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-slate-100 text-slate-500 ring-slate-200"
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* ---- merchants ---- */

const merchantLabels: Record<MerchantStatus, string> = {
  pending: "Pending verification",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
};

const merchantStyles: Record<MerchantStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  verified: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  suspended: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function MerchantStatusBadge({ status }: { status: MerchantStatus }) {
  return (
    <span className={cn(base, merchantStyles[status] ?? "bg-slate-100 text-slate-600 ring-slate-200")}>
      {merchantLabels[status] ?? status}
    </span>
  );
}

/* ---- disbursements ---- */

export const disbursementLabels: Record<DisbursementStatus, string> = {
  pending_authorization: "Awaiting authorization",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
  expired: "Expired",
  reversed: "Reversed",
};

const disbursementStyles: Record<DisbursementStatus, string> = {
  pending_authorization: "bg-amber-50 text-amber-700 ring-amber-200",
  processing: "bg-blue-50 text-blue-700 ring-blue-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  cancelled: "bg-slate-100 text-slate-500 ring-slate-200",
  expired: "bg-slate-100 text-slate-500 ring-slate-200",
  reversed: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function DisbursementStatusBadge({ status }: { status: DisbursementStatus }) {
  return (
    <span className={cn(base, disbursementStyles[status] ?? "bg-slate-100 text-slate-600 ring-slate-200")}>
      {disbursementLabels[status] ?? status}
    </span>
  );
}

/* ---- dues ---- */

const dueLabels: Record<DueState, string> = {
  overdue: "Overdue",
  due_today: "Due today",
  upcoming: "Upcoming",
  pending: "Pending",
};

const dueStyles: Record<DueState, string> = {
  overdue: "bg-red-50 text-red-700 ring-red-200",
  due_today: "bg-amber-50 text-amber-700 ring-amber-200",
  upcoming: "bg-slate-100 text-slate-600 ring-slate-200",
  pending: "bg-blue-50 text-blue-700 ring-blue-200",
};

export function DueStateBadge({ state }: { state: DueState }) {
  return (
    <span className={cn(base, dueStyles[state] ?? "bg-slate-100 text-slate-600 ring-slate-200")}>
      {dueLabels[state] ?? state}
    </span>
  );
}