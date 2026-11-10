"use client";

import { useParams } from "next/navigation";
import { ApplicationDetailView } from "@/components/dashboard/application-detail";
import { ApplicationAssignmentCard } from "@/components/finance/application-assignment-card";
import { ApplicationLoanCard } from "@/components/finance/application-loan-card";
import { ApplicationKycCard } from "@/components/kyc/application-kyc-card";

export default function AdminApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <ApplicationDetailView
      id={id}
      backHref="/admin/applications"
      backLabel="Back to applications"
      isAdmin
      extra={(app) => (
        <>
          <ApplicationKycCard application={app} />
          <ApplicationAssignmentCard application={app} />
          <ApplicationLoanCard application={app} />
        </>
      )}
    />
  );
}