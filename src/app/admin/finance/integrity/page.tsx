"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { getReconciliation, getTrialBalance } from "@/lib/api/finance";
import type { Reconciliation } from "@/lib/api/finance-types";
import { ApiError } from "@/lib/api/http";
import { formatDateTime, formatMoneyExact, todayISO } from "@/lib/format";
import { parseMoneyInput } from "@/lib/money";
import { useLoad } from "@/lib/use-load";
import { ErrorNotice } from "@/components/ui/error-notice";
import { FormField, inputClass } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function renderItem(item: unknown): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    return Object.entries(item as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(" · ");
  }
  return String(item);
}

export default function IntegrityPage() {
  const initialLoader = useCallback(() => getReconciliation(), []);
  const initial = useLoad(initialLoader);

  const [bank, setBank] = useState("");
  const [bankError, setBankError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [withBank, setWithBank] = useState<Reconciliation | null>(null);

  const [asOf, setAsOf] = useState(() => todayISO());
  const trialLoader = useCallback(() => getTrialBalance(asOf), [asOf]);
  const trial = useLoad(trialLoader);

  // Prefer the check that included the bank balance, if one was run
  const result = withBank ?? initial.data;

  async function runCheck() {
    setBankError(null);
    setCheckError(null);
    const parsed = parseMoneyInput(bank);
    if (parsed.error) return setBankError(parsed.error);

    setChecking(true);
    try {
      setWithBank(await getReconciliation(parsed.value ?? undefined));
    } catch (err) {
      setCheckError(err instanceof ApiError || err instanceof Error ? err.message : "Check failed");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Integrity</h1>
        <p className="text-sm text-slate-600">
          Checks that the books add up, and that they match the real bank balance.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-ink">Compare with the bank</h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter the real bank or Paystack balance. A difference means a payment is missing from, or extra in, the books.
        </p>
        <div className="mt-4 flex flex-wrap items-start gap-3">
          <div className="w-64">
            <FormField label="Bank balance (₦)" error={bankError ?? undefined}>
              <input
                inputMode="decimal"
                className={inputClass}
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="0.00"
              />
            </FormField>
          </div>
          <button onClick={runCheck} disabled={checking} className={buttonClass("primary", "md", "mt-[26px]")}>
            {checking ? <Loader2 size={16} className="animate-spin" /> : "Run check"}
          </button>
        </div>
        <div className="mt-3">
          <ErrorNotice message={checkError} />
        </div>
      </section>

      <ErrorNotice message={initial.error} />

      {initial.loading && !result ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : result ? (
        <section className="space-y-4">
          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-5",
              result.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-300 bg-red-50 text-red-900"
            )}
          >
            {result.ok ? <ShieldCheck size={24} className="shrink-0" /> : <ShieldAlert size={24} className="shrink-0" />}
            <div>
              <p className="text-lg font-semibold">
                {result.ok ? "All checks passed" : "Problems found. The books need attention."}
              </p>
              <p className="mt-1 text-sm">
                Cash on hand in the ledger: <span className="font-semibold">{formatMoneyExact(result.cashOnHand)}</span>
                {" · "}checked {formatDateTime(result.generatedAt)}
                {withBank ? " · includes your bank balance" : ""}
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {result.checks.map((c) => (
              <li
                key={c.name}
                className={cn(
                  "rounded-2xl border bg-white p-5",
                  c.ok ? "border-slate-200" : "border-red-200"
                )}
              >
                <div className="flex items-start gap-3">
                  {c.ok ? (
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{c.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          c.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}
                      >
                        {c.ok ? "Pass" : "Fail"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{c.detail}</p>
                    {c.items.length > 0 && (
                      <ul className="mt-3 space-y-1 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                        {c.items.map((item, i) => (
                          <li key={i} className="break-words">
                            {renderItem(item)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-ink">Trial balance</h2>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            As of
            <input
              type="date"
              value={asOf}
              max={todayISO()}
              onChange={(e) => e.target.value && setAsOf(e.target.value)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <ErrorNotice message={trial.error} />

        {trial.loading && trial.data === null ? (
          <Skeleton className="h-40 w-full" />
        ) : !trial.data || trial.data.accounts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Not available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Code</th>
                  <th className="py-2 pr-4 font-medium">Account</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Debit</th>
                  <th className="py-2 pr-4 font-medium">Credit</th>
                  <th className="py-2 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trial.data.accounts.map((a) => (
                  <tr key={a.code}>
                    <td className="py-3 pr-4 text-slate-500">{a.code}</td>
                    <td className="py-3 pr-4 font-medium text-ink">{a.name}</td>
                    <td className="py-3 pr-4 capitalize text-slate-600">{a.type}</td>
                    <td className="py-3 pr-4">{formatMoneyExact(a.debit)}</td>
                    <td className="py-3 pr-4">{formatMoneyExact(a.credit)}</td>
                    <td className="py-3">{formatMoneyExact(a.balance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-semibold text-ink">
                  <td className="py-3 pr-4" colSpan={3}>
                    Totals
                    <span
                      className={cn(
                        "ml-3 rounded-full px-2 py-0.5 text-xs",
                        trial.data.totals.balanced ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      )}
                    >
                      {trial.data.totals.balanced ? "Balanced" : "Out of balance"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{formatMoneyExact(trial.data.totals.debit)}</td>
                  <td className="py-3 pr-4">{formatMoneyExact(trial.data.totals.credit)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}