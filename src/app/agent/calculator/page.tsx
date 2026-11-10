import type { Metadata } from "next";
import { LoanCalculator } from "@/components/calculator/loan-calculator";

export const metadata: Metadata = { title: "Loan calculator" };

export default function AgentCalculatorPage() {
  return <LoanCalculator />;
}