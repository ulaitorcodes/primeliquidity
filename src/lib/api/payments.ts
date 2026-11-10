import { asArray } from "./array";
import { apiFetch } from "./http";
import { buildQuery } from "./query";

export type PaymentPurpose = "installment" | "payoff" | "custom" | "deposit";
export type PaymentStatus = "pending" | "partially_paid" | "paid" | "expired";

export interface PaymentBreakdownItem {
  /** null for a deposit */
  number: number | null;
  dueOn: string | null;
  remaining: number;
}

export interface PaymentAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface Payment {
  id: string;
  loanId: string;
  purpose: PaymentPurpose;
  installmentNumber: number | null;
  /** the EXACT amount to send */
  amount: number;
  paidAmount: number;
  status: PaymentStatus;
  breakdown: PaymentBreakdownItem[];
  account: PaymentAccount | null;
  expiresAt: string | null;
  payer: { role: string; name: string } | null;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
  /** shape not pinned down by the spec: render defensively */
  instructions: unknown;
}

export interface PayBody {
  purpose: PaymentPurpose;
  installmentNumber?: number;
  /** naira string with at most 2 decimals, for purpose "custom" */
  amount?: string;
  note?: string;
}

/** What the Pay button asks for. Omit installmentNumber to pay the next unpaid one. */
export interface PayTarget {
  loanId: string;
  purpose: PaymentPurpose;
  installmentNumber?: number;
  amount?: string;
}

/** 201 for a new request, or 200 with the existing one if it is still open. */
export function createPayment(loanId: string, body: PayBody) {
  return apiFetch<Payment>(`/payments/loans/${loanId}/pay/`, { method: "POST", body });
}

export async function listLoanPayments(loanId: string) {
  return asArray<Payment>(await apiFetch<unknown>(`/payments/loans/${loanId}/`));
}

export function getPayment(id: string) {
  return apiFetch<Payment>(`/payments/${id}/`);
}

/* ---- admin: held receipts ---- */

export type ReceiptStatus = "open" | "applied";

export interface HeldReceipt {
  id: string;
  provider: string;
  eventId: string | null;
  accountNumber: string | null;
  amount: number;
  payerName: string | null;
  outcome: string;
  reason: string | null;
  paymentRequestId: string | null;
  appliedLoanId: string | null;
  receivedAt: string;
  processedAt: string | null;
}

export interface ReceiptsResponse {
  openTotal: number;
  ledgerBalance: number;
  /** false is a red alert */
  reconciled: boolean;
  items: HeldReceipt[];
}

export function listReceipts(status: ReceiptStatus | "" = "") {
  return apiFetch<ReceiptsResponse>(`/payments/receipts/${buildQuery({ status })}`);
}

export function applyReceipt(
  id: string,
  body: { loanId: string; purpose: "repayment" | "deposit" }
) {
  return apiFetch<HeldReceipt>(`/payments/receipts/${id}/apply/`, { method: "POST", body });
}

/* ---- LOCAL TESTING ONLY (admin) ---- */

/** Pretends the bank confirmed the transfer for this payment request. */
export function simulateBankConfirmation(requestId: string) {
  return apiFetch<unknown>("/payments/dev/simulate/", { method: "POST", body: { requestId } });
}

/** Pretends money arrived for an account number the system doesn't know. */
export function simulateUnknownTransfer(accountNumber: string, amount: string) {
  return apiFetch<unknown>("/payments/dev/simulate/", {
    method: "POST",
    body: { accountNumber, amount },
  });
}