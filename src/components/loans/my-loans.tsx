"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMyLoan, listMyLoans, type MyLoan } from "@/lib/api/my";
import type { PayTarget } from "@/lib/api/payments";
import { formatDay, formatMoneyExact } from "@/lib/format";
import { useLoad } from "@/lib/use-load";
import { LoanStatusBadge } from "@/components/finance/badges";
import { LoanPayments } from "@/components/payments/loan-payments";
import { PayModal } from "@/components/payments/pay-modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** What the quick Pay button on a list row should pay, if anything. */
function quickPay(l: MyLoan): { target: PayTarget; label: string } | null {
  if (l.status === "approved" && (l.depositOutstanding ?? 0) > 0) {
    return { target: { loanId: l.id, purpose: "deposit" }, label: "Pay deposit" };
  }
  if (l.status === "active" && ((l.principalOutstanding ?? 0) > 0 || (l.feesOutstanding ?? 0) > 0)) {
    return {
      target: { loanId: l.id, purpose: "installment" },
      label: (l.overdueAmount ?? 0) > 0 ? "Pay overdue" : "Pay next",
    };
  }
  return null;
}

export function MyLoansList({
  basePath,
  showBorrower = false,
}: {
  basePath: string;
  showBorrower?: boolean;
}) {
  const { data, loading, error, reload } = useLoad(listMyLoans);
  const [pay, setPay] = useState<PayTarget | null>(null);
  const loans = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{showBorrower ? "Loans" : "My loans"}</h1>
        <p className="text-sm text-slate-600">
          {showBorrower
            ? "Loans for the applicants you registered or are assigned to. You can pay on their behalf."
            : "Your loans, what you owe and when it's due. You can pay straight from here."}
        </p>
      </div>

      <ErrorNotice message={error} />

      {loading && data === null ? (
        <TableSkeleton />
      ) : loans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No loans yet. A loan appears here after an application is approved and set up.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Loan</th>
                {showBorrower && <th className="px-5 py-3 font-medium">Borrower</th>}
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Financed</th>
                <th className="px-5 py-3 font-medium">Principal outstanding</th>
                <th className="px-5 py-3 font-medium">Overdue</th>
                <th className="px-5 py-3 font-medium">Next due</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.map((l) => {
                const q = quickPay(l);
                return (
                  <tr key={l.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink">{l.reference}</p>
                      <p className="text-xs text-slate-500">{l.programName}</p>
                    </td>
                    {showBorrower && <td className="px-5 py-4 text-slate-700">{l.borrowerName ?? "—"}</td>}
                    <td className="px-5 py-4">
                      <LoanStatusBadge status={l.status} />
                    </td>
                    <td className="px-5 py-4">{formatMoneyExact(l.invoiceTotal)}</td>
                    <td className="px-5 py-4">{formatMoneyExact(l.principal)}</td>
                    <td className="px-5 py-4">{formatMoneyExact(l.principalOutstanding)}</td>
                    <td className={cn("px-5 py-4", (l.overdueAmount ?? 0) > 0 && "font-medium text-red-600")}>
                      {(l.overdueAmount ?? 0) > 0 ? formatMoneyExact(l.overdueAmount) : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDay(l.nextDueOn)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-3">
                        {q && (
                          <button onClick={() => setPay(q.target)} className={buttonClass("primary")}>
                            {q.label}
                          </button>
                        )}
                        <Link href={`${basePath}/${l.id}`} className="font-medium text-brand-700 hover:underline">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pay && (
        <PayModal
          target={pay}
          onClose={() => {
            setPay(null);
            reload();
          }}
          onSettled={reload}
        />
      )}
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "red" | "green" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-bold text-ink",
          tone === "red" && "text-red-600",
          tone === "green" && "text-emerald-700"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function MyLoanDetailView({
  id,
  backHref,
  backLabel,
}: {
  id: string;
  backHref: string;
  backLabel: string;
}) {
  const loader = useCallback(() => getMyLoan(id), [id]);
  const { data: loan, loading, error, reload } = useLoad(loader);

  if (loading && loan === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="space-y-4">
        <ErrorNotice message={error ?? "Loan not found."} />
        <Link href={backHref} className={buttonClass("outline")}>
          {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-ink"
      >
        <ArrowLeft size={16} /> {backLabel}
      </Link>

      <div>
        <p className="text-sm text-slate-500">{loan.programName}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-ink">{loan.reference}</h1>
          <LoanStatusBadge status={loan.status} />
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {loan.borrowerName}
          {loan.merchant ? ` · Merchant: ${loan.merchant.name}` : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Invoice total" value={formatMoneyExact(loan.invoiceTotal)} />
        <Tile label="Deposit" value={formatMoneyExact(loan.depositAmount)} />
        <Tile label="Deposit paid" value={formatMoneyExact(loan.depositPaid)} tone="green" />
        <Tile label="Financed" value={formatMoneyExact(loan.principal)} />
        <Tile label="Service charge" value={formatMoneyExact(loan.totalFee)} />
        <Tile label="Total repayable" value={formatMoneyExact(loan.totalRepayable)} />
        <Tile label="Principal outstanding" value={formatMoneyExact(loan.principalOutstanding)} />
        <Tile
          label="Overdue"
          value={(loan.overdueAmount ?? 0) > 0 ? formatMoneyExact(loan.overdueAmount) : "None"}
          tone={(loan.overdueAmount ?? 0) > 0 ? "red" : undefined}
        />
      </div>

      <LoanPayments
        loan={{
          id,
          status: loan.status,
          schedule: loan.schedule,
          depositOutstanding: loan.depositOutstanding,
        }}
        onChanged={reload}
      />
    </div>
  );
}