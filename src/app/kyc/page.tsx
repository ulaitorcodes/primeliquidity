"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth/use-session";

export default function KycLinkPage() {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/kyc")}`);
      return;
    }
    router.replace(
      user.role === "admin" ? "/admin/kyc" : user.role === "agent" ? "/agent/kyc" : "/dashboard/kyc"
    );
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-brand-600" />
    </div>
  );
}