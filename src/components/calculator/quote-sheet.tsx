"use client";

import { Copy, Printer } from "lucide-react";
import type { Quote } from "@/lib/api/calculator";
import { formatDay, formatMoneyExact, formatPercent } from "@/lib/format";
import { unitLabel } from "@/lib/units";
import { PlanScheduleTable } from "@/components/finance/schedule-table";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function summaryText(q: Quote) {
  const lines = [
    `Prime Liquidity quote: ${q.programName}`,
    `Invoice: ${formatMoneyExact(q.invoiceAmount)}`,
    `Deposit (${q.depositPercent}%): ${formatMoneyExact(q.depositAmount)}`,
    `Amount financed: ${formatMoneyExact(q.financedAmount)}`,
    `Service charge: ${formatMoneyExact(q.totalFee)} (${q.feePercentPerPeriod}% per ${q.periodUnit})`,
    `Installments: ${formatMoneyExact(q.installmentAmount)} x ${q.periods} ${unitLabel(q.periodUnit, q.periods)}`,
    `Total to repay: ${formatMoneyExact(q.totalRepayable)}`,
    `Total cost (deposit + repayments): ${formatMoneyExact(q.totalPayable)}`,
  ];
  if (q.firstDueOn) lines.push(`First payment due: ${formatDay(q.firstDueOn)}`);
  if (q.disclaimer) lines.push("", q.disclaimer);
  return lines.join("\n");
}

function Tile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "brand";
}) {
  return (
    <div className={cn("rounded-xl p-4", tone === "brand" ? "bg-brand-50" : "bg-slate-50")}>
      <p className={cn("text-xs uppercase tracking-wide", tone === "brand" ? "text-brand-700" : "text-slate-500")}>
        {label}
      </p>
      <p className={cn("mt-1 text-xl font-bold", tone === "brand" ? "text-brand-900" : "text-ink")}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function QuoteSheet({ quote: q, loading = false }: { quote: Quote; loading?: boolean }) {
  const toast = useToast();
  const unit = unitLabel(q.periodUnit, q.periods);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText(q));
      toast.success("Quote summary copied");
    } catch {
      toast.error("Couldn't copy. Use Print instead.");
    }
  }

  return (
    <article
      className={cn(
        "space-y-6 rounded-2xl border border-slate-200 bg-white p-6 transition-opacity print:border-0 print:p-0",
        loading && "opacity-60"
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="hidden text-sm font-semibold text-brand-700 print:block">Prime Liquidity · Loan quote</p>
          <p className="text-sm text-slate-500 print:hidden">Quote</p>
          <h2 className="text-2xl font-bold text-ink">{q.programName}</h2>
          <p className="mt-1 text-xs text-slate-500">
            Prepared {new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button onClick={copySummary} className={buttonClass("outline")}>
            <Copy size={16} /> Copy summary
          </button>
          <button onClick={() => window.print()} className={buttonClass("primary")}>
            <Printer size={16} /> Print / save as PDF
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Invoice amount" value={formatMoneyExact(q.invoiceAmount)} />
        <Tile label={`Deposit (${q.depositPercent}%)`} value={formatMoneyExact(q.depositAmount)} hint="Paid first" />
        <Tile label="Amount financed" value={formatMoneyExact(q.financedAmount)} />
        <Tile
          label="Service charge"
          value={formatMoneyExact(q.totalFee)}
          hint={`${q.feePercentPerPeriod}% per ${q.periodUnit}`}
        />
        <Tile
          label="Installment"
          value={formatMoneyExact(q.installmentAmount)}
          hint={`× ${q.periods} ${unit}`}
          tone="brand"
        />
        <Tile label="Total to repay" value={formatMoneyExact(q.totalRepayable)} hint="Financed amount + charges" />
        <Tile label="Total cost" value={formatMoneyExact(q.totalPayable)} hint="Deposit + all repayments" />
        <Tile
          label="Charges vs amount financed"
          value={formatPercent(q.feeAsPercentOfFinanced)}
          hint="Total service charge as a share of what is financed"
        />
        <Tile label="First payment due" value={q.firstDueOn ? formatDay(q.firstDueOn) : "—"} />
      </div>

      {q.usesProgramDefaults && (
        <p className="text-xs text-slate-500">This quote uses the program's standard terms.</p>
      )}

      <div>
        <h3 className="mb-3 font-semibold text-ink">Repayment schedule</h3>
        <PlanScheduleTable schedule={q.schedule} />
      </div>

      {q.disclaimer && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
          {q.disclaimer}
        </p>
      )}
    </article>
  );
}