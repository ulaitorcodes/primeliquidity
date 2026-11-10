/* ---- merchants ---- */

export type MerchantKind = "school" | "landlord" | "developer" | "supplier" | "other";
export type MerchantStatus = "pending" | "verified" | "rejected" | "suspended";

export interface MerchantRef {
  id: string;
  name: string;
  kind: MerchantKind;
  status: MerchantStatus;
}

export interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string | null;
  accountNumber: string;
  accountName: string;
  isPrimary: boolean;
  nameVerified: boolean;
  isActive: boolean;
}

export interface Merchant extends MerchantRef {
  source: "admin" | "self_applied";
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  registrationNumber: string | null;
  taxId: string | null;
  notes: string | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
  accounts: BankAccount[];
}

export interface BankAccountInput {
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
}

export interface MerchantInput {
  name: string;
  kind?: MerchantKind;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  registrationNumber?: string;
  taxId?: string;
  notes?: string;
  bankAccount?: BankAccountInput;
}

/* ---- funders ---- */

export type FunderKind = "individual" | "company";

export interface Funder {
  id: string;
  name: string;
  kind: FunderKind;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  contributed: number;
  withdrawn: number;
  balance: number;
}

/* ---- disbursements ---- */

export type DisbursementStatus =
  | "pending_authorization"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired"
  | "reversed";

export type DisbursementChannel = "system" | "external";
export type PaymentMeans =
  | "bank_transfer"
  | "cash"
  | "cheque"
  | "pos"
  | "mobile_money"
  | "other";

export interface Payee {
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
}

export interface Disbursement {
  id: string;
  loanId: string;
  loanReference: string;
  channel: DisbursementChannel;
  status: DisbursementStatus;
  /** the invoice total */
  amount: number;
  means: PaymentMeans | null;
  reference: string | null;
  providerReference: string | null;
  merchantId: string | null;
  merchantName: string | null;
  payee: Payee | null;
  paidOn: string | null;
  note: string | null;
  failureReason: string | null;
  codeExpiresAt: string | null;
  codeAttemptsLeft: number | null;
  /** shape not pinned down by the spec: read with actorName() */
  initiatedBy: unknown;
  authorizedBy: unknown;
  authorizedAt: string | null;
  createdAt: string;
}

/* ---- loans ---- */

export type LoanStatus = "approved" | "active" | "completed" | "written_off" | "cancelled";
export type PeriodUnit = "day" | "week" | "month";

export interface LoanTerms {
  periodUnit: PeriodUnit;
  feePercentPerPeriod: number;
  model?: string;
}

export interface PlanInstallment {
  number: number;
  dueOn: string;
  principalDue: number;
  feeDue: number;
  totalDue: number;
}

export interface Plan {
  model: string;
  periodUnit: PeriodUnit;
  feePercentPerPeriod: number;
  periods: number;
  invoiceTotal: number;
  depositAmount: number;
  depositPercent?: number;
  /** the FINANCED part */
  principal: number;
  totalFee: number;
  totalRepayable: number;
  schedule: PlanInstallment[];
}

export interface Loan {
  id: string;
  reference: string;
  programSlug: string;
  programName: string;
  applicationId: string;
  applicationReference: string;
  borrowerName: string;
  borrowerEmail: string;
  status: LoanStatus;
  model: string;
  /** invoiceTotal = depositAmount + principal */
  invoiceTotal: number;
  /** the FINANCED part. Fees and the schedule are computed on it. */
  principal: number;
  depositAmount: number;
  depositPercent: number;
  depositPaid: number;
  depositOutstanding: number;
  merchant: MerchantRef | null;
  feePercentPerPeriod: number;
  periodUnit: PeriodUnit;
  periods: number;
  totalFee: number;
  totalRepayable: number;
  principalPaid: number;
  feesPaid: number;
  principalOutstanding: number;
  feesOutstanding: number;
  nextDueOn: string | null;
  overdueAmount: number;
  daysPastDue: number;
  payeeName: string | null;
  payeeAccount: string | null;
  disbursedOn: string | null;
  completedOn: string | null;
  writtenOffOn: string | null;
  writeOffReason: string | null;
  createdAt: string;
  /** admin only */
  readyToDisburse?: { ready: boolean; blockers: string[] };
  /** latest disbursement, admin only */
  disbursement?: Disbursement | null;
}

export type InstallmentState = "paid" | "partial" | "overdue" | "scheduled";

