"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { getKycProfile, type Kyc } from "@/lib/api/kyc";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shown on the applicant dashboard until KYC is approved. Hidden on the KYC page itself. */
export function KycBanner() {
  const pathname = usePathname();
  const [kyc, setKyc] = useState<Kyc | null>(null);

  useEffect(() => {
    let cancelled = false;
    getKycProfile("me")
      .then((k) => {
        if (!cancelled) setKyc(k);
      })
      .catch(() => {
        if (!cancelled) setKyc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!kyc || kyc.status === "approved" || pathname.startsWith("/dashboard/kyc")) return null;

  const config = {
    not_started: {
      tone: "border-amber-200 bg-amber-50 text-amber-900",
      title: "Verify your identity",
      text: "Your KYC must be approved before a loan can be approved. It takes a few minutes.",
      cta: "Start KYC",
    },
    draft: {
      tone: "border-amber-200 bg-amber-50 text-amber-900",
      title: "Finish your KYC",
      text: "You've started but haven't submitted it yet. KYC must be approved before a loan can be approved.",
      cta: "Continue",
    },
    submitted: {
      tone: "border-blue-200 bg-blue-50 text-blue-900",
      title: "Your KYC is being reviewed",
      text: "We'll let you know when it's done.",
      cta: null,
    },
    changes_requested: {
      tone: "border-orange-200 bg-orange-50 text-orange-900",
      title: "Your KYC needs changes",
      text: kyc.reviewNote || "Open it to see what to fix.",
      cta: "Update KYC",
    },
    rejected: {
      tone: "border-red-200 bg-red-50 text-red-900",
      title: "Your KYC was rejected",
      text: kyc.reviewNote || "Please contact support.",
      cta: "View details",
    },
  }[kyc.status];

  return (
    <div className={cn("mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4", config.tone)}>
      <div className="flex items-start gap-3">
        <BadgeCheck size={20} className="mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">{config.title}</p>
          <p className="mt-0.5 whitespace-pre-line">{config.text}</p>
        </div>
      </div>
      {config.cta && (
        <Link href="/dashboard/kyc" className={buttonClass("primary")}>
          {config.cta}
        </Link>
      )}
    </div>
  );
}