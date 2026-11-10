import { asArray } from "./array";
import { apiFetch } from "./http";
import { buildQuery } from "./query";
import type { Loan, LoanInstallment } from "./finance-types";

export type DueState = "overdue" | "due_today" | "upcoming" | "pending";

export interface DueItem {
  type: "installment" | "deposit";
  loanId: string;
  loanReference: string;
  programSlug: string;
  programName: string;
  borrowerName: string;
  agent: { id: string; name: string } | null;
  number: number | null;
  /** null for a deposit that is still waiting */
  dueOn: string | null;
  amountDue: number;
  remaining: number;
  state: DueState;
  daysOverdue: number;
  daysUntilDue: number | null;
  canPay: boolean;
}

export interface DuesSummary {
  overdueCount: number;
  overdueAmount: number;
  dueNext7DaysCount: number;
  dueNext7DaysAmount: number;
  depositsPendingCount: number;
  depositsPendingAmount: number;
}

export interface Dues {
  asOf: string;
  summary: DuesSummary;
  items: DueItem[];
}

export interface DuesParams {
  state?: DueState | "";
  from?: string;
  to?: string;
  program?: string;
  /** admin only */
  agentId?: string;
}

export function getMyDues(params: DuesParams = {}) {
  return apiFetch<Dues>(`/my/dues/${buildQuery({ ...params })}`);
}

/**
 * The spec says "loan + schedule" and that bank details and the ledger are hidden.
 * Only the identifying fields are required here; everything else may be absent.
 */
export type MyLoan = Pick<Loan, "id" | "reference" | "programSlug" | "programName" | "status"> &
  Partial<Omit<Loan, "id" | "reference" | "programSlug" | "programName" | "status">>;

export type MyLoanDetail = MyLoan & {
  schedule?: LoanInstallment[];
  creditBalance?: number;
};

export async function listMyLoans() {
  return asArray<MyLoan>(await apiFetch<unknown>("/my/loans/"));
}

export function getMyLoan(id: string) {
  return apiFetch<MyLoanDetail>(`/my/loans/${id}/`);
}

/* ---- early repayment ---- */

export interface Payoff {
  loanId: string;
  loanReference: string;
  asOf: string;
  principalOutstanding: number;
  feesOutstanding: number;
  feeRebate: number;
  totalPayoff: number;
  installmentsRemaining: number;
  nextDueOn: string | null;
  note: string | null;
}

/** 400 if the loan has nothing outstanding. */
export function getPayoff(loanId: string) {
  return apiFetch<Payoff>(`/my/loans/${loanId}/payoff/`);
}