"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, UserPlus, X } from "lucide-react";
import { getMyAgent, getMyPerformance } from "@/lib/api/agents";
import type { Agent } from "@/lib/api/types";
import { useApplications } from "@/lib/api/use-applications";
import { useSession } from "@/lib/auth/use-session";
import { formatCount, formatDate } from "@/lib/format";
import { PerformancePanel } from "@/components/agents/performance-panel";
import { DuesPanel } from "@/components/dues/dues-panel";
import { ApplicationsTable } from "@/components/dashboard/applications-table";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";

export default function AgentDashboardPage() {
  const { user } = useSession();
  const { applications, loading: appsLoading, error: appsError } = useApplications();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    getMyAgent()
      .then(setAgent)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load your profile")
      );
  }, []);

  // New agents start with a temporary password: nudge until they change it or dismiss
  useEffect(() => {
    if (!user) return;
    const changed = localStorage.getItem(`pl_pw_ok_${user.id}`);
    const dismissed = localStorage.getItem(`pl_pw_dismiss_${user.id}`);
    if (!changed && !dismissed) setShowPrompt(true);
  }, [user]);

  function dismissPrompt() {
    if (user) localStorage.setItem(`pl_pw_dismiss_${user.id}`, "1");
    setShowPrompt(false);
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            Welcome, {user?.name.split(" ")[0]}
          </h1>
          {agent ? (
            <p className="text-sm text-slate-600">
              Agent code <span className="font-semibold text-ink">{agent.code}</span> ·{" "}
              {formatCount(agent.stats.applications)} applications and{" "}
              {formatCount(agent.stats.people)} people registered all time
              {agent.stats.lastRegisteredAt
                ? ` · last registration ${formatDate(agent.stats.lastRegisteredAt)}`
                : ""}
            </p>
          ) : (
            <Skeleton className="mt-2 h-4 w-80 max-w-full" />
          )}
        </div>
        <Link href="/agent/register" className={buttonClass("primary")}>
          <UserPlus size={16} /> Register applicant
        </Link>
      </div>

      {showPrompt && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <KeyRound size={18} className="mt-0.5 shrink-0" />
          <p className="flex-1">
            If you signed in with a temporary password, please{" "}
            <Link href="/agent/account" className="font-semibold underline">
              change it now
            </Link>
            .
          </p>
          <button onClick={dismissPrompt} aria-label="Dismiss" className="text-amber-700 hover:text-amber-900">
            <X size={16} />
          </button>
        </div>
      )}

      <ErrorNotice message={error} />

      <DuesPanel loanHref={(loanId) => `/agent/loans/${loanId}`} />

      <PerformancePanel load={getMyPerformance} />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recently registered</h2>
          {applications.length > 5 && (
            <Link href="/agent/applicants" className="text-sm font-medium text-brand-700 hover:underline">
              View all
            </Link>
          )}
        </div>
        <ErrorNotice message={appsError} />
        <ApplicationsTable
          applications={applications.slice(0, 5)}
          loading={appsLoading}
          showApplicant
          detailHref={(a) => `/agent/applicants/${a.id}`}
          emptyMessage="You haven't registered anyone yet."
        />
      </section>
    </div>
  );
}