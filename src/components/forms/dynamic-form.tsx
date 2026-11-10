"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Loader2 } from "lucide-react";
import type { FormField, Program } from "@/lib/programs/types";
import { calculateRepayment } from "@/lib/programs/calc";
import { submitApplication, type AnswerValue } from "@/lib/api/applications";
import { ApiError } from "@/lib/api/http";
import type { Prefill } from "@/lib/api/prefill";
import { useSession } from "@/lib/auth/use-session";
import { kycStatusLabels } from "@/lib/kyc-options";
import { MerchantSelect } from "@/components/forms/merchant-select";
import { buttonClass } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { cn, formatNaira } from "@/lib/utils";

type Values = Record<string, string | boolean>;

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

const sourceLabels = {
  profile: "your profile",
  previousApplication: "a previous application",
} as const;

/** Consent checkboxes and amount/duration fields are never prefilled. */
function prefillValue(f: FormField, program: Program, prefill?: Prefill): string | null {
  if (!prefill || f.type === "checkbox") return null;
  const c = program.calculator;
  if (c && (f.name === c.amountField || f.name === c.weeksField)) return null;
  const raw = prefill.answers[f.name];
  if (raw === undefined || raw === null || raw === "" || typeof raw === "boolean") return null;
  const s = String(raw);
  // A merchant-backed select holds a merchant id: its list is checked when it loads
  if (f.type === "select" && !f.optionsSource && !f.options?.some((o) => o.value === s)) return null;
  return s;
}

function initialValues(program: Program, prefill?: Prefill): Values {
  const v: Values = {};
  for (const s of program.sections) {
    for (const f of s.fields) {
      if (f.type === "checkbox") {
        v[f.name] = false;
        continue;
      }
      v[f.name] = prefillValue(f, program, prefill) ?? f.defaultValue ?? "";
    }
  }
  return v;
}

/** field name -> where it came from, for the fields that were actually prefilled */
function appliedSources(program: Program, prefill?: Prefill) {
  const out: Record<string, keyof typeof sourceLabels> = {};
  if (!prefill) return out;
  for (const s of program.sections) {
    for (const f of s.fields) {
      const source = prefill.sources[f.name];
      if (source && prefillValue(f, program, prefill) !== null) out[f.name] = source;
    }
  }
  return out;
}

function isVisible(f: FormField, v: Values) {
  return !f.showIf || v[f.showIf.field] === f.showIf.equals;
}

function validate(f: FormField, value: string | boolean): string | null {
  if (f.type === "checkbox") {
    return f.required && !value ? "This is required" : null;
  }
  const s = String(value).trim();
  if (!s) return f.required ? `${f.label} is required` : null;
  if (f.type === "email" && !/^\S+@\S+\.\S+$/.test(s))
    return "Enter a valid email address";
  if (f.type === "tel" && s.replace(/\D/g, "").length < 10)
    return "Enter a valid phone number";
  if (f.type === "number") {
    const n = Number(s);
    if (Number.isNaN(n)) return "Enter a valid number";
    if (f.min !== undefined && n < f.min)
      return `Minimum is ${f.min.toLocaleString()}`;
    if (f.max !== undefined && n > f.max)
      return `Maximum is ${f.max.toLocaleString()}`;
  }
  return null;
}

/** Numbers as numbers, checkboxes as booleans, hidden fields left out. */
function buildPayload(program: Program, values: Values) {
  const payload: Record<string, AnswerValue> = {};
  for (const section of program.sections) {
    for (const f of section.fields) {
      if (!isVisible(f, values)) continue;
      const v = values[f.name];
      if (f.type === "checkbox") {
        payload[f.name] = Boolean(v);
      } else if (f.type === "number") {
        const text = String(v).trim();
        if (text !== "") payload[f.name] = Number(text);
      } else {
        payload[f.name] = String(v).trim();
      }
    }
  }
  return payload;
}

