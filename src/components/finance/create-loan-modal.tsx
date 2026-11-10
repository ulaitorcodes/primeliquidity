"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { ApplicationDetail } from "@/lib/api/applications";
import { createLoan, quoteLoan } from "@/lib/api/finance";
import type { LoanDetail, LoanTerms, PeriodUnit, Plan } from "@/lib/api/finance-types";
import { ApiError } from "@/lib/api/http";
import { listMerchants } from "@/lib/api/merchants";
import { formatMoneyExact } from "@/lib/format";
import { parseMoneyInput } from "@/lib/money";
import type { Program } from "@/lib/programs/types";
import { useLoad } from "@/lib/use-load";
import { PlanScheduleTable } from "@/components/finance/schedule-table";
import { ErrorNotice } from "@/components/ui/error-notice";
import { FormField, inputClass } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { buttonClass } from "@/components/ui/button";

interface QuoteInputs {
  invoiceAmount: string;
  depositPercent?: number;
  periods?: number;
  terms?: LoanTerms;
}

const loadVerifiedMerchants = () => listMerchants({ status: "verified" });

/** The merchant the applicant picked in the form (a merchant-backed select), if any. */
function chosenMerchant(application: ApplicationDetail, program: Program | undefined) {
  if (!program) return null;
  for (const section of program.sections) {
    for (const f of section.fields) {
      if (f.optionsSource?.type !== "merchants") continue;
      const v = application.answers[f.name];
      if (typeof v !== "string" || !v) continue;
      // A fixed option such as "My school is not listed" isn't a merchant
      if (f.options?.some((o) => o.value === v)) continue;
      return {
        id: v.toLowerCase(),
        name: application.answerLabels?.[f.name] ?? "the merchant the applicant chose",
      };
    }
  }
  return null;
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "brand" }) {
  return (
    <div className={tone === "brand" ? "rounded-xl bg-brand-50 p-4" : "rounded-xl bg-slate-50 p-4"}>
      <p className={tone === "brand" ? "text-xs uppercase tracking-wide text-brand-700" : "text-xs uppercase tracking-wide text-slate-500"}>
        {label}
      </p>
      <p className={tone === "brand" ? "mt-1 text-lg font-bold text-brand-900" : "mt-1 text-lg font-bold text-ink"}>
        {value}
      </p>
    </div>
  );
}

