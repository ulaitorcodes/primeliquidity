import type { Payoff } from "@/lib/api/my";
import { formatDay, formatMoneyExact } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";

export function PayoffCard({
  payoff,
  loading,
  error,
  onSettle,
  onCustom,
}: {
  payoff: Payoff | null;
  loading: boolean;
  error: string | null;
  onSettle: () => void;
  onCustom: () => void;
}) {
  if (loading && !payoff) return <Skeleton className="h-44 w-full rounded-2xl" />;

  if (!payoff) {
    // A 400 means there is nothing outstanding on this loan
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-ink">Settle early</h2>
        <p className="mt-2 text-sm text-slate-600">{error ?? "No payoff quote is available."}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold text-ink">Settle early</h2>
      <p className="mt-1 text-sm text-slate-600">
        You can pay any amount at any time. It goes to the oldest unpaid installment first, and paying the full
        payoff closes the loan.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-brand-50 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-700">Total payoff today</p>
          <p className="mt-1 text-2xl font-bold text-brand-900">{formatMoneyExact(payoff.totalPayoff)}</p>
          <p className="mt-1 text-xs text-brand-800">As of {formatDay(payoff.asOf)}</p>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Principal outstanding</dt>
            <dd className="font-medium text-ink">{formatMoneyExact(payoff.principalOutstanding)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Service charges outstanding</dt>
            <dd className="font-medium text-ink">{formatMoneyExact(payoff.feesOutstanding)}</dd>
          </div>
          {payoff.feeRebate > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600">Early settlement rebate</dt>
              <dd className="font-medium text-emerald-700">−{formatMoneyExact(payoff.feeRebate)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-slate-100 pt-2">
            <dt className="text-slate-600">Installments remaining</dt>
            <dd className="font-medium text-ink">{payoff.installmentsRemaining}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Next due</dt>
            <dd className="font-medium text-ink">{formatDay(payoff.nextDueOn)}</dd>
          </div>
        </dl>
      </div>

      {payoff.note && <p className="mt-4 text-sm text-slate-600">{payoff.note}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onSettle} className={buttonClass("primary")}>
          Settle in full · {formatMoneyExact(payoff.totalPayoff)}
        </button>
        <button onClick={onCustom} className={buttonClass("outline")}>
          Pay another amount
        </button>
      </div>
    </section>
  );
}