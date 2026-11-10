"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchPrograms } from "@/lib/api/programs";
import type { Program } from "./types";

interface ProgramsContextValue {
  programs: Program[];
  loading: boolean;
  getProgram: (slug: string) => Program | undefined;
}

const ProgramsContext = createContext<ProgramsContextValue>({
  programs: [],
  loading: true,
  getProgram: () => undefined,
});

export function ProgramsProvider({ children }: { children: React.ReactNode }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPrograms()
      .then((p) => {
        if (!cancelled) setPrograms(p);
      })
      .catch(() => {
        // pages show their own empty state; names fall back to the slug
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<ProgramsContextValue>(
    () => ({
      programs,
      loading,
      getProgram: (slug) => programs.find((p) => p.slug === slug),
    }),
    [programs, loading]
  );

  return <ProgramsContext.Provider value={value}>{children}</ProgramsContext.Provider>;
}

export function usePrograms() {
  return useContext(ProgramsContext);
}