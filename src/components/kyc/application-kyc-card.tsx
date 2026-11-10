"use client";

import { useCallback } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { ApplicationDetail } from "@/lib/api/applications";
import { listKycProfiles, type KycStatus } from "@/lib/api/kyc";
import { useLoad } from "@/lib/use-load";
import { KycStatusBadge } from "@/components/kyc/kyc-status-badge";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";

export function ApplicationKycCard({ application }: { application: ApplicationDetail }) {
  const email = application.applicantEmail.toLowerCase();
  const loader = useCallback(() => listKycProfiles({ search: application.applicantEmail }), [application.applicantEmail]);
  const { data, loading, error } = useLoad(loader);

  const profile = (data ?? []).find((k) => k.email.toLowerCase() === email) ?? null;
  const status: KycStatus = profile?.status ?? "not_started";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <BadgeCheck size={18} className="text-brand-600" /> KYC
        </h2>
        {profile?.id && (
          <Link href={`/admin/kyc/${profile.id}`} className={buttonClass("outline")}>
            Review KYC
          </Link>
        )}
      </div>

      <div className="mt-4">
        <ErrorNotice message={error} />
        {loading && data === null ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <div className="space-y-2">
            <KycStatusBadge status={status} />
            <p className="text-sm text-slate-600">
              {status === "approved"
                ? "KYC is approved, so this application can be approved."
                : "KYC must be approved before this application can be approved."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}