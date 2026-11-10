"use client";

import { useEffect, useState } from "react";
import type { Program } from "@/lib/programs/types";
import { getPrefill, type Prefill } from "@/lib/api/prefill";
import { useSession } from "@/lib/auth/use-session";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { Skeleton } from "@/components/ui/skeleton";

export function PrefilledForm({ program }: { program: Program }) {
  const { user, loading } = useSession();
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const [done, setDone] = useState(false);

  const userId = user?.id ?? null;
  const role = user?.role ?? null;

  useEffect(() => {
    if (loading) return;
    if (!userId || role !== "user") {
      setDone(true);
      return;
    }
    let cancelled = false;
    getPrefill(program.slug)
      .then((p) => {
        if (!cancelled) setPrefill(p);
      })
      .catch(() => {
        // not fatal: they just fill in the form by hand
      })
      .finally(() => {
        if (!cancelled) setDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, userId, role, program.slug]);

  if (!done) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  return <DynamicForm program={program} prefill={prefill ?? undefined} />;
}