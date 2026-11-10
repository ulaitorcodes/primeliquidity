"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { listAgents } from "@/lib/api/agents";
import type { Agent } from "@/lib/api/types";
import { formatCount, formatDate, formatPercent } from "@/lib/format";
import { usePrograms } from "@/lib/programs/programs-context";
import { AgentFormModal } from "@/components/agents/agent-form-modal";
import { AgentStatusBadge } from "@/components/agents/agent-status-badge";
import { TemporaryPasswordModal } from "@/components/agents/temporary-password-modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

type StatusFilter = "all" | "active" | "suspended";

export default function AdminAgentsPage() {
  const toast = useToast();
  const { getProgram } = usePrograms();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [created, setCreated] = useState<{ name: string; password: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAgents({ status: status === "all" ? "" : status })
      .then((list) => {
        if (!cancelled) {
          setAgents(list);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load agents");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const q = query.trim().toLowerCase();
  const visible = agents.filter(
    (a) =>
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q)
  );

  function handleCreated(agent: Agent) {
    setShowCreate(false);
    toast.success(`Agent ${agent.name} created`);
    if (status !== "suspended") setAgents((prev) => [agent, ...prev]);
    if (agent.temporaryPassword) {
      setCreated({ name: agent.name, password: agent.temporaryPassword });
    }
  }

  function programsLabel(agent: Agent) {
    if (agent.allowedPrograms.length === 0) return "All programs";
    return agent.allowedPrograms.map((s) => getProgram(s)?.name ?? s).join(", ");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Agents</h1>
          <p className="text-sm text-slate-600">Manage the agents who register applicants.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={buttonClass("primary")}>
          <Plus size={16} /> New agent
        </button>
      </div>

      <ErrorNotice message={error} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or code"
            className={`${inputClass} w-72 pl-9`}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "suspended"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium capitalize transition-colors",
                status === s
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {agents.length === 0 ? "No agents yet. Create the first one." : "No agents match your search."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Agent</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Programs</th>
                <th className="px-5 py-3 font-medium">Applications</th>
                <th className="px-5 py-3 font-medium">People</th>
                <th className="px-5 py-3 font-medium">Approval rate</th>
                <th className="px-5 py-3 font-medium">Last registered</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">{a.name}</p>
                    <p className="text-xs text-slate-500">
                      {a.code} · {a.email}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <AgentStatusBadge status={a.status} />
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-4 text-slate-600">{programsLabel(a)}</td>
                  <td className="px-5 py-4">{formatCount(a.stats.applications)}</td>
                  <td className="px-5 py-4">{formatCount(a.stats.people)}</td>
                  <td className="px-5 py-4">{formatPercent(a.stats.approvalRate)}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(a.stats.lastRegisteredAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/agents/${a.id}`} className="font-medium text-brand-700 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <AgentFormModal onClose={() => setShowCreate(false)} onSaved={handleCreated} />
      )}

      {created && (
        <TemporaryPasswordModal
          agentName={created.name}
          password={created.password}
          onClose={() => setCreated(null)}
        />
      )}
    </div>
  );
}