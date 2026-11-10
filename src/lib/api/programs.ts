import { ApiError, apiFetch } from "./http";
import type { CalculatorConfig, Program } from "@/lib/programs/types";

interface ApiCalculator {
  ratePerWeek: number;
  minWeeks: number;
  maxWeeks: number;
  defaultWeeks: number;
  amountField: string;
  weeksField: string;
  // Optional: not in the backend spec yet, derived from the amount field if absent
  minAmount?: number;
  maxAmount?: number;
  defaultAmount?: number;
}

type ApiProgram = Omit<Program, "calculator"> & {
  calculator: ApiCalculator | null;
};

function normalizeCalculator(
  raw: ApiCalculator | null,
  sections: Program["sections"]
): CalculatorConfig | undefined {
  if (!raw) return undefined;

  const amountField = sections
    .flatMap((s) => s.fields)
    .find((f) => f.name === raw.amountField);

  const min = raw.minAmount ?? amountField?.min ?? 1000;
  const max = raw.maxAmount ?? amountField?.max ?? 10_000_000;
  const fieldDefault = Number(amountField?.defaultValue);
  const wanted = raw.defaultAmount ?? (fieldDefault > 0 ? fieldDefault : min);

  return {
    // ratePerWeek is treated as a percentage (2.5 = 2.5% per week)
    weeklyRatePct: raw.ratePerWeek,
    minWeeks: raw.minWeeks,
    maxWeeks: raw.maxWeeks,
    defaultWeeks: raw.defaultWeeks,
    minAmount: min,
    maxAmount: max,
    defaultAmount: Math.min(Math.max(wanted, min), max),
    amountField: raw.amountField,
    weeksField: raw.weeksField,
  };
}

function normalizeProgram(p: ApiProgram): Program {
  return {
    ...p,
    highlights: p.highlights ?? [],
    terms: p.terms ?? [],
    steps: p.steps ?? [],
    calculator: normalizeCalculator(p.calculator, p.sections),
  };
}

/** Works on the server (pages) and in the browser (dashboards). */
export async function fetchPrograms(): Promise<Program[]> {
  const data = await apiFetch<ApiProgram[]>("/programs/", {
    auth: "none",
    revalidate: 60,
  });
  return data.map(normalizeProgram);
}

export async function fetchProgram(slug: string): Promise<Program | null> {
  try {
    const data = await apiFetch<ApiProgram>(`/programs/${slug}/`, {
      auth: "none",
      revalidate: 60,
    });
    return normalizeProgram(data);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}