export interface LoanInstallment extends PlanInstallment {
  principalPaid: number;
  feePaid: number;
  remaining: number;
  paidOn: string | null;
  state: InstallmentState;
}

export interface LoanDetail extends Loan {
  /** overpayment held, refundable */
  creditBalance: number;
  schedule: LoanInstallment[];
  transactions: Transaction[];
}

/* ---- ledger ---- */

export type TransactionType =
  | "funding"
  | "withdrawal"
  | "disbursement"
  | "repayment"
  | "recovery"
  | "write_off"
  | "credit_refund"
  | "reversal";

export interface LedgerEntry {
  account: string;
  accountName: string;
  direction: string;
  amount: number;
  loanId: string | null;
  funderId: string | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  reference: string;
  description: string;
  amount: number;
  programSlug: string | null;
  occurredOn: string;
  createdAt: string;
  createdBy: unknown;
  reverses: unknown;
  reversedBy: unknown;
  metadata: Record<string, unknown> | null;
  entries?: LedgerEntry[];
}

export interface TransactionPage {
  total: number;
  limit: number;
  offset: number;
  results: Transaction[];
}

/* ---- reports ---- */

export interface Position {
  capitalFunded: number;
  capitalWithdrawn: number;
  netCapital: number;
  deployed: number;
  principalRepaid: number;
  feesCollected: number;
  recovered: number;
  writtenOff: number;
  cash: number;
  outstandingPrincipal: number;
  customerCredit: number;
  retainedSurplus: number;
  depositsHeld: number;
  unallocatedReceipts: number;
  paidToMerchants: number;
  deploymentRate: number | null;
  repaymentRate: number | null;
}

export interface PeriodFigures {
  capitalFunded: number;
  capitalWithdrawn: number;
  deployed: number;
  principalRepaid: number;
  feesCollected: number;
  cashFromBorrowers: number;
  recovered: number;
  writtenOff: number;
  creditRefunded: number;
  depositsReceived: number;
  depositsRefunded: number;
  paidToMerchants: number;
}

export interface AgeingBucket {
  bucket: "current" | "1-7" | "8-30" | "31-60" | "61-90" | "90+";
  loans: number;
  outstandingPrincipal: number;
}

export interface Portfolio {
  asOfToday: string;
  loans: Record<LoanStatus, number>;
  outstandingPrincipal: number;
  outstandingFees: number;
  expectedRepayments: number;
  overduePrincipal: number;
  overdueAmount: number;
  par30Rate: number | null;
  dueNext7Days: number;
  ageing: AgeingBucket[];
}

export interface ProgramFinance {
  /** null = the general pool */
  programSlug: string | null;
  programName: string | null;
  position: Position;
  period: PeriodFigures;
  loans: unknown;
  outstandingFees: number;
  overduePrincipal: number;
  overdueAmount: number;
}

/** The timeseries keeps the original fields (the update didn't add deposits to it). */
export interface FinanceTimeseriesPoint {
  date: string;
  capitalFunded: number;
  capitalWithdrawn: number;
  deployed: number;
  principalRepaid: number;
  feesCollected: number;
  cashFromBorrowers: number;
  recovered: number;
  writtenOff: number;
  creditRefunded: number;
}

export interface FinanceSummary {
  range: { from: string; to: string; granularity: "day" | "week" | "month" };
  asOf: string;
  position: Position;
  period: PeriodFigures;
  portfolio: Portfolio;
  collections: { due: number; collected: number; rate: number | null };
  byProgram: ProgramFinance[];
  timeseries: FinanceTimeseriesPoint[];
}

export interface FundersReport {
  totalCapital: number;
  funders: {
    funderId: string;
    name: string;
    kind: FunderKind;
    isActive: boolean;
    contributed: number;
    withdrawn: number;
    balance: number;
    shareOfCapital: number | null;
    byProgram: {
      programSlug: string | null;
      programName: string | null;
      contributed: number;
      withdrawn: number;
      balance: number;
    }[];
  }[];
}

export interface TrialBalance {
  asOf: string;
  accounts: {
    code: string;
    name: string;
    type: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
  totals: { debit: number; credit: number; balanced: boolean };
}

export interface Reconciliation {
  ok: boolean;
  generatedAt: string;
  cashOnHand: number;
  checks: { name: string; ok: boolean; detail: string; items: unknown[] }[];
}