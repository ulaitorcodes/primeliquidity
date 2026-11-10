"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Hourglass } from "lucide-react";
import { listAgents } from "@/lib/api/agents";
import { getMyDues, type DueItem, type DueState } from "@/lib/api/my";
import type { PayTarget } from "@/lib/api/payments";
import type { Agent } from "@/lib/api/types";
import { formatCount, formatDay, formatMoneyExact } from "@/lib/format";
import { useLoad } from "@/lib/use-load";
import { DueStateBadge } from "@/components/finance/badges";
import { PayModal } from "@/components/payments/pay-modal";
import { StatCard } from "@/components/dashboard/stat-card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VISIBLE_ROWS = 8;

const tabs: { key: "" | DueState; label: string }[] = [
  { key: "", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "due_today", label: "Due today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "pending", label: "Deposits waiting" },
];

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function dueText(i: DueItem) {
  if (i.type === "deposit") return "Awaiting deposit";
  if (i.state === "overdue") return `${plural(i.daysOverdue, "day")} overdue`;
  if (i.state === "due_today") return "Due today";
  if (i.daysUntilDue !== null && i.daysUntilDue !== undefined) return `in ${plural(i.daysUntilDue, "day")}`;
  return "";
}

function targetFor(i: DueItem): PayTarget {
  if (i.type === "deposit") return { loanId: i.loanId, purpose: "deposit" };
  return {
    loanId: i.loanId,
    purpose: "installment",
    installmentNumber: i.number ?? undefined,
  };
}

export function DuesPanel({
  loanHref,
  showBorrower = true,
  showAgentFilter = false,
}: {
  loanHref: (loanId: string) => string;
  showBorrower?: boolean;
  /** Admin only: adds an agent filter and column */
  showAgentFilter?: boolean;
}) {
  const [state, setState] = useState<"" | DueState>("");
  const [agentId, setAgentId] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [paying, setPaying] = useState<PayTarget | null>(null);

  const loader = useCallback(
    () => getMyDues({ state, agentId: showAgentFilter && agentId ? agentId : undefined }),
    [state, agentId, showAgentFilter]
  );
  const { data, loading, error, reload } = useLoad(loader);

  const agentsLoader = useCallback(
    (): Promise<Agent[]> => (showAgentFilter ? listAgents() : Promise.resolve([])),
    [showAgentFilter]
  );
  const agents = useLoad<Agent[]>(agentsLoader);

  const busy = loading && data === null;
  const s = data?.summary;
  const items = data?.items ?? [];
  const shown = expanded ? items : items.slice(0, VISIBLE_ROWS);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Due dates</h2>
        {showAgentFilter && (
          <select
            value={agentId}
            onChange={(e) => {
              setAgentId(e.target.value);
              setExpanded(false);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            aria-label="Filter by agent"
          >
            <option value="">All agents</option>
            {(agents.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.code})
              </option>
            ))}
          </select>
        )}
      </div>

      <ErrorNotice message={error} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Overdue"
          value={formatMoneyExact(s?.overdueAmount)}
          icon={AlertTriangle}
          tone="red"
          loading={busy}
          hint={s ? plural(s.overdueCount, "installment") : undefined}
        />
        <StatCard
          label="Due in the next 7 days"
          value={formatMoneyExact(s?.dueNext7DaysAmount)}
          icon={CalendarClock}
          tone="amber"
          loading={busy}
          hint={s ? plural(s.dueNext7DaysCount, "installment") : undefined}
        />
        <StatCard
          label="Deposits waiting"
          value={formatMoneyExact(s?.depositsPendingAmount)}
          icon={Hourglass}
          loading={busy}
          hint={s ? plural(s.depositsPendingCount, "deposit") : undefined}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key || "all"}
            onClick={() => {
              setState(t.key);
              setExpanded(false);
            }}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              state === t.key
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {busy ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {state === "" ? "Nothing is due. You're all caught up." : "Nothing in this view."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">What</th>
                  <th className="px-5 py-3 font-medium">Loan</th>
                  {showBorrower && <th className="px-5 py-3 font-medium">Borrower</th>}
                  {showAgentFilter && <th className="px-5 py-3 font-medium">Agent</th>}
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((i, idx) => (
                  <tr
                    key={`${i.loanId}-${i.type}-${i.number ?? "d"}-${idx}`}
                    className={cn(i.state === "overdue" ? "bg-red-50/40" : "hover:bg-slate-50/60")}
                  >
                    <td className="px-5 py-4 font-medium text-ink">
                      {i.type === "deposit" ? "Deposit" : `Installment ${i.number ?? ""}`}
                    </td>
                    <td className="px-5 py-4">
                      <Link href={loanHref(i.loanId)} className="font-medium text-brand-700 hover:underline">
                        {i.loanReference}
                      </Link>
                      <p className="text-xs text-slate-500">{i.programName}</p>
                    </td>
                    {showBorrower && <td className="px-5 py-4 text-slate-700">{i.borrowerName}</td>}
                    {showAgentFilter && (
                      <td className="px-5 py-4 text-slate-600">{i.agent?.name ?? "—"}</td>
                    )}
                    <td className="px-5 py-4">
                      <p className="text-slate-800">{i.dueOn ? formatDay(i.dueOn) : "—"}</p>
                      <p className={cn("text-xs", i.state === "overdue" ? "font-medium text-red-600" : "text-slate-500")}>
                        {dueText(i)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink">{formatMoneyExact(i.remaining)}</p>
                      {i.amountDue !== i.remaining && (
                        <p className="text-xs text-slate-500">of {formatMoneyExact(i.amountDue)}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <DueStateBadge state={i.state} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {i.canPay && (
                        <button
                          onClick={() => setPaying(targetFor(i))}
                          className={buttonClass(i.state === "overdue" ? "primary" : "outline")}
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length > VISIBLE_ROWS && (
            <button onClick={() => setExpanded((e) => !e)} className="text-sm font-medium text-brand-700 hover:underline">
              {expanded ? "Show fewer" : `Show all ${formatCount(items.length)}`}
            </button>
          )}
        </>
      )}

      {paying && (
        <PayModal
          target={paying}
          onClose={() => {
            setPaying(null);
            reload();
          }}
          onSettled={reload}
        />
      )}
    </section>
  );
}