"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { useApplications } from "@/lib/api/use-applications";
import { ApplicationsTable } from "@/components/dashboard/applications-table";
import {
  matchesFilter,
  StatusTabs,
  type StatusFilter,
} from "@/components/dashboard/status-tabs";
import { ErrorNotice } from "@/components/ui/error-notice";
import { buttonClass } from "@/components/ui/button";

export default function AgentApplicantsPage() {
  const { applications, loading, error } = useApplications();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const base = applications.filter(
    (a) =>
      !q ||
      a.applicantName.toLowerCase().includes(q) ||
      a.applicantEmail.toLowerCase().includes(q) ||
      a.reference.toLowerCase().includes(q)
  );
  const filtered = base.filter((a) => matchesFilter(a.status, filter));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">My applicants</h1>
          <p className="text-sm text-slate-600">People you've registered and where they stand.</p>
        </div>
        <Link href="/agent/register" className={buttonClass("primary")}>
          <UserPlus size={16} /> Register applicant
        </Link>
      </div>

      <ErrorNotice message={error} />

      <div className="relative w-full max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or reference"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <StatusTabs value={filter} onChange={setFilter} applications={base} />

      <ApplicationsTable
        applications={filtered}
        loading={loading}
        showApplicant
        detailHref={(a) => `/agent/applicants/${a.id}`}
        emptyMessage="No applicants match your filters."
      />
    </div>
  );
}