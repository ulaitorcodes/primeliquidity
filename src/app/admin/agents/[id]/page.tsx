"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, KeyRound, Pencil, ShieldCheck, ShieldOff } from "lucide-react";
import {
  activateAgent,
  getAgent,
  getAgentPerformance,
  resetAgentPassword,
} from "@/lib/api/agents";
import type { Agent, DateRange } from "@/lib/api/types";
import { useApplications } from "@/lib/api/use-applications";
import { formatCount, formatDate, formatDateTime, formatMoney, formatPercent } from "@/lib/format";
import { usePrograms } from "@/lib/programs/programs-context";
import { AgentFormModal } from "@/components/agents/agent-form-modal";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import { PerformancePanel } from "@/components/agents/performance-panel";
import { SuspendModal } from "@/components/agents/suspend-modal";
import { TemporaryPasswordModal } from "@/components/agents/temporary-password-modal";
import { ApplicationsTable } from "@/components/dashboard/applications-table";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";

export default function AdminAgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { getProgram } = usePrograms();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { applications, loading: appsLoading, error: appsError } = useApplications({ agent: id });

  // Stable function so PerformancePanel doesn't refetch on every render
  const loadPerformance = useCallback(
    (range: DateRange) => getAgentPerformance(id, range),
    [id]
  );

  useEffect(() => {
    let cancelled = false;
    getAgent(id)
      .then((a) => {
        if (!cancelled) setAgent(a);
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : "Failed to load agent");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleActivate() {
    if (!agent) return;
    setBusy(true);
    try {
      setAgent(await activateAgent(agent.id));
      toast.success("Agent activated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to activate agent");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword() {
    if (!agent) return;
    if (!window.confirm("Reset this agent's password? Their current password will stop working.")) return;
    setBusy(true);
    try {
      const updated = await resetAgentPassword(agent.id);
      setAgent(updated);
      if (updated.temporaryPassword) setTempPassword(updated.temporaryPassword);
      else toast.success("Password reset");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setBusy(false);
    }
  }

  const back = (
    <Link
      href="/admin/agents"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-ink"
    >
      <ArrowLeft size={16} /> Back to agents
    </Link>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="space-y-4">
        {back}
        <ErrorNotice message={loadError ?? "Agent not found."} />
      </div>
    );
  }

  const allowed =
    agent.allowedPrograms.length === 0
      ? "All programs"
      : agent.allowedPrograms.map((s) => getProgram(s)?.name ?? s).join(", ");

  return (
    <div className="space-y-10">
      {back}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">{agent.name}</h1>
            <AgentStatusBadge status={agent.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {agent.code} · {agent.email}
            {agent.phone ? ` · ${agent.phone}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowEdit(true)} className={buttonClass("outline")}>
            <Pencil size={16} /> Edit
          </button>
          <button disabled={busy} onClick={handleResetPassword} className={buttonClass("outline")}>
            <KeyRound size={16} /> Reset password
          </button>
          {agent.status === "active" ? (
            <button
              onClick={() => setShowSuspend(true)}
              className={buttonClass("outline", "md", "border-red-200 text-red-700 hover:bg-red-50")}
            >
              <ShieldOff size={16} /> Suspend
            </button>
          ) : (
            <button disabled={busy} onClick={handleActivate} className={buttonClass("primary")}>
              <ShieldCheck size={16} /> Activate
            </button>
          )}
        </div>
      </div>

      {agent.status === "suspended" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">
            Suspended{agent.suspendedAt ? ` on ${formatDate(agent.suspendedAt)}` : ""}
          </p>
          <p className="mt-1">{agent.suspendedReason || "No reason was recorded."}</p>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-ink">Details</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Allowed programs</dt>
            <dd className="mt-1 text-sm text-ink">{allowed}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Created</dt>
            <dd className="mt-1 text-sm text-ink">{formatDate(agent.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Last login</dt>
            <dd className="mt-1 text-sm text-ink">{formatDateTime(agent.lastLoginAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">All time</dt>
            <dd className="mt-1 text-sm text-ink">
              {formatCount(agent.stats.applications)} applications ·{" "}
              {formatCount(agent.stats.people)} people
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Approval rate</dt>
            <dd className="mt-1 text-sm text-ink">{formatPercent(agent.stats.approvalRate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Requested / approved</dt>
            <dd className="mt-1 text-sm text-ink">
              {formatMoney(agent.stats.requestedAmount)} / {formatMoney(agent.stats.approvedAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Last registered</dt>
            <dd className="mt-1 text-sm text-ink">{formatDate(agent.stats.lastRegisteredAt)}</dd>
          </div>
          {agent.notes && (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Notes</dt>
              <dd className="mt-1 whitespace-pre-line text-sm text-ink">{agent.notes}</dd>
            </div>
          )}
        </dl>
      </section>

      <PerformancePanel load={loadPerformance} />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Registered applicants</h2>
        <ErrorNotice message={appsError} />
        <ApplicationsTable
          applications={applications}
          loading={appsLoading}
          showApplicant
          detailHref={(a) => `/admin/applications/${a.id}`}
          emptyMessage="This agent hasn't registered anyone yet."
        />
      </section>

      {showEdit && (
        <AgentFormModal
          agent={agent}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setAgent(updated);
            setShowEdit(false);
            toast.success("Agent updated");
          }}
        />
      )}

      {showSuspend && (
        <SuspendModal
          agent={agent}
          onClose={() => setShowSuspend(false)}
          onDone={(updated) => {
            setAgent(updated);
            setShowSuspend(false);
            toast.success("Agent suspended");
          }}
        />
      )}

      {tempPassword && (
        <TemporaryPasswordModal
          agentName={agent.name}
          password={tempPassword}
          onClose={() => setTempPassword(null)}
        />
      )}
    </div>
  );
}