export function CreateLoanModal({
  application,
  program,
  onClose,
  onCreated,
}: {
  application: ApplicationDetail;
  program: Program | undefined;
  onClose: () => void;
  onCreated: (loan: LoanDetail) => void;
}) {
  const calc = program?.calculator;
  // Prefill from the application using the program's own field names
  const amountAnswer = calc ? application.answers[calc.amountField] : undefined;
  const weeksAnswer = calc ? application.answers[calc.weeksField] : undefined;

  const merchants = useLoad(loadVerifiedMerchants);
  const chosen = chosenMerchant(application, program);
  const verifiedList = merchants.data ?? [];
  const chosenMatch = chosen
    ? verifiedList.find((m) => m.id.toLowerCase() === chosen.id)
    : undefined;

  const [invoice, setInvoice] = useState(amountAnswer !== undefined ? String(amountAnswer) : "");
  const [depositPercent, setDepositPercent] = useState("");
  const [periods, setPeriods] = useState(weeksAnswer !== undefined ? String(weeksAnswer) : "");
  // null = untouched, so the applicant's own choice is used
  const [merchantPick, setMerchantPick] = useState<string | null>(null);
  const [overrideTerms, setOverrideTerms] = useState(false);
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>("week");
  const [feePercent, setFeePercent] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [quotedKey, setQuotedKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"quote" | "create" | null>(null);

  const merchantId = merchantPick ?? chosenMatch?.id ?? "";

  // Without a standard calculator we treat the program as having no fixed pricing
  const termsRequired = !calc;
  const showTerms = termsRequired || overrideTerms;

  function collect(): { inputs: QuoteInputs | null; errors: Record<string, string> } {
    const errs: Record<string, string> = {};

    const inv = parseMoneyInput(invoice);
    if (inv.error) errs.invoiceAmount = inv.error;
    else if (!inv.value) errs.invoiceAmount = "Enter the invoice amount";

    let depositNum: number | undefined;
    if (depositPercent.trim()) {
      const d = depositPercent.trim();
      if (!/^\d+(\.\d+)?$/.test(d) || Number(d) > 100) {
        errs.depositPercent = "Enter a percentage between 0 and 100";
      } else depositNum = Number(d);
    }

    let periodsNum: number | undefined;
    if (periods.trim()) {
      const n = Number(periods);
      if (!Number.isInteger(n) || n < 1) errs.periods = "Enter a whole number of periods";
      else periodsNum = n;
    }

    let terms: LoanTerms | undefined;
    if (showTerms) {
      const f = feePercent.trim();
      if (!/^\d+(\.\d+)?$/.test(f) || Number(f) > 100) {
        errs.feePercentPerPeriod = "Enter the service charge % per period, e.g. 2.5";
      } else {
        terms = { periodUnit, feePercentPerPeriod: Number(f) };
      }
    }

    if (Object.keys(errs).length) return { inputs: null, errors: errs };
    return {
      inputs: {
        invoiceAmount: inv.value ?? "",
        depositPercent: depositNum,
        periods: periodsNum,
        terms,
      },
      errors: {},
    };
  }

  const current = collect();
  const currentKey = current.inputs ? JSON.stringify(current.inputs) : null;
  const quoteIsFresh = !!plan && !!currentKey && quotedKey === currentKey;

  function handleApiError(err: unknown) {
    if (err instanceof ApiError) {
      const fe: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(err.fieldErrors)) if (msgs[0]) fe[key] = msgs[0];
      setErrors(fe);
      setFormError(err.message);
    } else {
      setFormError("Something went wrong. Please try again.");
    }
  }

  async function handleQuote() {
    setFormError(null);
    const { inputs, errors: errs } = collect();
    setErrors(errs);
    if (!inputs) return;

    setBusy("quote");
    try {
      setPlan(await quoteLoan({ programSlug: application.programSlug, ...inputs }));
      setQuotedKey(JSON.stringify(inputs));
    } catch (err) {
      handleApiError(err);
    } finally {
      setBusy(null);
    }
  }

  async function handleCreate() {
    if (!quoteIsFresh || !current.inputs || busy) return;
    setFormError(null);
    setBusy("create");
    try {
      const loan = await createLoan({
        applicationId: application.id,
        ...current.inputs,
        // Left out, the server uses the merchant the applicant chose; an explicit one wins
        merchantId: merchantId || undefined,
      });
      onCreated(loan);
    } catch (err) {
      handleApiError(err);
      setBusy(null);
    }
  }

  const merchantsReady = !merchants.loading || merchants.data !== null;
  const merchantHelper = chosen
    ? merchantPick === null
      ? chosenMatch
        ? `Chosen by the applicant: ${chosen.name}. You can change it.`
        : merchantsReady
          ? `The applicant chose ${chosen.name}, who isn't verified (or was suspended). Verify them under Finance, then Merchants, or pick another.`
          : undefined
      : undefined
    : "Only verified merchants are listed. You can also assign one later.";

  return (
    <Modal open onClose={onClose} title="Create loan" wide>
      <p className="text-sm text-slate-600">
        For <span className="font-medium text-ink">{application.applicantName}</span> ·{" "}
        {application.reference}. The applicant pays a deposit first, and the rest of the invoice is financed.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FormField
          label="Invoice amount (₦)"
          required
          error={errors.invoiceAmount}
          helper="The full amount the merchant is owed."
        >
          <input
            inputMode="decimal"
            className={inputClass}
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            placeholder="0.00"
          />
        </FormField>
        <FormField
          label="Deposit (%)"
          error={errors.depositPercent}
          helper="Leave blank to use the program's default."
        >
          <input
            inputMode="decimal"
            className={inputClass}
            value={depositPercent}
            onChange={(e) => setDepositPercent(e.target.value)}
            placeholder="e.g. 30"
          />
        </FormField>
        <FormField
          label="Number of periods"
          error={errors.periods}
          helper="Leave blank to use the application's value."
        >
          <input
            inputMode="numeric"
            className={inputClass}
            value={periods}
            onChange={(e) => setPeriods(e.target.value)}
          />
        </FormField>
        <FormField label="Merchant" error={errors.merchantId} helper={merchantHelper}>
          <select
            className={inputClass}
            value={merchantId}
            onChange={(e) => setMerchantPick(e.target.value)}
            disabled={merchants.loading && merchants.data === null}
          >
            <option value="">
              {chosen && !chosenMatch ? `Applicant's choice (${chosen.name})` : "Assign later"}
            </option>
            {verifiedList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="mt-4">
        {termsRequired ? (
          <p className="text-sm text-slate-600">
            No standard pricing is configured for this program, so enter the terms for this loan.
          </p>
        ) : (
          <label className="flex items-center gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={overrideTerms}
              onChange={(e) => setOverrideTerms(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-brand-600"
            />
            Override the program's standard pricing for this loan
          </label>
        )}

        {showTerms && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <FormField label="Period" required>
              <select
                className={inputClass}
                value={periodUnit}
                onChange={(e) => setPeriodUnit(e.target.value as PeriodUnit)}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </FormField>
            <FormField
              label="Service charge (% per period)"
              required
              error={errors.feePercentPerPeriod ?? errors.terms}
            >
              <input
                inputMode="decimal"
                className={inputClass}
                value={feePercent}
                onChange={(e) => setFeePercent(e.target.value)}
                placeholder="2.5"
              />
            </FormField>
          </div>
        )}
      </div>

      <div className="mt-4">
        <ErrorNotice message={formError} />
      </div>

      {plan && (
        <div className="mt-5 space-y-4">
          {!quoteIsFresh && (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              The details changed since this quote. Get a new quote before creating the loan.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <Tile label="Invoice total" value={formatMoneyExact(plan.invoiceTotal)} />
            <Tile
              label={`Deposit${plan.depositPercent !== undefined ? ` (${plan.depositPercent}%)` : ""}`}
              value={formatMoneyExact(plan.depositAmount)}
            />
            <Tile label="Financed" value={formatMoneyExact(plan.principal)} />
            <Tile label="Service charge" value={formatMoneyExact(plan.totalFee)} />
            <Tile label="Total repayable" value={formatMoneyExact(plan.totalRepayable)} tone="brand" />
          </div>
          <p className="text-xs text-slate-500">
            {plan.periods} {plan.periodUnit}ly installments at {plan.feePercentPerPeriod}% per {plan.periodUnit},
            calculated on the financed amount only.
          </p>
          <PlanScheduleTable schedule={plan.schedule} />
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className={buttonClass("ghost")}>
          Cancel
        </button>
        <button onClick={handleQuote} disabled={busy !== null} className={buttonClass("outline")}>
          {busy === "quote" ? <Loader2 size={16} className="animate-spin" /> : plan ? "Update quote" : "Get quote"}
        </button>
        <button
          onClick={handleCreate}
          disabled={!quoteIsFresh || busy !== null}
          className={buttonClass("primary")}
        >
          {busy === "create" ? <Loader2 size={16} className="animate-spin" /> : "Create loan"}
        </button>
      </div>
    </Modal>
  );
}