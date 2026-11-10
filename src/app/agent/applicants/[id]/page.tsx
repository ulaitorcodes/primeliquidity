"use client";

import { useParams } from "next/navigation";
import { ApplicationDetailView } from "@/components/dashboard/application-detail";

export default function AgentApplicantDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <ApplicationDetailView
      id={id}
      backHref="/agent/applicants"
      backLabel="Back to my applicants"
    />
  );
}