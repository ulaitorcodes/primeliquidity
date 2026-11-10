"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, ShieldAlert } from "lucide-react";
import {
  approveKyc,
  getKycAudit,
  getKycIdentity,
  getKycProfile,
  rejectKyc,
  requestKycChanges,
  type KycIdentity,
} from "@/lib/api/kyc";
import { actorName, formatDateTime, humanize } from "@/lib/format";
import { documentLabels } from "@/lib/kyc-options";
import { useLoad } from "@/lib/use-load";
import { KycDetails } from "@/components/kyc/kyc-details";
import { KycImage } from "@/components/kyc/kyc-image";
import { KycStatusBadge } from "@/components/kyc/kyc-status-badge";
import { ActionModal } from "@/components/ui/action-modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";

type ModalKind = "approve" | "changes" | "reject" | "identity" | null;

function VerificationView({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <p className="text-sm text-slate-500">No verification result yet.</p>;
  }
  if (typeof value !== "object") {
    return <p className="text-sm text-ink">{String(value)}</p>;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {entries.map(([key, v]) => (
        <div key={key}>
          <dt className="text-xs uppercase tracking-wide text-slate-500">{humanize(key)}</dt>
          <dd className="mt-1 break-words text-sm text-ink">
            {typeof v === "object" && v !== null ? JSON.stringify(v) : String(v ?? "—")}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function KycReview({ id }: { id: string }) {
  const toast = useToast();
  const loader = useCallback(() => getKycProfile(id), [id]);
  const { data: kyc, loading, error, reload } = useLoad(loader);
  const auditLoader = useCallback(() => getKycAudit(id), [id]);
  const audit = useLoad(auditLoader);

  const [modal, setModal] = useState<ModalKind>(null);
  // Held in memory only. Never cached, stored or logged.
  const [identity, setIdentity] = useState<KycIdentity | null>(null);

  useEffect(() => {
    if (!identity) return;
    const t = setTimeout(() => setIdentity(null), 60_000);
    return () => clearTimeout(t);
  }, [identity]);

  function done(message: string) {
    toast.success(message);
    reload();
    audit.reload();
  }

  if (loading && kyc === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!kyc) {
    return (
      <div className="space-y-4">
        <Link href="/admin/kyc" className="text-sm font-medium text-slate-600 hover:text-ink">
          ← Back to KYC
        </Link>
        <ErrorNotice message={error ?? "KYC profile not found."} />
      </div>
    );
  }

  const canDecide = kyc.status === "submitted";

  return (
    <div className="space-y-8">
      <Link
        href="/admin/kyc"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to KYC
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">{kyc.legalName || kyc.email}</h1>
            <KycStatusBadge status={kyc.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {kyc.email}
            {kyc.submittedAt ? ` · submitted ${formatDateTime(kyc.submittedAt)}` : ""}
            {kyc.reviewedAt ? ` · reviewed ${formatDateTime(kyc.reviewedAt)}` : ""}
          </p>
        </div>

        {canDecide && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setModal("reject")}
              className={buttonClass("outline", "md", "border-red-200 text-red-700 hover:bg-red-50")}
            >
              Reject
            </button>
            <button onClick={() => setModal("changes")} className={buttonClass("outline")}>
              Request changes
            </button>
            <button onClick={() => setModal("approve")} className={buttonClass("primary")}>
              Approve
            </button>
          </div>
        )}
      </div>

      <ErrorNotice message={error} />

      {kyc.reviewNote && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review note</p>
          <p className="mt-1 whitespace-pre-line">{kyc.reviewNote}</p>
        </div>
      )}

      {!canDecide && kyc.status !== "approved" && kyc.status !== "rejected" && (
        <p className="text-sm text-slate-500">
          This profile can be approved or rejected once the person has submitted it.
        </p>
      )}

      <KycDetails kyc={kyc} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-ink">Full identity numbers</h2>
          {identity ? (
            <button onClick={() => setIdentity(null)} className={buttonClass("outline")}>
              <EyeOff size={16} /> Hide
            </button>
          ) : (
            <button onClick={() => setModal("identity")} className={buttonClass("outline")}>
              <Eye size={16} /> Reveal
            </button>
          )}
        </div>

        {identity ? (
          <div>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">BVN</dt>
                <dd className="mt-1 font-mono text-sm text-ink">{identity.bvn ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">NIN</dt>
                <dd className="mt-1 font-mono text-sm text-ink">{identity.nin ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">ID number</dt>
                <dd className="mt-1 font-mono text-sm text-ink">{identity.idNumber ?? "—"}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">Hides itself after a minute. Don't copy or share these.</p>
          </div>
        ) : (
          <p className="flex items-start gap-2 text-sm text-slate-600">
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
            Hidden by default. Every time you reveal them, it's recorded in the audit log.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Documents</h2>
        {kyc.documents.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing uploaded yet.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {kyc.documents.map((d) => (
              <figure key={d.kind}>
                <KycImage
                  kycRef={id}
                  kind={d.kind}
                  alt={documentLabels[d.kind]}
                  className="max-h-64 w-full object-contain"
                />
                <figcaption className="mt-2 text-xs text-slate-600">
                  <span className="font-medium text-ink">{documentLabels[d.kind]}</span>
                  {d.capturedLive ? " · captured live" : ""} · uploaded {formatDateTime(d.uploadedAt)}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Verification</h2>
        <VerificationView value={kyc.verification} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Audit log</h2>
        <ErrorNotice message={audit.error} />
        {audit.loading && audit.data === null ? (
          <Skeleton className="h-20 w-full" />
        ) : (audit.data ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">Not available yet.</p>
        ) : (
          <ol className="space-y-3">
            {[...(audit.data ?? [])]
              .sort((a, b) => b.at.localeCompare(a.at))
              .map((e, i) => (
                <li key={`${e.at}-${i}`} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                  <div>
                    <p className="text-ink">
                      <span className="font-medium">{humanize(e.action)}</span>
                      {e.detail ? ` · ${e.detail}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {actorName(e.actor)} · {formatDateTime(e.at)}
                    </p>
                  </div>
                </li>
              ))}
          </ol>
        )}
      </section>

      {modal === "approve" && (
        <ActionModal
          title="Approve this KYC?"
          description="Check the details and the documents first. Approval is needed before this person's loan applications can be approved."
          submitLabel="Approve"
          fields={[]}
          onClose={() => setModal(null)}
          onSubmit={async () => {
            await approveKyc(id);
            done("KYC approved");
          }}
        />
      )}

      {modal === "changes" && (
        <ActionModal
          title="Request changes"
          description="The person sees your note and can edit and resubmit."
          submitLabel="Request changes"
          fields={[{ name: "reason", label: "What needs to change?", kind: "textarea", required: true }]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await requestKycChanges(id, v.reason);
            done("Changes requested");
          }}
        />
      )}

      {modal === "reject" && (
        <ActionModal
          title="Reject this KYC?"
          description="The reason is recorded and shown to the person."
          submitLabel="Reject"
          destructive
          fields={[{ name: "reason", label: "Reason", kind: "textarea", required: true }]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await rejectKyc(id, v.reason);
            done("KYC rejected");
          }}
        />
      )}

      {modal === "identity" && (
        <ActionModal
          title="Reveal full identity numbers?"
          description="This shows the full BVN, NIN and ID number. Every reveal is logged against your account. Only continue if you need them for this review, and don't copy or share them."
          submitLabel="Show full numbers"
          fields={[]}
          onClose={() => setModal(null)}
          onSubmit={async () => {
            setIdentity(await getKycIdentity(id));
            audit.reload();
          }}
        />
      )}
    </div>
  );
}