"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/http";
import {
  calculateQuote,
  compareQuotes,
  listCalculatorPrograms,
  type CalculateBody,
  type CompareResult,
  type Quote,
} from "@/lib/api/calculator";
import { formatMoneyExact } from "@/lib/format";
import { parseMoneyInput } from "@/lib/money";
import { unitLabel } from "@/lib/units";
import { useLoad } from "@/lib/use-load";
import { QuoteSheet } from "@/components/calculator/quote-sheet";
import { ErrorNotice } from "@/components/ui/error-notice";
import { FormField, inputClass } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mode = "single" | "compare";

/** What the effect sends to the server, or null when the inputs aren't ready yet. */
type Request =
  | { mode: "single"; body: CalculateBody & { programSlug: string } }
  | { mode: "compare"; body: { amount: string } }
  | null;

export function LoanCalculator() {
  const programsLoader = useCallback(() => listCalculatorPrograms(), []);
  const programs = useLoad(programsLoader);
  const list = programs.data ?? [];

  const [mode, setMode] = useState<Mode>("single");
  const [slug, setSlug] = useState("");
  const [amountText, setAmountText] = useState("");
  // null = untouched, so the server uses the program's default (and reports usesProgramDefaults)
  const [periods, setPeriods] = useState<number | null>(null);
  const [depositText, setDepositText] = useState("");
  const [startOn, setStartOn] = useState("");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [compare, setCompare] = useState<CompareResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const requestId = useRef(0);

  const activeSlug = slug || list.find((p) => p.calculable)?.slug || list[0]?.slug || "";
  const program = list.find((p) => p.slug === activeSlug) ?? null;
  const shownPeriods = periods ?? program?.defaultPeriods ?? null;

  /* ---- validation (only decides whether to call the server) ---- */
  const amountParsed = parseMoneyInput(amountText);
  let amountError: string | null = amountParsed.error;
  if (!amountError && amountParsed.value && mode === "single" && program?.calculable) {
    const n = Number(amountParsed.value);
    if (n < program.minAmount) amountError = `The minimum is ${formatMoneyExact(program.minAmount)}.`;
    else if (n > program.maxAmount) amountError = `The maximum is ${formatMoneyExact(program.maxAmount)}.`;
  }

  let depositError: string | null = null;
  const depositTrim = depositText.trim();
  if (depositTrim && (!/^\d+(\.\d+)?$/.test(depositTrim) || Number(depositTrim) > 100)) {
    depositError = "Enter a percentage between 0 and 100.";
  }

  let request: Request = null;
  if (mode === "single") {
    if (program?.calculable && amountParsed.value && !amountError && !depositError) {
      request = {
        mode: "single",
        body: {
          amount: amountParsed.value,
          periods: periods ?? undefined,
          depositPercent: depositTrim ? Number(depositTrim) : undefined,
          startOn: startOn || undefined,
          programSlug: program.slug,
        },
      };
    }
  } else if (amountParsed.value && !amountParsed.error) {
    request = { mode: "compare", body: { amount: amountParsed.value } };
  }

  // The effect re-runs when this string changes, and parses it back with a real type
  const key = JSON.stringify(request);

  /* ---- auto-calculate as the inputs change ---- */
  useEffect(() => {
    const req = JSON.parse(key) as Request;

    if (!req) {
      requestId.current += 1;
      setQuote(null);
      setCompare(null);
      setCalcError(null);
      setServerErrors({});
      setCalcLoading(false);
      return;
    }

    const id = ++requestId.current;
    setCalcLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        if (req.mode === "single") {
          const q = await calculateQuote(req.body);
          if (id !== requestId.current) return;
          setQuote(q);
        } else {
          const c = await compareQuotes(req.body.amount);
          if (id !== requestId.current) return;
          setCompare(c);
        }
        setCalcError(null);
        setServerErrors({});
      } catch (err) {
        if (id !== requestId.current) return;
        if (req.mode === "single") setQuote(null);
        else setCompare(null);
        if (err instanceof ApiError) {
          setServerErrors(err.fieldErrors);
          setCalcError(err.message);
        } else {
          setCalcError("Couldn't calculate. Please try again.");
        }
      } finally {
        if (id === requestId.current) setCalcLoading(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [key]);

  function chooseProgram(next: string) {
    setSlug(next);
    setPeriods(null);
    setDepositText("");
  }

  const amountMessage = amountError ?? serverErrors.amount?.[0];
  const periodsMessage = serverErrors.periods?.[0];
  const depositMessage = depositError ?? serverErrors.depositPercent?.[0];

  return (
    <div className="space-y-8">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-ink">Loan calculator</h1>
        <p className="text-sm text-slate-600">
          Work out what a loan costs, to explain the terms to a customer. Rates and limits differ for every program.
        </p>
      </div>

      <ErrorNotice message={programs.error} />

      {programs.loading && programs.data === null ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : list.length === 0 && !programs.error ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No programs are available for your account yet.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Inputs */}
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 print:hidden lg:col-span-2">
            <div className="flex gap-2">
              {(
                [
                  ["single", "One program"],
                  ["compare", "Compare all"],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    mode === m
                      ? "bg-brand-600 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "single" && (
              <FormField label="Program">
                <select className={inputClass} value={activeSlug} onChange={(e) => chooseProgram(e.target.value)}>
                  {list.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                      {p.calculable ? "" : " (pricing agreed per loan)"}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {mode === "compare" && (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                Shows the same amount across every program you can sell, each with its own rate and terms.
              </p>
            )}

            {mode === "single" && program && !program.calculable ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Pricing for {program.name} is agreed per loan</p>
                <p className="mt-1">{program.reason ?? "There is no standard rate to calculate with."}</p>
              </div>
            ) : (
              <>
                <FormField
                  label="Invoice amount (₦)"
                  error={amountMessage}
                  helper={
                    mode === "single" && program?.calculable
                      ? `Between ${formatMoneyExact(program.minAmount)} and ${formatMoneyExact(program.maxAmount)}`
                      : "The full amount to be paid to the merchant."
                  }
                >
                  <input
                    inputMode="decimal"
                    className={inputClass}
                    value={amountText}
                    onChange={(e) => setAmountText(e.target.value)}
                    placeholder="0.00"
                  />
                </FormField>

                {mode === "single" && program?.calculable && shownPeriods !== null && (
                  <>
                    <div>
                      <div className="mb-1.5 flex items-baseline justify-between">
                        <label className="text-sm font-medium text-slate-700">Duration</label>
                        <span className="text-sm font-semibold text-ink">
                          {shownPeriods} {unitLabel(program.periodUnit, shownPeriods)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={program.minPeriods}
                        max={program.maxPeriods}
                        step={1}
                        value={shownPeriods}
                        onChange={(e) => setPeriods(Number(e.target.value))}
                        className="w-full accent-brand-600"
                      />
                      <div className="mt-1 flex justify-between text-xs text-slate-500">
                        <span>
                          {program.minPeriods} {unitLabel(program.periodUnit, program.minPeriods)}
                        </span>
                        <span>
                          {program.maxPeriods} {unitLabel(program.periodUnit, program.maxPeriods)}
                        </span>
                      </div>
                      {periodsMessage && <p className="mt-1.5 text-xs text-red-600">{periodsMessage}</p>}
                    </div>

                    <FormField
                      label="Deposit (%)"
                      error={depositMessage}
                      helper={`Optional. Leave blank for the program's ${program.depositPercent}%.`}
                    >
                      <input
                        inputMode="decimal"
                        className={inputClass}
                        value={depositText}
                        onChange={(e) => setDepositText(e.target.value)}
                        placeholder={String(program.depositPercent)}
                      />
                    </FormField>

                    <FormField label="Start date" helper="Optional. Leave blank to start today.">
                      <input
                        type="date"
                        className={inputClass}
                        value={startOn}
                        onChange={(e) => setStartOn(e.target.value)}
                      />
                    </FormField>

                    <p className="text-xs text-slate-500">
                      {program.feePercentPerPeriod}% service charge per {program.periodUnit}.
                    </p>
                  </>
                )}
              </>
            )}

            {calcLoading && (
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 size={14} className="animate-spin" /> Calculating...
              </p>
            )}
            {calcError && Object.keys(serverErrors).length === 0 && <ErrorNotice message={calcError} />}
          </section>

          {/* Results */}
          <section className="lg:col-span-3">
            {mode === "single" ? (
              quote ? (
                <QuoteSheet quote={quote} loading={calcLoading} />
              ) : calcLoading ? (
                <Skeleton className="h-96 w-full rounded-2xl" />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                  {program && !program.calculable
                    ? "No calculation is available for this program."
                    : "Enter an amount to see the quote."}
                </div>
              )
            ) : compare ? (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-medium">Program</th>
                        <th className="px-5 py-3 font-medium">Deposit</th>
                        <th className="px-5 py-3 font-medium">Financed</th>
                        <th className="px-5 py-3 font-medium">Charges</th>
                        <th className="px-5 py-3 font-medium">Installment</th>
                        <th className="px-5 py-3 font-medium">Total to repay</th>
                        <th className="px-5 py-3 print:hidden" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {compare.results.map((r) => (
                        <tr key={r.programSlug}>
                          <td className="px-5 py-4 font-medium text-ink">{r.programName}</td>
                          <td className="px-5 py-4">
                            {formatMoneyExact(r.depositAmount)}
                            <span className="block text-xs text-slate-500">{r.depositPercent}%</span>
                          </td>
                          <td className="px-5 py-4">{formatMoneyExact(r.financedAmount)}</td>
                          <td className="px-5 py-4">
                            {formatMoneyExact(r.totalFee)}
                            <span className="block text-xs text-slate-500">
                              {r.feePercentPerPeriod}% per {r.periodUnit}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {formatMoneyExact(r.installmentAmount)}
                            <span className="block text-xs text-slate-500">
                              × {r.periods} {unitLabel(r.periodUnit, r.periods)}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-medium text-ink">{formatMoneyExact(r.totalRepayable)}</td>
                          <td className="px-5 py-4 text-right print:hidden">
                            <button
                              onClick={() => {
                                chooseProgram(r.programSlug);
                                setMode("single");
                              }}
                              className={buttonClass("outline")}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {compare.errors.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="font-medium text-ink">Not available for this amount</p>
                    <ul className="mt-2 space-y-1">
                      {compare.errors.map((e) => (
                        <li key={e.programSlug}>
                          <span className="font-medium">{e.programName}:</span> {e.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="print:hidden">
                  <button onClick={() => window.print()} className={buttonClass("outline")}>
                    Print / save as PDF
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Open “Details” on a program for the full schedule and the official disclaimer. Figures are estimates
                  until a loan is approved.
                </p>
              </div>
            ) : calcLoading ? (
              <Skeleton className="h-64 w-full rounded-2xl" />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                Enter an amount to compare programs.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}