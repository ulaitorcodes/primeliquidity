"use client";

import { useParams } from "next/navigation";
import { ApplicationDetailView } from "@/components/dashboard/application-detail";

export default function UserApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <ApplicationDetailView
      id={id}
      backHref="/dashboard/applications"
      backLabel="Back to applications"
    />
  );
}