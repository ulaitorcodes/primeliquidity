"use client";

import { useState } from "react";
import Link from "next/link";
import { UserCheck } from "lucide-react";
import type { ApplicationDetail } from "@/lib/api/applications";
import { AssignAgentModal } from "@/components/agents/assign-agent-modal";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";

export function ApplicationAssignmentCard({ application }: { application: ApplicationDetail }) {
  const toast = useToast();
  const [assigned, setAssigned] = useState(application.assignedAgent);
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <UserCheck size={18} className="text-brand-600" /> Agent assignment
        </h2>
        <button onClick={() => setOpen(true)} className={buttonClass("outline")}>
          {assigned ? "Change agent" : "Assign agent"}
        </button>
      </div>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Registered by</dt>
          <dd className="mt-1 text-sm text-ink">
            {application.agent ? (
              <Link href={`/admin/agents/${application.agent.id}`} className="text-brand-700 hover:underline">
                {application.agent.name} ({application.agent.code})
              </Link>
            ) : (
              "Nobody (direct application)"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Assigned to</dt>
          <dd className="mt-1 text-sm text-ink">
            {assigned ? (
              <Link href={`/admin/agents/${assigned.id}`} className="text-brand-700 hover:underline">
                {assigned.name}
              </Link>
            ) : (
              "Not assigned"
            )}
          </dd>
        </div>
      </dl>

      {open && (
        <AssignAgentModal
          applicationIds={[application.id]}
          applicantEmail={application.applicantEmail}
          onClose={() => setOpen(false)}
          onDone={(r) => {
            setAssigned(r.agentId ? { id: r.agentId, name: r.agentName ?? "Agent" } : null);
            setOpen(false);
            toast.success(
              r.agentId
                ? `Assigned ${r.assigned} application${r.assigned === 1 ? "" : "s"}`
                : `Unassigned ${r.assigned} application${r.assigned === 1 ? "" : "s"}`
            );
          }}
        />
      )}
    </section>
  );
}