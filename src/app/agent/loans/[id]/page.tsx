"use client";

import { useParams } from "next/navigation";
import { MyLoanDetailView } from "@/components/loans/my-loans";

export default function AgentLoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <MyLoanDetailView id={id} backHref="/agent/loans" backLabel="Back to loans" />;
}