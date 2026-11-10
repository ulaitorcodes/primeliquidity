"use client";

import { useParams } from "next/navigation";
import { MyLoanDetailView } from "@/components/loans/my-loans";

export default function UserLoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <MyLoanDetailView id={id} backHref="/dashboard/loans" backLabel="Back to my loans" />;
}