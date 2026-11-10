"use client";

import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, FileText, TrendingUp, Users, Wallet } from "lucide-react";
import type { DateRange, Performance } from "@/lib/api/types";
import { lastDaysRange } from "@/lib/dates";
import { formatCount, formatMoney, formatPercent } from "@/lib/format";
import { RangePicker } from "@/components/analytics/range-picker";
import { TimeseriesChart } from "@/components/analytics/timeseries-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";

export function PerformancePanel({
  load,
}: {
  load: (range: DateRange) => Promise<Performance>;
}) {
  const [range, setRange] = useState<DateRange>(() => lastDaysRange(30));
  const [data, setData] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    load(range)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load performance");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load, range]);

  const t = data?.totals;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-ink">Performance</h2>
        <RangePicker value={range} onChange={setRange} />
      </div>

      <ErrorNotice message={error} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Applications" value={formatCount(t?.applications)} icon={FileText} loading={loading} />
        <StatCard label="People registered" value={formatCount(t?.people)} icon={Users} loading={loading} />
        <StatCard label="Approved" value={formatCount(t?.byStatus.approved)} icon={CheckCircle2} tone="green" loading={loading} />
        <StatCard label="Approval rate" value={formatPercent(t?.approvalRate)} icon={TrendingUp} tone="green" loading={loading} />
        <StatCard label="Requested" value={formatMoney(t?.requestedAmount)} icon={Wallet} tone="amber" loading={loading} />
        <StatCard label="Approved amount" value={formatMoney(t?.approvedAmount)} icon={Banknote} tone="green" loading={loading} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-ink">Applications over time</h3>
        {loading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <TimeseriesChart points={data?.timeseries ?? []} granularity={range.granularity} />
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-ink">By program</h3>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : !data || data.byProgram.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Not available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Program</th>
                  <th className="py-2 pr-4 font-medium">Applications</th>
                  <th className="py-2 pr-4 font-medium">People</th>
                  <th className="py-2 pr-4 font-medium">Approved</th>
                  <th className="py-2 pr-4 font-medium">Approval rate</th>
                  <th className="py-2 font-medium">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.byProgram.map((p) => (
                  <tr key={p.programSlug}>
                    <td className="py-3 pr-4 font-medium text-ink">{p.programName}</td>
                    <td className="py-3 pr-4">{formatCount(p.applications)}</td>
                    <td className="py-3 pr-4">{formatCount(p.people)}</td>
                    <td className="py-3 pr-4">{formatCount(p.byStatus.approved)}</td>
                    <td className="py-3 pr-4">{formatPercent(p.approvalRate)}</td>
                    <td className="py-3">{formatMoney(p.requestedAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}