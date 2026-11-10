import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { fetchProgram } from "@/lib/api/programs";
import { ProgramIcon } from "@/components/programs/program-icon";
import { RepaymentCalculator } from "@/components/programs/repayment-calculator";
import { buttonClass } from "@/components/ui/button";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await fetchProgram(slug).catch(() => null);
  return { title: program?.name ?? "Program" };
}

export default async function ProgramPage({ params }: Props) {
  const { slug } = await params;
  const program = await fetchProgram(slug);
  if (!program) notFound();

  const isLive = program.status === "live";

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <ProgramIcon name={program.icon} size={28} />
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            {program.name}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">{program.tagline}</p>
          {isLive ? (
            <Link
              href={`/apply/${program.slug}`}
              className={buttonClass("primary", "lg", "mt-7")}
            >
              Apply for {program.name}
            </Link>
          ) : (
            <span
              className={buttonClass("outline", "lg", "mt-7 cursor-not-allowed opacity-60")}
            >
              Coming soon
            </span>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <div>
            <h2 className="text-2xl font-semibold text-ink">About this program</h2>
            <p className="mt-3 text-slate-600">{program.description}</p>
            <ul className="mt-5 space-y-2">
              {program.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2.5 text-slate-700">
                  <Check size={18} className="text-brand-600" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-ink">How it works</h2>
            <ol className="mt-5 space-y-5">
              {program.steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-ink">{s.title}</p>
                    <p className="text-sm text-slate-600">{s.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-ink">Key terms</h3>
            <dl className="mt-4 space-y-3 text-sm">
              {program.terms.map((t) => (
                <div key={t.label} className="flex justify-between gap-4">
                  <dt className="text-slate-500">{t.label}</dt>
                  <dd className="text-right font-medium text-ink">{t.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {program.calculator && <RepaymentCalculator config={program.calculator} />}
        </aside>
      </section>
    </>
  );
}