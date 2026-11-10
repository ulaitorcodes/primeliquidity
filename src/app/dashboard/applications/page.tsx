"use client";

import { useState } from "react";
import { useApplications } from "@/lib/api/use-applications";
import { ApplicationsTable } from "@/components/dashboard/applications-table";
import {
  matchesFilter,
  StatusTabs,
  type StatusFilter,
} from "@/components/dashboard/status-tabs";
import { ErrorNotice } from "@/components/ui/error-notice";

export default function MyApplicationsPage() {
  const { applications, loading, error } = useApplications();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = applications.filter((a) => matchesFilter(a.status, filter));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Applications</h1>
        <p className="text-sm text-slate-600">Track every application you've submitted.</p>
      </div>

      <ErrorNotice message={error} />

      <StatusTabs value={filter} onChange={setFilter} applications={applications} />

      <ApplicationsTable
        applications={filtered}
        loading={loading}
        detailHref={(a) => `/dashboard/applications/${a.id}`}
        emptyMessage="No applications match this filter."
      />
    </div>
  );
}