"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, TrendingUp, Users } from "lucide-react";
import { getAnalyticsOverview } from "@/lib/api/analytics";
import type { AnalyticsOverview, DateRange } from "@/lib/api/types";
import { useApplications } from "@/lib/api/use-applications";
import { lastDaysRange } from "@/lib/dates";
import { formatCount, formatMoney, formatPercent, timeAgo } from "@/lib/format";
import { BreakdownBars } from "@/components/analytics/breakdown-bars";
import { TimeseriesChart } from "@/components/analytics/timeseries-chart";
import { DuesPanel } from "@/components/dues/dues-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { ApplicationsTable } from "@/components/dashboard/applications-table";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOverviewPage() {
  const [range] = useState<DateRange>(() => lastDaysRange(30));
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { applications, loading: appsLoading, error: appsError } = useApplications();

  useEffect(() => {
    let cancelled = false;
    getAnalyticsOverview(range)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load overview");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const backlog = data ? data.backlog.pending + data.backlog.underReview : 0;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Admin overview</h1>
          <p className="text-sm text-slate-600">What's due now, and the last 30 days across every program.</p>
        </div>
        <Link href="/admin/analytics" className="text-sm font-medium text-brand-700 hover:underline">
          Full analytics →
        </Link>
      </div>

      <DuesPanel
        loanHref={(loanId) => `/admin/finance/loans/${loanId}`}
        showAgentFilter
      />

      <ErrorNotice message={error} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Awaiting review"
          value={formatCount(backlog)}
          icon={Clock}
          tone="amber"
          loading={loading}
        />
        <StatCard
          label="Applications (30 days)"
          value={formatCount(data?.totals.applications)}
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          label="Approval rate"
          value={formatPercent(data?.totals.approvalRate)}
          icon={TrendingUp}
          tone="green"
          loading={loading}
        />
        <StatCard
          label="Active agents"
          value={data ? `${data.agents.activeInRange} / ${data.agents.active}` : "—"}
          icon={Users}
          loading={loading}
        />
      </div>

      {data && data.backlog.oldestPendingAt && (
        <p className="-mt-6 text-sm text-slate-500">
          Oldest pending application: {timeAgo(data.backlog.oldestPendingAt)}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-ink">Applications over time</h2>
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <TimeseriesChart points={data?.timeseries ?? []} granularity={range.granularity} />
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-ink">By program</h2>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <BreakdownBars
              items={(data?.byProgram ?? []).map((p) => ({
                key: p.programSlug,
                label: p.programName,
                value: p.applications,
                hint: `${formatPercent(p.approvalRate)} approved`,
              }))}
            />
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Top agents</h2>
        {loading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : !data || data.agents.top.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Not available yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">Agent</th>
                  <th className="px-5 py-3 font-medium">Applications</th>
                  <th className="px-5 py-3 font-medium">Approval rate</th>
                  <th className="px-5 py-3 font-medium">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.agents.top.slice(0, 5).map((a) => (
                  <tr key={a.agentId}>
                    <td className="px-5 py-3 text-slate-500">{a.rank}</td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/agents/${a.agentId}`} className="font-medium text-brand-700 hover:underline">
                        {a.name}
                      </Link>
                      <span className="ml-2 text-xs text-slate-500">{a.code}</span>
                    </td>
                    <td className="px-5 py-3">{formatCount(a.applications)}</td>
                    <td className="px-5 py-3">{formatPercent(a.approvalRate)}</td>
                    <td className="px-5 py-3">{formatMoney(a.requestedAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent applications</h2>
          <Link href="/admin/applications" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        <ErrorNotice message={appsError} />
        <ApplicationsTable
          applications={applications.slice(0, 6)}
          loading={appsLoading}
          showApplicant
          showAgent
          detailHref={(a) => `/admin/applications/${a.id}`}
          emptyMessage="No applications yet."
        />
      </section>
    </div>
  );
}