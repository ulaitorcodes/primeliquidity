"use client";

import { useParams } from "next/navigation";
import { KycReview } from "@/components/kyc/kyc-review";

export default function AdminKycReviewPage() {
  const { id } = useParams<{ id: string }>();
  return <KycReview id={id} />;
}