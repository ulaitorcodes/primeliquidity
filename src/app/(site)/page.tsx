import Link from "next/link";
import { ArrowRight, BadgeCheck, ClipboardList, HandCoins, Search } from "lucide-react";
import { fetchPrograms } from "@/lib/api/programs";
import type { Program } from "@/lib/programs/types";
import { ProgramCard } from "@/components/programs/program-card";
import { buttonClass } from "@/components/ui/button";

const steps = [
  { icon: Search, title: "Choose a program", text: "Pick the financing program that fits your need." },
  { icon: ClipboardList, title: "Apply online", text: "Fill a short form made for that program." },
  { icon: BadgeCheck, title: "Get approved", text: "We review, verify and confirm your terms." },
  { icon: HandCoins, title: "Pay over time", text: "We pay the supplier. You repay in installments." },
];

export default async function HomePage() {
  const programs = await fetchPrograms().catch((): Program[] => []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
              Trade & asset financing
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink sm:text-6xl">
              Get it today.
              <br />
              <span className="text-brand-600">Pay over time.</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              Prime Liquidity connects you with verified suppliers and structures
              your payment over an agreed period, so you never have to pay
              everything upfront.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/programs" className={buttonClass("primary", "lg")}>
                Explore programs <ArrowRight size={18} />
              </Link>
              <Link href="/#how-it-works" className={buttonClass("outline", "lg")}>
                How it works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-ink">Our programs</h2>
          <p className="mt-2 text-slate-600">
            Each program is built for a specific need, with its own application and terms.
          </p>
        </div>
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

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-ink">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <s.icon size={22} />
                </span>
                <p className="mt-4 text-xs font-semibold text-brand-600">STEP {i + 1}</p>
                <h3 className="mt-1 font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl bg-brand-900 px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-lg text-brand-100">
            Choose a program and apply in minutes.
          </p>
          <Link
            href="/programs"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-medium text-brand-900 hover:bg-brand-50"
          >
            Choose a program <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}