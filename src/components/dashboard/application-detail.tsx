"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getApplication,
  updateApplicationStatus,
  type AnswerValue,
  type ApplicationDetail,
  type ApplicationStatus,
} from "@/lib/api/applications";
import { getMerchant } from "@/lib/api/merchants";
import { usePrograms } from "@/lib/programs/programs-context";
import type { FormField } from "@/lib/programs/types";
import { useLoad } from "@/lib/use-load";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";
import { formatDateTime, statusLabels } from "@/lib/format";
import { formatNaira } from "@/lib/utils";

const statusMessages: Record<ApplicationStatus, string> = {
  pending: "Application set to pending",
  under_review: "Application marked under review",
  approved: "Application approved",
  rejected: "Application rejected",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function displayValue(field: FormField, value: AnswerValue | undefined) {
  if (value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (field.type === "select")
    return field.options?.find((o) => o.value === String(value))?.label ?? String(value);
  if (field.name.toLowerCase().includes("amount") && !Number.isNaN(Number(value)))
    return formatNaira(Number(value));
  return String(value);
}

/** Admin only: looks the merchant up by id when no label was recorded. */
function MerchantName({ id }: { id: string }) {
  const loader = useCallback(() => getMerchant(id), [id]);
  const { data, loading } = useLoad(loader);
  if (loading && data === null) return <span className="text-slate-400">Loading...</span>;
  return <>{data?.name ?? id}</>;
}

function Answer({
  field,
  app,
  isAdmin,
}: {
  field: FormField;
  app: ApplicationDetail;
  isAdmin: boolean;
}) {
  const value = app.answers[field.name];

  if (field.optionsSource && typeof value === "string" && value) {
    // A fixed option such as "My school is not listed"
    const fixed = field.options?.find((o) => o.value === value)?.label;
    if (fixed) return <>{fixed}</>;

    // The name recorded when the applicant chose. It never changes if the merchant is
    // later renamed or suspended.
    const label = app.answerLabels?.[field.name];
    if (label) return <>{label}</>;

    // Older applications have no label: admins can still look the merchant up
    if (isAdmin && UUID_RE.test(value)) return <MerchantName id={value} />;

    return <>{value}</>;
  }

  return <>{displayValue(field, value)}</>;
}

export function ApplicationDetailView({
  id,
  backHref,
  backLabel,
  isAdmin = false,
  extra,
}: {
  id: string;
  backHref: string;
  backLabel: string;
  /** Admins can change status and see links to the agent */
  isAdmin?: boolean;
  /** Extra content rendered after the status history (e.g. the loan card) */
  extra?: (app: ApplicationDetail) => React.ReactNode;
}) {
  const { getProgram } = usePrograms();
  const toast = useToast();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getApplication(id)
      .then((a) => {
        if (!cancelled) setApp(a);
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : "Failed to load application");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function setStatus(status: ApplicationStatus) {
    if (!app) return;
    if (status === "rejected" && !window.confirm("Reject this application?")) return;

    setBusy(true);
    try {
      setApp(await updateApplicationStatus(app.id, status));
      toast.success(statusMessages[status]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-56" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="space-y-4">
        <ErrorNotice message={loadError ?? "Application not found."} />
        <Link href={backHref} className={buttonClass("outline")}>
          {backLabel}
        </Link>
      </div>
    );
  }

  const program = getProgram(app.programSlug);
  const history = [...app.statusHistory].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );

  return (
    <div className="space-y-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-ink"
      >
        <ArrowLeft size={16} /> {backLabel}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{program?.name ?? app.programSlug}</p>
          <h1 className="text-2xl font-bold text-ink">{app.reference}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusBadge status={app.status} />
            <span className="text-sm text-slate-500">
              Submitted {formatDateTime(app.submittedAt)}
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            {app.status === "pending" && (
              <button disabled={busy} onClick={() => setStatus("under_review")} className={buttonClass("outline")}>
                Mark under review
              </button>
            )}
            {app.status !== "approved" && (
              <button disabled={busy} onClick={() => setStatus("approved")} className={buttonClass("primary")}>
                Approve
              </button>
            )}
            {app.status !== "rejected" && (
              <button
                disabled={busy}
                onClick={() => setStatus("rejected")}
                className={buttonClass("outline", "md", "border-red-200 text-red-700 hover:bg-red-50")}
              >
                Reject
              </button>
            )}
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-ink">Applicant</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="mt-1 text-sm text-ink">{app.applicantName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 text-sm text-ink">{app.applicantEmail}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Source</dt>
            <dd className="mt-1 text-sm text-ink">
              {app.agent ? (
                isAdmin ? (
                  <Link href={`/admin/agents/${app.agent.id}`} className="text-brand-700 hover:underline">
                    {app.agent.name} ({app.agent.code})
                  </Link>
                ) : (
                  `${app.agent.name} (${app.agent.code})`
                )
              ) : (
                "Direct application"
              )}
            </dd>
          </div>
        </dl>
      </section>

      {program ? (
        program.sections.map((section) => {
          const fields = section.fields.filter((f) => app.answers[f.name] !== undefined);
          if (fields.length === 0) return null;
          return (
            <section key={section.id} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-ink">{section.title}</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.name}>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">
                      {f.type === "checkbox" ? "Consent" : f.label}
                    </dt>
                    <dd className="mt-1 text-sm text-ink">
                      <Answer field={f} app={app} isAdmin={isAdmin} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })
      ) : (
        // Program no longer active or not loaded: show the raw answers
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-ink">Answers</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {Object.entries(app.answers).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs uppercase tracking-wide text-slate-500">{key}</dt>
                <dd className="mt-1 text-sm text-ink">{app.answerLabels?.[key] ?? String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-ink">Status history</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No history yet.</p>
        ) : (
          <ol className="mt-4 space-y-4">
            {history.map((h) => (
              <li key={h.id} className="flex items-start gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {h.fromStatus ? (
                      <>
                        <StatusBadge status={h.fromStatus} />
                        <span className="text-slate-400">→</span>
                      </>
                    ) : (
                      <span className="text-slate-600">Submitted as</span>
                    )}
                    <StatusBadge status={h.toStatus} />
                    <span className="sr-only">{statusLabels[h.toStatus]}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(h.createdAt)}
                    {h.changedBy ? ` · ${h.changedBy}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {extra?.(app)}
    </div>
  );
}