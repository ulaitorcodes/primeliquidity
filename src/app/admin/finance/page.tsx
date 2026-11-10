"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  CalendarClock,
  Coins,
  Gauge,
  Hourglass,
  Inbox,
  Landmark,
  Percent,
  PiggyBank,
  Receipt,
  Send,
  ShieldAlert,
  ShieldCheck,
  Store,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { getFinanceSummary, getReconciliation } from "@/lib/api/finance";
import { listReceipts } from "@/lib/api/payments";
import type { DateRange } from "@/lib/api/types";
import { formatBucket, lastDaysRange } from "@/lib/dates";
import {
  countLoans,
  formatCount,
  formatMoneyExact,
  formatPercent,
} from "@/lib/format";
import { usePrograms } from "@/lib/programs/programs-context";
import { useLoad } from "@/lib/use-load";
import { BreakdownBars } from "@/components/analytics/breakdown-bars";
import { RangePicker } from "@/components/analytics/range-picker";
import { LoanStatusBadge } from "@/components/finance/badges";
import { MultiLineChart } from "@/components/finance/line-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const selectClass =
  "rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

const bucketLabels: Record<string, string> = {
  current: "Current",
  "1-7": "1–7 days late",
  "8-30": "8–30 days late",
  "31-60": "31–60 days late",
  "61-90": "61–90 days late",
  "90+": "Over 90 days late",
};

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-6", className)}>
      <h2 className="mb-4 font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export default function FinanceDashboardPage() {
  const { programs } = usePrograms();
  const [range, setRange] = useState<DateRange>(() => lastDaysRange(30));
  const [program, setProgram] = useState("");

  const summaryLoader = useCallback(
    () =>
      getFinanceSummary({
        from: range.from,
        to: range.to,
        granularity: range.granularity,
        program: program || undefined,
      }),
    [range, program]
  );
  const { data, loading, error } = useLoad(summaryLoader);

  const reconLoader = useCallback(() => getReconciliation(), []);
  const recon = useLoad(reconLoader);

  const receiptsLoader = useCallback(() => listReceipts("open"), []);
  const receipts = useLoad(receiptsLoader);
  const openReceipts = receipts.data?.items.length ?? 0;

  const busy = loading && data === null;
  const pos = data?.position;
  const per = data?.period;
  const pf = data?.portfolio;

  const periodHint = (v: number | undefined) =>
    v === undefined ? undefined : `${formatMoneyExact(v)} in this period`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Finance</h1>
          <p className="text-sm text-slate-600">
            Totals are cumulative up to the end date. The small lines show the selected period.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {receipts.loading && receipts.data === null ? (
            <Skeleton className="h-8 w-36 rounded-full" />
          ) : receipts.data ? (
            <Link
              href="/admin/finance/receipts"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset",
                !receipts.data.reconciled
                  ? "bg-red-50 text-red-700 ring-red-200"
                  : openReceipts > 0
                    ? "bg-amber-50 text-amber-700 ring-amber-200"
                    : "bg-slate-100 text-slate-600 ring-slate-200"
              )}
            >
              <Receipt size={14} />
              {openReceipts > 0
                ? `${openReceipts} held receipt${openReceipts === 1 ? "" : "s"} · ${formatMoneyExact(receipts.data.openTotal)}`
                : "No held receipts"}
            </Link>
          ) : null}

          {recon.loading && recon.data === null ? (
            <Skeleton className="h-8 w-32 rounded-full" />
          ) : recon.data ? (
            <Link
              href="/admin/finance/integrity"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset",
                recon.data.ok
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-red-50 text-red-700 ring-red-200"
              )}
            >
              {recon.data.ok ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              {recon.data.ok ? "Books balanced" : "Needs attention"}
            </Link>
          ) : (
            <Link
              href="/admin/finance/integrity"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              <ShieldAlert size={14} /> Integrity unknown
            </Link>
          )}

          <select value={program} onChange={(e) => setProgram(e.target.value)} className={selectClass}>
            <option value="">All programs</option>
            {programs.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <RangePicker value={range} onChange={setRange} />

      <ErrorNotice message={error} />

      {recon.data && !recon.data.ok && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />
          <p>
            The integrity check found problems with the books.{" "}
            <Link href="/admin/finance/integrity" className="font-semibold underline">
              Review them now
            </Link>
            .
          </p>
        </div>
      )}

      {receipts.data && !receipts.data.reconciled && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <p>
            Held receipts don't match the ledger.{" "}
            <Link href="/admin/finance/receipts" className="font-semibold underline">
              Look into it
            </Link>
            .
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Funded" value={formatMoneyExact(pos?.capitalFunded)} icon={Landmark} loading={busy} hint={periodHint(per?.capitalFunded)} />
        <StatCard label="Deployed" value={formatMoneyExact(pos?.deployed)} icon={Send} loading={busy} hint={periodHint(per?.deployed)} />
        <StatCard label="Repaid (principal)" value={formatMoneyExact(pos?.principalRepaid)} icon={ArrowDownLeft} tone="green" loading={busy} hint={periodHint(per?.principalRepaid)} />
        <StatCard label="Fees earned" value={formatMoneyExact(pos?.feesCollected)} icon={Coins} tone="green" loading={busy} hint={periodHint(per?.feesCollected)} />
        <StatCard
          label="Outstanding"
          value={formatMoneyExact(pos?.outstandingPrincipal)}
          icon={Hourglass}
          tone="amber"
          loading={busy}
          hint={pf ? `Charges outstanding: ${formatMoneyExact(pf.outstandingFees)}` : undefined}
        />
        <StatCard label="Cash on hand" value={formatMoneyExact(pos?.cash)} icon={Wallet} loading={busy} />
        <StatCard
          label="Overdue"
          value={formatMoneyExact(pf?.overdueAmount)}
          icon={TriangleAlert}
          tone="red"
          loading={busy}
          hint={pf ? `Principal: ${formatMoneyExact(pf.overduePrincipal)}` : undefined}
        />
        <StatCard label="PAR30" value={formatPercent(pf?.par30Rate)} icon={Gauge} tone="red" loading={busy} hint="Portfolio at risk, 30+ days" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Deployment rate" value={formatPercent(pos?.deploymentRate)} icon={Percent} loading={busy} />
        <StatCard label="Repayment rate" value={formatPercent(pos?.repaymentRate)} icon={Percent} loading={busy} />
        <StatCard
          label="Collections rate"
          value={formatPercent(data?.collections.rate)}
          icon={Percent}
          tone="green"
          loading={busy}
          hint={
            data
              ? `${formatMoneyExact(data.collections.collected)} of ${formatMoneyExact(data.collections.due)} due`
              : undefined
          }
        />
        <StatCard label="Due in next 7 days" value={formatMoneyExact(pf?.dueNext7Days)} icon={CalendarClock} tone="amber" loading={busy} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Deposits, receipts and merchants</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Deposits held"
            value={formatMoneyExact(pos?.depositsHeld)}
            icon={PiggyBank}
            tone="amber"
            loading={busy}
            hint={
              per
                ? `Received ${formatMoneyExact(per.depositsReceived)}, refunded ${formatMoneyExact(per.depositsRefunded)} in this period`
                : undefined
            }
          />
          <StatCard label="Unallocated receipts" value={formatMoneyExact(pos?.unallocatedReceipts)} icon={Inbox} loading={busy} />
          <StatCard
            label="Held receipts (open)"
            value={receipts.data ? formatMoneyExact(receipts.data.openTotal) : "—"}
            icon={Receipt}
            tone={openReceipts > 0 ? "red" : "slate"}
            loading={receipts.loading && receipts.data === null}
            hint={receipts.data ? `${openReceipts} open · tap the badge above to review` : undefined}
          />
          <StatCard
            label="Paid to merchants"
            value={formatMoneyExact(pos?.paidToMerchants)}
            icon={Store}
            loading={busy}
            hint={periodHint(per?.paidToMerchants)}
          />
        </div>
      </div>

      {pf && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
          <span className="font-medium text-ink">Loans:</span>
          {(["approved", "active", "completed", "written_off", "cancelled"] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-2">
              <LoanStatusBadge status={s} /> {formatCount(pf.loans[s])}
            </span>
          ))}
        </div>
      )}

      <Card title="Money movement">
        {busy ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <MultiLineChart
            labels={(data?.timeseries ?? []).map((p) => formatBucket(p.date, range.granularity))}
            series={[
              { key: "funded", label: "Funded", color: "#059669", values: (data?.timeseries ?? []).map((p) => p.capitalFunded) },
              { key: "deployed", label: "Deployed", color: "#2563eb", values: (data?.timeseries ?? []).map((p) => p.deployed) },
              { key: "repaid", label: "Repaid", color: "#f59e0b", values: (data?.timeseries ?? []).map((p) => p.principalRepaid) },
              { key: "fees", label: "Fees", color: "#9333ea", values: (data?.timeseries ?? []).map((p) => p.feesCollected) },
            ]}
          />
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Loan ageing (outstanding principal)">
          {busy ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <BreakdownBars
              format={formatMoneyExact}
              items={(pf?.ageing ?? []).map((b) => ({
                key: b.bucket,
                label: bucketLabels[b.bucket] ?? b.bucket,
                value: b.outstandingPrincipal,
                hint: `${formatCount(b.loans)} loan${b.loans === 1 ? "" : "s"}`,
                color: b.bucket === "current" ? "bg-emerald-500" : "bg-red-400",
              }))}
              emptyMessage="No outstanding loans."
            />
          )}
        </Card>

        <Card title="Collections in this period">
          {busy ? (
            <Skeleton className="h-40 w-full" />
          ) : data ? (
            <div className="space-y-4">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">Installments due</dt>
                  <dd className="font-semibold text-ink">{formatMoneyExact(data.collections.due)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Collected</dt>
                  <dd className="font-semibold text-ink">{formatMoneyExact(data.collections.collected)}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3">
                  <dt className="text-slate-600">Rate</dt>
                  <dd className="font-semibold text-ink">{formatPercent(data.collections.rate)}</dd>
                </div>
              </dl>
              {data.collections.rate !== null && (
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-brand-600"
                    style={{ width: `${Math.min(100, Math.max(0, data.collections.rate))}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Not available yet.</p>
          )}
        </Card>
      </div>

      <Card title="By program">
        {busy ? (
          <Skeleton className="h-32 w-full" />
        ) : !data || data.byProgram.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Not available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Program</th>
                  <th className="py-2 pr-4 font-medium">Loans</th>
                  <th className="py-2 pr-4 font-medium">Funded</th>
                  <th className="py-2 pr-4 font-medium">Deployed</th>
                  <th className="py-2 pr-4 font-medium">Repaid</th>
                  <th className="py-2 pr-4 font-medium">Fees</th>
                  <th className="py-2 pr-4 font-medium">Outstanding</th>
                  <th className="py-2 font-medium">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.byProgram.map((p) => (
                  <tr key={p.programSlug ?? "pool"}>
                    <td className="py-3 pr-4 font-medium text-ink">{p.programName ?? "General pool"}</td>
                    <td className="py-3 pr-4">{formatCount(countLoans(p.loans))}</td>
                    <td className="py-3 pr-4">{formatMoneyExact(p.position?.capitalFunded)}</td>
                    <td className="py-3 pr-4">{formatMoneyExact(p.position?.deployed)}</td>
                    <td className="py-3 pr-4">{formatMoneyExact(p.position?.principalRepaid)}</td>
                    <td className="py-3 pr-4">{formatMoneyExact(p.position?.feesCollected)}</td>
                    <td className="py-3 pr-4">{formatMoneyExact(p.position?.outstandingPrincipal)}</td>
                    <td className={cn("py-3", p.overdueAmount > 0 && "font-medium text-red-600")}>
                      {formatMoneyExact(p.overdueAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}