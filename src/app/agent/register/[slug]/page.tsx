"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getMyAgent } from "@/lib/api/agents";
import { getPrefill, type Prefill } from "@/lib/api/prefill";
import type { Agent } from "@/lib/api/types";
import { usePrograms } from "@/lib/programs/programs-context";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { ErrorNotice } from "@/components/ui/error-notice";
import { inputClass } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AgentRegisterFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getProgram, loading: programsLoading } = usePrograms();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [emailInput, setEmailInput] = useState("");
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getMyAgent()
      .then(setAgent)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load your profile")
      );
  }, []);

  async function lookup() {
    const email = emailInput.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setLookupMsg({ ok: false, text: "Enter a valid email address." });
      return;
    }
    setLookupBusy(true);
    setLookupMsg(null);
    try {
      const p = await getPrefill(slug, email);
      setPrefill(p);
      setFormKey((k) => k + 1);
      const n = Object.keys(p.answers).length;
      setLookupMsg({
        ok: true,
        text:
          n > 0
            ? `Filled in ${n} detail${n === 1 ? "" : "s"} for ${email}. Check them with the applicant.`
            : `Nothing on file for ${email} yet. Fill in the form as usual.`,
      });
    } catch (err) {
      setLookupMsg({
        ok: false,
        text: err instanceof Error ? err.message : "Couldn't look up that email.",
      });
    } finally {
      setLookupBusy(false);
    }
  }

  function reset() {
    setPrefill(null);
    setEmailInput("");
    setLookupMsg(null);
    setSubmitted(false);
    setFormKey((k) => k + 1);
  }

  const program = getProgram(slug);
  const loading = programsLoading || (agent === null && error === null);

  const back = (
    <Link
      href="/agent/register"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-ink"
    >
      <ArrowLeft size={16} /> All programs
    </Link>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  const notAllowed =
    !!agent &&
    !!program &&
    agent.allowedPrograms.length > 0 &&
    !agent.allowedPrograms.includes(program.slug);

  if (error || !program || program.status !== "live" || notAllowed) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {back}
        <ErrorNotice
          message={
            error ??
            (notAllowed
              ? "You are not allowed to register applicants for this program."
              : !program
                ? "Program not found."
                : "This program isn't accepting applications yet.")
          }
        />
        <Link href="/agent/register" className={buttonClass("outline")}>
          Choose another program
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {back}
      <div>
        <p className="text-sm font-semibold text-brand-600">{program.name}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Register an applicant</h1>
      </div>

      {!submitted && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-ink">Already on Prime Liquidity?</h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter the person's email to fill in details we already have for them.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="their@email.com"
              className={cn(inputClass, "max-w-sm flex-1")}
            />
            <button onClick={lookup} disabled={lookupBusy} className={buttonClass("outline")}>
              {lookupBusy ? <Loader2 size={16} className="animate-spin" /> : "Load details"}
            </button>
            {prefill && (
              <button onClick={reset} className={buttonClass("ghost")}>
                Clear
              </button>
            )}
          </div>
          {lookupMsg && (
            <p className={cn("mt-2 text-sm", lookupMsg.ok ? "text-emerald-700" : "text-red-600")}>
              {lookupMsg.text}
            </p>
          )}
        </section>
      )}

      <DynamicForm
        key={formKey}
        program={program}
        mode="agent"
        prefill={prefill ?? undefined}
        onSubmitted={() => setSubmitted(true)}
        onRegisterAnother={reset}
      />
    </div>
  );
}