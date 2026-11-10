import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchProgram } from "@/lib/api/programs";
import { PrefilledForm } from "@/components/forms/prefilled-form";
import { buttonClass } from "@/components/ui/button";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await fetchProgram(slug).catch(() => null);
  return { title: program ? `Apply for ${program.name}` : "Apply" };
}

export default async function ApplyPage({ params }: Props) {
  const { slug } = await params;
  const program = await fetchProgram(slug);
  if (!program) notFound();

  if (program.status !== "live") {
    return (
      <section className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-ink">{program.name} is coming soon</h1>
        <p className="mt-3 text-slate-600">
          This program isn't accepting applications yet.
        </p>
        <Link href="/programs" className={buttonClass("primary", "md", "mt-6")}>
          Browse other programs
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold text-brand-600">{program.name}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
        Apply for {program.name}
      </h1>
      <p className="mt-2 mb-8 text-slate-600">{program.tagline}</p>
      <PrefilledForm program={program} />
    </section>
  );
}