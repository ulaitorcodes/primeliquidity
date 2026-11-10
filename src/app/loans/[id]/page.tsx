"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth/use-session";

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-brand-600" />
    </div>
  );
}

function LoanRedirect() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/loans/${id}`)}`);
      return;
    }
    const target =
      user.role === "admin"
        ? `/admin/finance/loans/${id}`
        : user.role === "agent"
          ? `/agent/loans/${id}`
          : `/dashboard/loans/${id}`;
    router.replace(target);
  }, [loading, user, id, router]);

  return <Spinner />;
}

/**
 * The reminder emails link to /loans/<id>. useParams() needs a Suspense boundary so Next
 * can prerender around it, so the redirect logic lives in LoanRedirect.
 */
export default function LoanLinkPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LoanRedirect />
    </Suspense>
  );
}