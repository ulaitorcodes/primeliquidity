import type { Metadata } from "next";
import { KycWizard } from "@/components/kyc/kyc-wizard";

export const metadata: Metadata = { title: "KYC" };

export default function UserKycPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Identity verification (KYC)</h1>
        <p className="text-sm text-slate-600">
          We need to verify who you are before a loan can be approved.
        </p>
      </div>
      <KycWizard kycRef="me" canViewDocuments />
    </div>
  );
}