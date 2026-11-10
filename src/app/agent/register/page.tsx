"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getMyAgent } from "@/lib/api/agents";
import type { Agent } from "@/lib/api/types";
import { usePrograms } from "@/lib/programs/programs-context";
import { ProgramIcon } from "@/components/programs/program-icon";
import { ErrorNotice } from "@/components/ui/error-notice";
import { CardGridSkeleton } from "@/components/ui/skeleton";

export default function AgentRegisterPage() {
  const { programs, loading: programsLoading } = usePrograms();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyAgent()
      .then(setAgent)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load your profile")
      );
  }, []);

  const ready = !programsLoading && (agent !== null || error !== null);

  // Empty allowedPrograms means every program
  const available = programs.filter(
    (p) =>
      p.status === "live" &&
      (!agent || agent.allowedPrograms.length === 0 || agent.allowedPrograms.includes(p.slug))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Register applicant</h1>
        <p className="text-sm text-slate-600">
          Choose the program you're registering someone for.
        </p>
      </div>

      <ErrorNotice message={error} />

      {!ready ? (
        <CardGridSkeleton count={2} />
      ) : available.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No programs are available for your account right now. Please contact an admin.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((p) => (
            <Link
              key={p.slug}
              href={`/agent/register/${p.slug}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100/50"
            >
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <ProgramIcon name={p.icon} />
              </span>
              <h3 className="text-lg font-semibold text-ink">{p.name}</h3>
              <p className="mt-1.5 flex-1 text-sm text-slate-600">{p.tagline}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
                Register for {p.name}
                <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}