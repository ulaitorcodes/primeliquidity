"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { KycWizard } from "@/components/kyc/kyc-wizard";

export default function AgentKycDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/agent/kyc"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to KYC
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-ink">KYC for an applicant</h1>
        <p className="text-sm text-slate-600">
          You can fill this in for them. Only they and admins can see the uploaded images.
        </p>
      </div>
      <KycWizard kycRef={id} canViewDocuments={false} onBehalf />
    </div>
  );
}