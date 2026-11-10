import { apiFetch } from "./http";
import { buildQuery } from "./query";
import type {
  Disbursement,
  DisbursementChannel,
  DisbursementStatus,
  FinanceSummary,
  Funder,
  FunderKind,
  FundersReport,
  Loan,
  LoanDetail,
  LoanStatus,
  LoanTerms,
  PaymentMeans,
  Plan,
  Reconciliation,
  Transaction,
  TransactionPage,
  TransactionType,
  TrialBalance,
} from "./finance-types";

/* ---- funders ---- */

export function listFunders() {
  return apiFetch<Funder[]>("/finance/funders/");
}

export function getFunder(id: string) {
  return apiFetch<Funder>(`/finance/funders/${id}/`);
}

export interface FunderInput {
  name?: string;
  kind?: FunderKind;
  email?: string;
  phone?: string;
  notes?: string;
  isActive?: boolean;
}

export function createFunder(body: FunderInput) {
  return apiFetch<Funder>("/finance/funders/", { method: "POST", body });
}

export function updateFunder(id: string, body: FunderInput) {
  return apiFetch<Funder>(`/finance/funders/${id}/`, { method: "PATCH", body });
}

/** amount is a naira STRING with at most 2 decimals, e.g. "120000.00" */
export interface FundingBody {
  amount: string;
  reference: string;
  programSlug?: string;
  note?: string;
  receivedOn?: string;
  paidOn?: string;
}

export function contribute(funderId: string, body: FundingBody) {
  return apiFetch<Transaction>(`/finance/funders/${funderId}/contributions/`, {
    method: "POST",
    body,
  });
}

export function withdraw(funderId: string, body: FundingBody) {
  return apiFetch<Transaction>(`/finance/funders/${funderId}/withdrawals/`, {
    method: "POST",
    body,
  });
}

/* ---- loans ---- */

export interface QuoteBody {
  programSlug: string;
  /** the full amount the merchant is owed, as a naira string */
  invoiceAmount: string;
  depositPercent?: number;
  periods?: number;
  startOn?: string;
  terms?: LoanTerms;
}

export function quoteLoan(body: QuoteBody) {
  return apiFetch<Plan>("/finance/quote/", { method: "POST", body });
}

export interface CreateLoanBody {
  applicationId: string;
  invoiceAmount?: string;
  depositPercent?: number;
  periods?: number;
  terms?: LoanTerms;
  merchantId?: string;
}

export function createLoan(body: CreateLoanBody) {
  return apiFetch<LoanDetail>("/finance/loans/", { method: "POST", body });
}

export interface LoanListParams {
  program?: string;
  status?: LoanStatus | "";
  search?: string;
  applicationId?: string;
}

export function listLoans(params: LoanListParams = {}) {
  return apiFetch<Loan[]>(`/finance/loans/${buildQuery({ ...params })}`);
}

export function getLoan(id: string) {
  return apiFetch<LoanDetail>(`/finance/loans/${id}/`);
}

export function repayLoan(
  id: string,
  body: { amount: string; reference: string; paidOn?: string; method?: string }
) {
  return apiFetch<LoanDetail>(`/finance/loans/${id}/repayments/`, { method: "POST", body });
}

export function refundLoanCredit(
  id: string,
  body: { amount: string; reference: string; paidOn?: string }
) {
  return apiFetch<LoanDetail>(`/finance/loans/${id}/refund-credit/`, { method: "POST", body });
}

export function writeOffLoan(id: string, reason: string) {
  return apiFetch<LoanDetail>(`/finance/loans/${id}/write-off/`, {
    method: "POST",
    body: { reason },
  });
}

/** Blocked by the server while a deposit is held: refund it first. */
export function cancelLoan(id: string) {
  return apiFetch<LoanDetail>(`/finance/loans/${id}/cancel/`, { method: "POST", body: {} });
}

/* ---- merchant + deposit (before disbursement) ---- */

export function assignLoanMerchant(id: string, merchantId: string) {
  return apiFetch<unknown>(`/finance/loans/${id}/merchant/`, {
    method: "POST",
    body: { merchantId },
  });
}

export type PayerRole = "applicant" | "agent" | "admin" | "other";

export function recordDeposit(
  id: string,
  body: {
    amount: string;
    reference: string;
    paidOn?: string;
    method?: string;
    payerRole?: PayerRole;
    payerName?: string;
  }
) {
  return apiFetch<unknown>(`/finance/loans/${id}/deposits/`, { method: "POST", body });
}

export function refundDeposit(id: string, body: { reference: string; paidOn?: string }) {
  return apiFetch<unknown>(`/finance/loans/${id}/deposit-refund/`, { method: "POST", body });
}

/* ---- disbursements (deployment) ---- */

export type CreateDisbursementBody =
  | { channel: "system"; accountId?: string }
  | {
      channel: "external";
      means: PaymentMeans;
      reference: string;
      paidOn?: string;
      accountId?: string;
      note?: string;
    };

export function createDisbursement(loanId: string, body: CreateDisbursementBody) {
  return apiFetch<Disbursement>(`/finance/loans/${loanId}/disbursements/`, {
    method: "POST",
    body,
  });
}

export interface DisbursementListParams {
  status?: DisbursementStatus | "";
  loanId?: string;
  channel?: DisbursementChannel | "";
}

export function listDisbursements(params: DisbursementListParams = {}) {
  return apiFetch<Disbursement[]>(`/finance/disbursements/${buildQuery({ ...params })}`);
}

/** Result status: completed | failed | processing (never retry processing). */
export function authorizeDisbursement(id: string, code: string) {
  return apiFetch<Disbursement>(`/finance/disbursements/${id}/authorize/`, {
    method: "POST",
    body: { code },
  });
}

export function resendDisbursementCode(id: string) {
  return apiFetch<Disbursement>(`/finance/disbursements/${id}/resend-code/`, {
    method: "POST",
    body: {},
  });
}

export function cancelDisbursement(id: string) {
  return apiFetch<Disbursement>(`/finance/disbursements/${id}/cancel/`, {
    method: "POST",
    body: {},
  });
}

/* ---- ledger journal ---- */

export interface TransactionParams {
  type?: TransactionType | "";
  program?: string;
  loanId?: string;
  funderId?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export function listTransactions(params: TransactionParams = {}) {
  return apiFetch<TransactionPage>(`/finance/transactions/${buildQuery({ ...params })}`);
}

export function getTransaction(id: string) {
  return apiFetch<Transaction>(`/finance/transactions/${id}/`);
}

export function reverseTransaction(id: string, reason: string) {
  return apiFetch<Transaction>(`/finance/transactions/${id}/reverse/`, {
    method: "POST",
    body: { reason },
  });
}

/* ---- reports ---- */

export function getFinanceSummary(params: {
  from: string;
  to: string;
  granularity: "day" | "week" | "month";
  program?: string;
}) {
  return apiFetch<FinanceSummary>(`/finance/reports/summary/${buildQuery({ ...params })}`);
}

export function getFundersReport() {
  return apiFetch<FundersReport>("/finance/reports/funders/");
}

export function getTrialBalance(asOf?: string) {
  return apiFetch<TrialBalance>(`/finance/reports/trial-balance/${buildQuery({ asOf })}`);
}

/** bankBalance is a naira string; omit to check the books only. */
export function getReconciliation(bankBalance?: string) {
  return apiFetch<Reconciliation>(
    `/finance/reports/reconciliation/${buildQuery({ bankBalance })}`
  );
}