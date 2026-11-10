import type { Metadata } from "next";
import { fetchPrograms } from "@/lib/api/programs";
import type { Program } from "@/lib/programs/types";
import { ProgramCard } from "@/components/programs/program-card";

export const metadata: Metadata = { title: "Programs" };

export default async function ProgramsPage() {
  const programs = await fetchPrograms().catch((): Program[] => []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-ink">Choose a program</h1>
      <p className="mt-3 max-w-xl text-slate-600">
        Select the program that fits your need. Each one has its own
        application form and terms.
      </p>
      {programs.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Programs are unavailable right now. Please check back shortly.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <ProgramCard key={p.slug} program={p} />
          ))}
        </div>
      )}
    </section>
  );
}