import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Program } from "@/lib/programs/types";
import { ProgramIcon } from "./program-icon";

export function ProgramCard({ program }: { program: Program }) {
  return (
    <Link
      href={`/programs/${program.slug}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100/50"
    >
      <div className="mb-5 flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <ProgramIcon name={program.icon} />
        </span>
        {program.status === "coming-soon" && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            Coming soon
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-ink">{program.name}</h3>
      <p className="mt-1.5 flex-1 text-sm text-slate-600">{program.tagline}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
        Learn more
        <ArrowRight size={16} className="transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}