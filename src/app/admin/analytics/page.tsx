"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  Clock,
  FileText,
  Repeat,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  getAgentsAnalytics,
  getAnalyticsOverview,
  getAnswersBreakdown,
} from "@/lib/api/analytics";
import type {
  AgentsAnalytics,
  AnalyticsOverview,
  AnswersBreakdown,
  DateRange,
} from "@/lib/api/types";
import { lastDaysRange } from "@/lib/dates";
import {
  formatCount,
  formatDate,
  formatHours,
  formatMoney,
  formatPercent,
  statusLabels,
  timeAgo,
} from "@/lib/format";
import { usePrograms } from "@/lib/programs/programs-context";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import { BreakdownBars } from "@/components/analytics/breakdown-bars";
import { RangePicker } from "@/components/analytics/range-picker";
import { TimeseriesChart } from "@/components/analytics/timeseries-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const selectClass =
  "rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-6", className)}>
      <h2 className="mb-4 font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

const statusColors = {
  pending: "bg-amber-400",
  under_review: "bg-blue-500",
  approved: "bg-emerald-500",
  rejected: "bg-red-500",
} as const;

const leaderboardColumns: { key: string; label: string; defaultOrder: "asc" | "desc" }[] = [
  { key: "name", label: "Agent", defaultOrder: "asc" },
  { key: "applications", label: "Applications", defaultOrder: "desc" },
  { key: "people", label: "People", defaultOrder: "desc" },
  { key: "approved", label: "Approved", defaultOrder: "desc" },
  { key: "approvalRate", label: "Approval rate", defaultOrder: "desc" },
  { key: "requestedAmount", label: "Requested", defaultOrder: "desc" },
  { key: "approvedAmount", label: "Approved amount", defaultOrder: "desc" },
  { key: "lastRegisteredAt", label: "Last registered", defaultOrder: "desc" },
];

