import { asArray } from "./array";
import { apiFetch } from "./http";

export type PeriodUnitName = "day" | "week" | "month";

export interface CalculatorProgram {
  slug: string;
  name: string;
  status: string;
  /** false: pricing is agreed per loan, so show `reason` instead of a form */
  calculable: boolean;
  reason: string | null;
  periodUnit: PeriodUnitName;
  feePercentPerPeriod: number;
  minPeriods: number;
  maxPeriods: number;
  defaultPeriods: number;
  depositPercent: number;
  minAmount: number;
  maxAmount: number;
}

export interface QuoteInstallment {
  number: number;
  dueOn: string;
  principalDue: number;
  feeDue: number;
  totalDue: number;
}

export interface Quote {
  programSlug: string;
  programName: string;
  invoiceAmount: number;
  depositPercent: number;
  depositAmount: number;
  financedAmount: number;
  periodUnit: PeriodUnitName;
  periods: number;
  feePercentPerPeriod: number;
  totalFee: number;
  totalRepayable: number;
  installmentAmount: number;
  totalPayable: number;
  feeAsPercentOfFinanced: number;
  firstDueOn: string | null;
  schedule: QuoteInstallment[];
  usesProgramDefaults: boolean;
  disclaimer: string | null;
}

export interface CompareResult {
  results: Quote[];
  errors: { programSlug: string; programName: string; message: string }[];
}

export interface CalculateBody {
  /** naira string with at most 2 decimals */
  amount: string;
  periods?: number;
  depositPercent?: number;
  startOn?: string;
}

/** Agents and admins only (403 for anyone else). Agents only see programs they may sell. */
export async function listCalculatorPrograms() {
  return asArray<CalculatorProgram>(await apiFetch<unknown>("/calculator/programs/"));
}

export function calculateQuote(body: CalculateBody & { programSlug: string }) {
  return apiFetch<Quote>("/calculator/", { method: "POST", body });
}

/** Without a programSlug: the same amount across every program the user can sell. */
export function compareQuotes(amount: string) {
  return apiFetch<CompareResult>("/calculator/", { method: "POST", body: { amount } });
}