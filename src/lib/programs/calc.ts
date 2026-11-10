import type { CalculatorConfig } from "./types";

export function calculateRepayment(
  config: CalculatorConfig,
  amount: number,
  weeks: number
) {
  const w = Math.min(Math.max(weeks, config.minWeeks), config.maxWeeks);
  const serviceCharge = amount * (config.weeklyRatePct / 100) * w;
  const total = amount + serviceCharge;
  return { weeks: w, serviceCharge, total, weekly: total / w };
}