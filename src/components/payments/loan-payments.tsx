"use client";

import { useCallback, useState } from "react";
import type { LoanInstallment, LoanStatus } from "@/lib/api/finance-types";
import { ApiError } from "@/lib/api/http";
import { getPayoff, type Payoff } from "@/lib/api/my";
import { createPayment, type Payment, type PayTarget } from "@/lib/api/payments";
import { formatMoneyExact } from "@/lib/format";
import { useLoad } from "@/lib/use-load";
import { PayoffCard } from "@/components/loans/payoff-card";
import { ActionModal } from "@/components/ui/action-modal";
import { buttonClass } from "@/components/ui/button";
import { PayableScheduleTable } from "./payable-schedule";
import { PayModal } from "./pay-modal";
import { PaymentHistory } from "./payment-history";

export interface PayableLoan {
  id: string;
  status: LoanStatus;
  schedule?: LoanInstallment[];
  depositOutstanding?: number;
}

export function LoanPayments({
  loan,
  onChanged,
}: {
  loan: PayableLoan;
  /** reload the loan after a payment (or when a payment modal closes) */
  onChanged: () => void;
}) {
  const [target, setTarget] = useState<PayTarget | null>(null);
  const [resume, setResume] = useState<Payment | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const active = loan.status === "active";
  const awaitingDeposit = loan.status === "approved" && (loan.depositOutstanding ?? 0) > 0;

  const payoffLoader = useCallback(
    (): Promise<Payoff | null> => (active ? getPayoff(loan.id) : Promise.resolve(null)),
    [active, loan.id]
  );
  const payoff = useLoad<Payoff | null>(payoffLoader);

  function refreshAll() {
    onChanged();
    payoff.reload();
    setRefreshKey((k) => k + 1);
  }

  function closePayModal() {
    setTarget(null);
    setResume(null);
    refreshAll();
  }

  return (
    <div className="space-y-8">
      {awaitingDeposit && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-900">
            A deposit of <span className="font-semibold">{formatMoneyExact(loan.depositOutstanding)}</span> is
            needed before the merchant can be paid.
          </p>
          <button
            onClick={() => setTarget({ loanId: loan.id, purpose: "deposit" })}
            className={buttonClass("primary")}
          >
            Pay deposit
          </button>
        </div>
      )}

      {active && (
        <PayoffCard
          payoff={payoff.data}
          loading={payoff.loading}
          error={payoff.error}
          onSettle={() => setTarget({ loanId: loan.id, purpose: "payoff" })}
          onCustom={() => setCustomOpen(true)}
        />
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Repayment schedule</h2>
        <PayableScheduleTable
          schedule={loan.schedule ?? []}
          canPay={active}
          onPay={(n) => setTarget({ loanId: loan.id, purpose: "installment", installmentNumber: n })}
        />
        {active && (
          <p className="mt-3 text-xs text-slate-500">
            You can pay any installment early. Paying a later one also clears the earlier unpaid ones, because
            payments always go to the oldest first.
          </p>
        )}
      </section>

      <PaymentHistory loanId={loan.id} refreshKey={refreshKey} onOpen={(p) => setResume(p)} />

      {(target || resume) && (
        <PayModal
          key={resume?.id ?? "new"}
          target={target ?? undefined}
          existing={resume ?? undefined}
          onClose={closePayModal}
          onSettled={refreshAll}
        />
      )}

      {customOpen && (
        <ActionModal
          title="Pay another amount"
          description={
            payoff.data
              ? `You owe up to ${formatMoneyExact(payoff.data.totalPayoff)} today. Any amount from ₦100 is applied to the oldest unpaid installment first.`
              : "Any amount from ₦100 is applied to the oldest unpaid installment first."
          }
          submitLabel="Get account details"
          fields={[
            {
              name: "amount",
              label: "Amount (₦)",
              kind: "money",
              required: true,
              helper: "At least ₦100, and no more than what is owed.",
            },
          ]}
          onClose={() => setCustomOpen(false)}
          onSubmit={async (v) => {
            if (Number(v.amount) < 100) {
              throw new ApiError("The minimum is ₦100.", 400, { amount: ["The minimum is ₦100."] });
            }
            // Created here so an out-of-range amount is reported in this form
            setResume(await createPayment(loan.id, { purpose: "custom", amount: v.amount }));
          }}
        />
      )}
    </div>
  );
}