"use client";

import Link from "next/link";
import { CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import { useSession } from "@/lib/auth/use-session";
import { useApplications } from "@/lib/api/use-applications";
import { usePrograms } from "@/lib/programs/programs-context";
import { DuesPanel } from "@/components/dues/dues-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { ApplicationsTable } from "@/components/dashboard/applications-table";
import { ProgramCard } from "@/components/programs/program-card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { CardGridSkeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";

export default function DashboardOverviewPage() {
  const { user } = useSession();
  const { applications, loading, error } = useApplications();
  const { programs, loading: programsLoading } = usePrograms();

  // The API already returns only this user's applications
  const pending = applications.filter((a) => a.status === "pending" || a.status === "under_review").length;
  const approved = applications.filter((a) => a.status === "approved").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            Welcome, {user?.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-600">Here's what's due and where your applications stand.</p>
        </div>
        <Link href="/programs" className={buttonClass("primary")}>
          New application
        </Link>
      </div>

      <DuesPanel
        loanHref={(loanId) => `/dashboard/loans/${loanId}`}
        showBorrower={false}
      />

      <ErrorNotice message={error} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total applications" value={applications.length} icon={FileText} loading={loading} />
        <StatCard label="Pending" value={pending} icon={Clock} tone="amber" loading={loading} />
        <StatCard label="Approved" value={approved} icon={CheckCircle2} tone="green" loading={loading} />
        <StatCard label="Rejected" value={rejected} icon={XCircle} tone="red" loading={loading} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent applications</h2>
          {applications.length > 5 && (
            <Link href="/dashboard/applications" className="text-sm font-medium text-brand-700 hover:underline">
              View all
            </Link>
          )}
        </div>
        <ApplicationsTable
          applications={applications.slice(0, 5)}
          loading={loading}
          detailHref={(a) => `/dashboard/applications/${a.id}`}
          emptyMessage="You haven't applied to any program yet."
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Available programs</h2>
        {programsLoading ? (
          <CardGridSkeleton count={3} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => (
              <ProgramCard key={p.slug} program={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}