export default function AdminAnalyticsPage() {
  const { programs } = usePrograms();
  const [range, setRange] = useState<DateRange>(() => lastDaysRange(30));
  const [program, setProgram] = useState("");

  /* ---- overview ---- */
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [ovLoading, setOvLoading] = useState(true);
  const [ovError, setOvError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setOvLoading(true);
    setOvError(null);
    getAnalyticsOverview(range, program || undefined)
      .then((d) => {
        if (!cancelled) setOverview(d);
      })
      .catch((err) => {
        if (!cancelled)
          setOvError(err instanceof Error ? err.message : "Failed to load analytics");
      })
      .finally(() => {
        if (!cancelled) setOvLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, program]);

  /* ---- agent leaderboard ---- */
  const [sort, setSort] = useState("applications");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [agentStatus, setAgentStatus] = useState<"" | "active" | "suspended">("");
  const [agentsData, setAgentsData] = useState<AgentsAnalytics | null>(null);
  const [agLoading, setAgLoading] = useState(true);
  const [agError, setAgError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAgLoading(true);
    setAgError(null);
    getAgentsAnalytics({
      from: range.from,
      to: range.to,
      sort,
      order,
      status: agentStatus,
    })
      .then((d) => {
        if (!cancelled) setAgentsData(d);
      })
      .catch((err) => {
        if (!cancelled)
          setAgError(err instanceof Error ? err.message : "Failed to load agent analytics");
      })
      .finally(() => {
        if (!cancelled) setAgLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, sort, order, agentStatus]);

  function toggleSort(key: string, defaultOrder: "asc" | "desc") {
    if (sort === key) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setOrder(defaultOrder);
    }
  }

  /* ---- answers breakdown ---- */
  const [answersProgram, setAnswersProgram] = useState("");
  const [answersField, setAnswersField] = useState("");
  const [answers, setAnswers] = useState<AnswersBreakdown | null>(null);
  const [anLoading, setAnLoading] = useState(false);
  const [anError, setAnError] = useState<string | null>(null);

  const pickableFields = (programs.find((p) => p.slug === answersProgram)?.sections ?? [])
    .flatMap((s) => s.fields)
    .filter((f) => f.type === "select" || f.type === "checkbox" || f.type === "number");

  useEffect(() => {
    if (!answersProgram || !answersField) return;
    let cancelled = false;
    setAnLoading(true);
    setAnError(null);
    getAnswersBreakdown({ from: range.from, to: range.to }, answersProgram, answersField)
      .then((d) => {
        if (!cancelled) setAnswers(d);
      })
      .catch((err) => {
        if (!cancelled)
          setAnError(err instanceof Error ? err.message : "Failed to load breakdown");
      })
      .finally(() => {
        if (!cancelled) setAnLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, answersProgram, answersField]);

  const t = overview?.totals;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Analytics</h1>
          <p className="text-sm text-slate-600">
            Dates are in Nigeria time. The review backlog always shows the current situation.
          </p>
        </div>
        <select value={program} onChange={(e) => setProgram(e.target.value)} className={selectClass}>
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <RangePicker value={range} onChange={setRange} />

      <ErrorNotice message={ovError} />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Applications" value={formatCount(t?.applications)} icon={FileText} loading={ovLoading} />
        <StatCard label="People" value={formatCount(t?.people)} icon={Users} loading={ovLoading} />
        <StatCard label="Approval rate" value={formatPercent(t?.approvalRate)} icon={TrendingUp} tone="green" loading={ovLoading} />
        <StatCard label="Requested" value={formatMoney(t?.requestedAmount)} icon={Wallet} tone="amber" loading={ovLoading} />
        <StatCard label="Approved amount" value={formatMoney(t?.approvedAmount)} icon={Banknote} tone="green" loading={ovLoading} />
        <StatCard label="Avg. decision time" value={formatHours(t?.averageDecisionHours)} icon={Clock} loading={ovLoading} />
        <StatCard label="Repeat applicants" value={formatCount(t?.repeatApplicants)} icon={Repeat} loading={ovLoading} />
        <StatCard label="Average amount" value={formatMoney(t?.averageAmount)} icon={Wallet} loading={ovLoading} />
        <StatCard label="Largest amount" value={formatMoney(t?.largestAmount)} icon={CheckCircle2} loading={ovLoading} />
      </div>

      <Card title="Applications over time">
        {ovLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <TimeseriesChart points={overview?.timeseries ?? []} granularity={range.granularity} />
        )}
      </Card>

      {/* Breakdowns */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="By status">
          {ovLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <BreakdownBars
              items={(Object.keys(statusLabels) as (keyof typeof statusLabels)[]).map((s) => ({
                key: s,
                label: statusLabels[s],
                value: t?.byStatus[s] ?? 0,
                color: statusColors[s],
              }))}
              emptyMessage="No applications in this period."
            />
          )}
        </Card>

        <Card title="By program">
          {ovLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <BreakdownBars
              items={(overview?.byProgram ?? []).map((p) => ({
                key: p.programSlug,
                label: p.programName,
                value: p.applications,
                hint: `${formatPercent(p.approvalRate)} approved`,
              }))}
              emptyMessage="No applications in this period."
            />
          )}
        </Card>

        <Card title="By source">
          {ovLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <BreakdownBars
              items={[
                {
                  key: "agent",
                  label: "Through agents",
                  value: overview?.bySource.agent.applications ?? 0,
                  hint: `${formatPercent(overview?.bySource.agent.approvalRate)} approved`,
                  color: "bg-blue-500",
                },
                {
                  key: "direct",
                  label: "Direct",
                  value: overview?.bySource.direct.applications ?? 0,
                  hint: `${formatPercent(overview?.bySource.direct.approvalRate)} approved`,
                },
              ]}
              emptyMessage="No applications in this period."
            />
          )}
        </Card>
      </div>

      {/* Backlog, agents, accounts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Review backlog (right now)">
          {ovLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : overview ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Pending</dt>
                <dd className="font-semibold text-ink">{formatCount(overview.backlog.pending)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Under review</dt>
                <dd className="font-semibold text-ink">{formatCount(overview.backlog.underReview)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <dt className="text-slate-600">Oldest pending</dt>
                <dd className="font-semibold text-ink">
                  {overview.backlog.oldestPendingAt ? timeAgo(overview.backlog.oldestPendingAt) : "None"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">Not available yet.</p>
          )}
        </Card>

        <Card title="Agents">
          {ovLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : overview ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Total</dt>
                <dd className="font-semibold text-ink">{formatCount(overview.agents.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Active / suspended</dt>
                <dd className="font-semibold text-ink">
                  {formatCount(overview.agents.active)} / {formatCount(overview.agents.suspended)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <dt className="text-slate-600">Active in this period</dt>
                <dd className="font-semibold text-ink">{formatCount(overview.agents.activeInRange)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">Not available yet.</p>
          )}
        </Card>

        <Card title="Accounts">
          {ovLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : overview ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Total accounts</dt>
                <dd className="font-semibold text-ink">{formatCount(overview.accounts.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Users / agents / admins</dt>
                <dd className="font-semibold text-ink">
                  {formatCount(overview.accounts.users)} / {formatCount(overview.accounts.agents)} /{" "}
                  {formatCount(overview.accounts.admins)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <dt className="text-slate-600">New in this period</dt>
                <dd className="font-semibold text-ink">{formatCount(overview.accounts.newInRange)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">Not available yet.</p>
          )}
        </Card>
      </div>

      {/* Agent leaderboard */}
      <Card title="Agent leaderboard">
        <ErrorNotice message={agError} />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {agentsData ? (
            <p className="text-sm text-slate-600">
              {formatCount(agentsData.summary.agentsWithActivity)} of{" "}
              {formatCount(agentsData.summary.totalAgents)} agents registered someone ·{" "}
              {formatCount(agentsData.summary.agentsWithoutActivity)} with no activity ·{" "}
              {agentsData.summary.averagePerActiveAgent === null
                ? "—"
                : agentsData.summary.averagePerActiveAgent.toFixed(1)}{" "}
              applications per active agent
            </p>
          ) : (
            <span />
          )}
          <select
            value={agentStatus}
            onChange={(e) => setAgentStatus(e.target.value as "" | "active" | "suspended")}
            className={selectClass}
          >
            <option value="">All agents</option>
            <option value="active">Active only</option>
            <option value="suspended">Suspended only</option>
          </select>
        </div>

        {agLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !agentsData || agentsData.agents.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Not available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">#</th>
                  {leaderboardColumns.map((c) => (
                    <th key={c.key} className="py-2 pr-4 font-medium">
                      <button
                        onClick={() => toggleSort(c.key, c.defaultOrder)}
                        className={cn(
                          "uppercase tracking-wide hover:text-ink",
                          sort === c.key && "text-brand-700"
                        )}
                      >
                        {c.label}
                        {sort === c.key ? (order === "asc" ? " ↑" : " ↓") : ""}
                      </button>
                    </th>
                  ))}
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agentsData.agents.map((a) => (
                  <tr key={a.agentId}>
                    <td className="py-3 pr-3 text-slate-500">{a.rank}</td>
                    <td className="py-3 pr-4">
                      <Link href={`/admin/agents/${a.agentId}`} className="font-medium text-brand-700 hover:underline">
                        {a.name}
                      </Link>
                      <p className="text-xs text-slate-500">{a.code}</p>
                    </td>
                    <td className="py-3 pr-4">{formatCount(a.applications)}</td>
                    <td className="py-3 pr-4">{formatCount(a.people)}</td>
                    <td className="py-3 pr-4">{formatCount(a.byStatus.approved)}</td>
                    <td className="py-3 pr-4">{formatPercent(a.approvalRate)}</td>
                    <td className="py-3 pr-4">{formatMoney(a.requestedAmount)}</td>
                    <td className="py-3 pr-4">{formatMoney(a.approvedAmount)}</td>
                    <td className="py-3 pr-4 text-slate-600">{formatDate(a.lastRegisteredAt)}</td>
                    <td className="py-3">
                      <AgentStatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Answers breakdown */}
      <Card title="Answers breakdown">
        <p className="mb-4 text-sm text-slate-600">
          See how applicants answered a question, for example school, class or repayment weeks.
        </p>

        <div className="flex flex-wrap gap-3">
          <select
            value={answersProgram}
            onChange={(e) => {
              setAnswersProgram(e.target.value);
              setAnswersField("");
              setAnswers(null);
            }}
            className={selectClass}
          >
            <option value="">Choose a program</option>
            {programs.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={answersField}
            onChange={(e) => setAnswersField(e.target.value)}
            disabled={!answersProgram}
            className={`${selectClass} disabled:bg-slate-50`}
          >
            <option value="">Choose a question</option>
            {pickableFields.map((f) => (
              <option key={f.name} value={f.name}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6">
          <ErrorNotice message={anError} />
          {!answersProgram || !answersField ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Choose a program and a question to see the breakdown.
            </p>
          ) : anLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : answers ? (
            <div>
              <p className="mb-4 text-sm text-slate-600">
                <span className="font-medium text-ink">{answers.label}</span> ·{" "}
                {formatCount(answers.total)} answers
              </p>
              <BreakdownBars
                items={answers.breakdown.map((b) => ({
                  key: String(b.value),
                  label: b.label,
                  value: b.count,
                }))}
                emptyMessage="No answers in this period."
              />
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}