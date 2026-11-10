"use client";

import Link from "next/link";
import { useApplications } from "@/lib/api/use-applications";
import { usePrograms } from "@/lib/programs/programs-context";
import { ProgramIcon } from "@/components/programs/program-icon";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ErrorNotice } from "@/components/ui/error-notice";
import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";

export default function MyProgramsPage() {
  const { applications, loading: appsLoading, error } = useApplications();
  const { programs, loading: programsLoading } = usePrograms();

  if (appsLoading || programsLoading) {
    return (
      <div className="space-y-10">
        <PageHeaderSkeleton />
        <CardGridSkeleton count={2} />
      </div>
    );
  }

  const joined = programs.filter((p) => applications.some((a) => a.programSlug === p.slug));
  const available = programs.filter((p) => !applications.some((a) => a.programSlug === p.slug));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-ink">My programs</h1>
        <p className="text-sm text-slate-600">Programs you've applied to, and others you can join.</p>
      </div>

      <ErrorNotice message={error} />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Your programs</h2>
        {joined.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            You haven't joined any program yet.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {joined.map((p) => {
              const apps = applications.filter((a) => a.programSlug === p.slug);
              const latest = apps[0];
              return (
                <div key={p.slug} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <ProgramIcon name={p.icon} size={22} />
                    </span>
                    <StatusBadge status={latest.status} />
                  </div>
                  <h3 className="mt-4 font-semibold text-ink">{p.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {apps.length} application{apps.length > 1 ? "s" : ""}
                  </p>
                  <div className="mt-5 flex gap-2">
                    <Link href="/dashboard/applications" className={buttonClass("outline")}>
                      View applications
                    </Link>
                    {p.status === "live" && (
                      <Link href={`/apply/${p.slug}`} className={buttonClass("ghost")}>
                        Apply again
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {available.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink">Available programs</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {available.map((p) => (
              <div key={p.slug} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <ProgramIcon name={p.icon} size={22} />
                </span>
                <h3 className="mt-4 font-semibold text-ink">{p.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{p.tagline}</p>
                <div className="mt-5 flex items-center gap-2">
                  {p.status === "live" ? (
                    <Link href={`/apply/${p.slug}`} className={buttonClass("primary")}>
                      Apply
                    </Link>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                      Coming soon
                    </span>
                  )}
                  <Link href={`/programs/${p.slug}`} className={buttonClass("ghost")}>
                    Learn more
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}