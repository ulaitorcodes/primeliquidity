"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth/use-session";
import { homeForRole } from "@/lib/auth/routes";
import type { Role } from "@/lib/api/session";

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-brand-600" />
    </div>
  );
}

function Guard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { user, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = !!user && user.role === role;

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (user.role !== role) router.replace(homeForRole(user.role));
  }, [loading, user, role, router, pathname]);

  if (loading || !allowed) return <Spinner />;

  return <>{children}</>;
}

/**
 * usePathname() needs a Suspense boundary so Next can prerender around it,
 * so the guard is wrapped here and the layouts don't have to care.
 */
export function AuthGuard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Spinner />}>
      <Guard role={role}>{children}</Guard>
    </Suspense>
  );
}