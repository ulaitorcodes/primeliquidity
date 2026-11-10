"use client";

import { useEffect, useState } from "react";
import { Search, UserCheck } from "lucide-react";
import { listAgents } from "@/lib/api/agents";
import type { Agent } from "@/lib/api/types";
import { useApplications } from "@/lib/api/use-applications";
import { usePrograms } from "@/lib/programs/programs-context";
import { AssignAgentModal } from "@/components/agents/assign-agent-modal";
import { ApplicationsTable } from "@/components/dashboard/applications-table";
import {
  matchesFilter,
  StatusTabs,
  type StatusFilter,
} from "@/components/dashboard/status-tabs";
import { ErrorNotice } from "@/components/ui/error-notice";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";

const inputClass =
  "rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export default function AdminApplicationsPage() {
  const toast = useToast();
  const { programs } = usePrograms();
  const [agents, setAgents] = useState<Agent[]>([]);
  // "all" | "direct" | <agent id>
  const [source, setSource] = useState("all");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [program, setProgram] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);

  const { applications, loading, error, refresh } = useApplications(
    source !== "all" && source !== "direct" ? { agent: source } : {}
  );

  useEffect(() => {
    listAgents()
      .then(setAgents)
      .catch(() => setAgents([])); // the filter just won't list agents
  }, []);

  const q = query.trim().toLowerCase();
  const base = applications.filter(
    (a) =>
      (program === "all" || a.programSlug === program) &&
      (source !== "direct" || a.agent === null) &&
      (!q ||
        a.applicantName.toLowerCase().includes(q) ||
        a.applicantEmail.toLowerCase().includes(q) ||
        a.reference.toLowerCase().includes(q))
  );
  const filtered = base.filter((a) => matchesFilter(a.status, filter));

  // Only act on rows that are currently visible
  const visibleSelected = filtered.filter((a) => selected.has(a.id)).map((a) => a.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Applications</h1>
        <p className="text-sm text-slate-600">Review and manage applications.</p>
      </div>

      <ErrorNotice message={error} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or reference"
            className={`${inputClass} w-72 pl-9`}
          />
        </div>
        <select value={program} onChange={(e) => setProgram(e.target.value)} className={inputClass}>
          <option value="all">All programs</option>
          {programs.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
          <option value="all">All sources</option>
          <option value="direct">Direct (no agent)</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.code})
            </option>
          ))}
        </select>
      </div>

      <StatusTabs value={filter} onChange={setFilter} applications={base} />

      {visibleSelected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-medium text-brand-900">
            {visibleSelected.length} selected
          </p>
          <div className="flex gap-2">
            <button onClick={() => setAssigning(true)} className={buttonClass("primary")}>
              <UserCheck size={16} /> Assign to agent
            </button>
            <button onClick={() => setSelected(new Set())} className={buttonClass("ghost")}>
              Clear
            </button>
          </div>
        </div>
      )}

      <ApplicationsTable
        applications={filtered}
        loading={loading}
        showApplicant
        showAgent
        selection={{
          selected,
          onToggle: (id) =>
            setSelected((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            }),
          onToggleAll: (ids, checked) =>
            setSelected((prev) => {
              const next = new Set(prev);
              ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
              return next;
            }),
        }}
        detailHref={(a) => `/admin/applications/${a.id}`}
        emptyMessage="No applications match your filters."
      />

      {assigning && (
        <AssignAgentModal
          applicationIds={visibleSelected}
          onClose={() => setAssigning(false)}
          onDone={(r) => {
            setAssigning(false);
            setSelected(new Set());
            toast.success(
              r.agentId
                ? `Assigned ${r.assigned} application${r.assigned === 1 ? "" : "s"} to ${r.agentName ?? "the agent"}`
                : `Unassigned ${r.assigned} application${r.assigned === 1 ? "" : "s"}`
            );
            void refresh();
          }}
        />
      )}
    </div>
  );
}