export function DynamicForm({
  program,
  mode = "applicant",
  prefill,
  onRegisterAnother,
  onSubmitted,
}: {
  program: Program;
  /** "agent": an agent is registering someone else */
  mode?: "applicant" | "agent";
  /** Details found for this person. Read once, so remount (key) to apply new ones. */
  prefill?: Prefill;
  onRegisterAnother?: () => void;
  onSubmitted?: () => void;
}) {
  const { user } = useSession();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(() => initialValues(program, prefill));
  const [applied] = useState(() => appliedSources(program, prefill));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const section = program.sections[step];
  const isLast = step === program.sections.length - 1;
  const visibleFields = section.fields.filter((f) => isVisible(f, values));
  const appliedCount = Object.keys(applied).length;

  const estimate = useMemo(() => {
    const c = program.calculator;
    if (!c) return null;
    const amount = Number(values[c.amountField]);
    const weeks = Number(values[c.weeksField]);
    if (!amount || !weeks) return null;
    return calculateRepayment(c, amount, weeks);
  }, [program, values]);

  const showEstimate =
    !!program.calculator &&
    section.fields.some((f) => f.name === program.calculator?.amountField);

  function setValue(name: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function validateStep() {
    const next: Record<string, string> = {};
    for (const f of visibleFields) {
      const err = validate(f, values[f.name]);
      if (err) next[f.name] = err;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleServerError(err: unknown) {
    if (!(err instanceof ApiError)) {
      setFormError("Something went wrong. Please try again.");
      return;
    }

    // Map server field errors straight onto the inputs
    const fieldMessages: Record<string, string> = {};
    for (const [name, messages] of Object.entries(err.fieldErrors)) {
      if (messages[0]) fieldMessages[name] = messages[0];
    }
    setErrors(fieldMessages);

    // An "email" error at submit time is the borrowing rule (an unsettled loan),
    // not a typo: keep the person where they are and show it as the submit error.
    const jumpNames = Object.keys(fieldMessages).filter((n) => n !== "email");
    const stepIndex = program.sections.findIndex((s) =>
      s.fields.some((f) => jumpNames.includes(f.name))
    );
    if (stepIndex >= 0) {
      setStep(stepIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setFormError(err.message);
  }

  async function handleNext() {
    setFormError(null);
    if (!validateStep()) return;

    if (!isLast) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const app = await submitApplication(program.slug, buildPayload(program, values));
      setReference(app.reference);
      onSubmitted?.();
    } catch (err) {
      handleServerError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    const agentMode = mode === "agent";
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-8 text-center">
        <CheckCircle2 className="mx-auto text-brand-600" size={48} />
        <h2 className="mt-4 text-2xl font-semibold text-ink">
          {agentMode ? "Applicant registered" : "Application submitted"}
        </h2>
        <p className="mt-2 text-slate-600">
          {agentMode
            ? `The ${program.name} application has been submitted for review.`
            : `Thank you. Our team will review your ${program.name} application and get back to you.`}
        </p>
        <p className="mt-5 inline-block rounded-lg bg-white px-4 py-2 text-sm">
          Reference: <span className="font-semibold text-ink">{reference}</span>
        </p>

        {!agentMode && !user && (
          <p className="mx-auto mt-4 max-w-md text-sm text-slate-600">
            Create an account with the same email you used here to track this
            application from your dashboard.
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {agentMode ? (
            <>
              <button onClick={onRegisterAnother} className={buttonClass("primary")}>
                Register another applicant
              </button>
              <Link href="/agent/applicants" className={buttonClass("outline")}>
                My applicants
              </Link>
            </>
          ) : (
            <>
              {user ? (
                <Link href="/dashboard" className={buttonClass("primary")}>
                  Go to my dashboard
                </Link>
              ) : (
                <Link href="/register" className={buttonClass("primary")}>
                  Create an account
                </Link>
              )}
              <Link href="/programs" className={buttonClass("outline")}>
                Browse programs
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {mode === "agent" && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p>
            You're registering someone else. Enter <strong>their</strong> details, not
            yours. The application is credited to you automatically.
          </p>
        </div>
      )}

      {appliedCount > 0 && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p>
            We filled in {appliedCount} detail{appliedCount === 1 ? "" : "s"} from what we already have.
            Check them and change anything that's out of date.
          </p>
        </div>
      )}

      {prefill && prefill.kycStatus !== "approved" && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p>
            {mode === "agent" ? "KYC for this person" : "Your identity verification (KYC)"} is{" "}
            <strong>{kycStatusLabels[prefill.kycStatus].toLowerCase()}</strong>. It must be approved before the
            application can be approved.{" "}
            <Link
              href={mode === "agent" ? "/agent/kyc" : "/dashboard/kyc"}
              className="font-semibold underline"
            >
              {mode === "agent" ? "Manage KYC" : "Go to KYC"}
            </Link>
          </p>
        </div>
      )}

      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-2">
        {program.sections.map((s, i) => (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                i <= step ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "hidden text-xs font-medium sm:block",
                i === step ? "text-ink" : "text-slate-500"
              )}
            >
              {s.title}
            </span>
            {i < program.sections.length - 1 && (
              <span className={cn("h-px flex-1", i < step ? "bg-brand-600" : "bg-slate-200")} />
            )}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-ink">{section.title}</h2>
        {section.description && (
          <p className="mt-1 text-sm text-slate-600">{section.description}</p>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {visibleFields.map((f) => (
            <div key={f.name} className={cn(f.colSpan === 2 && "sm:col-span-2")}>
              {f.type === "checkbox" ? (
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(values[f.name])}
                    onChange={(e) => setValue(f.name, e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600"
                  />
                  <span>{f.label}</span>
                </label>
              ) : (
                <>
                  <label
                    htmlFor={f.name}
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    {f.label}
                    {f.required && <span className="text-red-500"> *</span>}
                    {applied[f.name] && (
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        from {sourceLabels[applied[f.name]]}
                      </span>
                    )}
                  </label>

                  {f.type === "select" ? (
                    f.optionsSource ? (
                      <MerchantSelect
                        id={f.name}
                        kind={f.optionsSource.kind}
                        value={String(values[f.name])}
                        staticOptions={f.options}
                        disabled={submitting}
                        onChange={(v) => setValue(f.name, v)}
                      />
                    ) : (
                      <select
                        id={f.name}
                        value={String(values[f.name])}
                        onChange={(e) => setValue(f.name, e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select...</option>
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )
                  ) : f.type === "textarea" ? (
                    <textarea
                      id={f.name}
                      rows={3}
                      value={String(values[f.name])}
                      placeholder={f.placeholder}
                      onChange={(e) => setValue(f.name, e.target.value)}
                      className={inputClass}
                    />
                  ) : (
                    <input
                      id={f.name}
                      type={f.type}
                      value={String(values[f.name])}
                      placeholder={f.placeholder}
                      min={f.min}
                      max={f.max}
                      onChange={(e) => setValue(f.name, e.target.value)}
                      className={inputClass}
                    />
                  )}
                </>
              )}

              {errors[f.name] ? (
                <p className="mt-1.5 text-xs text-red-600">{errors[f.name]}</p>
              ) : f.helper ? (
                <p className="mt-1.5 text-xs text-slate-500">{f.helper}</p>
              ) : null}
            </div>
          ))}
        </div>

        {showEstimate && estimate && (
          <dl className="mt-6 space-y-2 rounded-xl bg-brand-50 p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Service charge</dt>
              <dd className="font-medium text-ink">{formatNaira(estimate.serviceCharge)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Total to repay</dt>
              <dd className="font-medium text-ink">{formatNaira(estimate.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-brand-900">
                Weekly payment ({estimate.weeks} weeks)
              </dt>
              <dd className="font-bold text-brand-900">{formatNaira(estimate.weekly)}</dd>
            </div>
          </dl>
        )}

        {formError && (
          <div className="mt-6">
            <ErrorNotice message={formError} />
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className={buttonClass("ghost")}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className={buttonClass("primary")}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isLast ? (
              mode === "agent" ? "Register applicant" : "Submit application"
            ) : (
              <>
                Continue <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}