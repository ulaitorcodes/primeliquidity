import type { Payment, PaymentPurpose } from "@/lib/api/payments";

export function purposeTitle(purpose: PaymentPurpose, installmentNumber?: number | null) {
  switch (purpose) {
    case "installment":
      return installmentNumber ? `Pay installment ${installmentNumber}` : "Pay next installment";
    case "payoff":
      return "Settle in full";
    case "custom":
      return "Pay another amount";
    case "deposit":
      return "Pay deposit";
  }
}

/** Short label for the history table. */
export function purposeLabel(p: Pick<Payment, "purpose" | "installmentNumber">) {
  switch (p.purpose) {
    case "installment":
      return p.installmentNumber ? `Installment ${p.installmentNumber}` : "Next installment";
    case "payoff":
      return "Settle in full";
    case "custom":
      return "Custom amount";
    case "deposit":
      return "Deposit";
  }
}

/** "Covers installments 1–3", from the breakdown the server returned. */
export function coverage(p: Payment): string | null {
  const nums = p.breakdown
    .map((b) => b.number)
    .filter((n): n is number => typeof n === "number");
  if (nums.length === 0) return null;
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  return lo === hi ? `Covers installment ${lo}` : `Covers installments ${lo}–${hi}`;
}

/**
 * Display only. Works in whole kobo so the subtraction is exact,
 * then returns the naira value and its 2-decimal text.
 */
export function remainingNaira(amount: number, paid: number) {
  const kobo = Math.max(0, Math.round(amount * 100) - Math.round(paid * 100));
  return { value: kobo / 100, text: (kobo / 100).toFixed(2) };
}

export function formatCountdown(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}