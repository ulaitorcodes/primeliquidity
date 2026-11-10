"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  assignLoanMerchant,
  cancelLoan,
  getLoan,
  recordDeposit,
  refundDeposit,
  refundLoanCredit,
  repayLoan,
  writeOffLoan,
  type PayerRole,
} from "@/lib/api/finance";
import { listMerchants } from "@/lib/api/merchants";
import { formatDay, formatMoneyExact, humanize, todayISO } from "@/lib/format";
import { merchantKindLabels } from "@/lib/merchant-options";
import { useLoad } from "@/lib/use-load";
import { LoanStatusBadge, MerchantStatusBadge } from "@/components/finance/badges";
import { DisbursementPanel } from "@/components/finance/disbursement-panel";
import { TransactionsTable } from "@/components/finance/transactions-table";
import { LoanPayments } from "@/components/payments/loan-payments";
import { ActionModal } from "@/components/ui/action-modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModalKind =
  | "merchant"
  | "deposit"
  | "depositRefund"
  | "repay"
  | "refund"
  | "writeoff"
  | "cancel"
  | null;

const loadVerifiedMerchants = () => listMerchants({ status: "verified" });

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "red" | "green";
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
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
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const loader = useCallback(() => getLoan(id), [id]);
  const { data: loan, loading, error, reload } = useLoad(loader);
  const verified = useLoad(loadVerifiedMerchants);
  const [modal, setModal] = useState<ModalKind>(null);

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
        <Link href="/admin/finance/loans" className="text-sm font-medium text-slate-600 hover:text-ink">
          ← Back to loans
        </Link>
        <ErrorNotice message={error ?? "Loan not found."} />
      </div>
    );
  }

  const awaiting = loan.status === "approved";
  const depositHeld = loan.depositPaid > 0;
  const canDeposit = awaiting;
  const canRefundDeposit = awaiting && depositHeld;
  const canRepay = loan.status === "active" || loan.status === "written_off";
  const canRefundCredit = loan.creditBalance > 0 && loan.status !== "cancelled";
  const canWriteOff = loan.status === "active";
  const canCancel = awaiting;

  return (
    <div className="space-y-8">
      <Link
        href="/admin/finance/loans"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to loans
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{loan.programName}</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">{loan.reference}</h1>
            <LoanStatusBadge status={loan.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {loan.borrowerName} · {loan.borrowerEmail} ·{" "}
            <Link href={`/admin/applications/${loan.applicationId}`} className="text-brand-700 hover:underline">
              {loan.applicationReference}
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canDeposit && (
            <button onClick={() => setModal("deposit")} className={buttonClass("outline")}>
              Record deposit
            </button>
          )}
          {canRepay && (
            <button onClick={() => setModal("repay")} className={buttonClass("outline")}>
              {loan.status === "written_off" ? "Record recovery" : "Record repayment"}
            </button>
          )}
          {canRefundDeposit && (
            <button onClick={() => setModal("depositRefund")} className={buttonClass("outline")}>
              Refund deposit
            </button>
          )}
          {canRefundCredit && (
            <button onClick={() => setModal("refund")} className={buttonClass("outline")}>
              Refund credit
            </button>
          )}
          {canWriteOff && (
            <button
              onClick={() => setModal("writeoff")}
              className={buttonClass("outline", "md", "border-red-200 text-red-700 hover:bg-red-50")}
            >
              Write off
            </button>
          )}
          {canCancel && (
            <button
              disabled={depositHeld}
              title={depositHeld ? "Refund the deposit first" : undefined}
              onClick={() => setModal("cancel")}
              className={buttonClass("outline", "md", "border-red-200 text-red-700 hover:bg-red-50")}
            >
              Cancel loan
            </button>
          )}
        </div>
      </div>

      <ErrorNotice message={error} />

      {depositHeld && awaiting && (
        <p className="-mt-4 text-sm text-slate-500">
          A deposit is being held on this loan, so it can't be cancelled until the deposit is refunded.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Invoice total" value={formatMoneyExact(loan.invoiceTotal)} hint="Owed to the merchant" />
        <Stat label="Deposit needed" value={formatMoneyExact(loan.depositAmount)} hint={`${loan.depositPercent}% of the invoice`} />
        <Stat label="Deposit paid" value={formatMoneyExact(loan.depositPaid)} tone="green" />
        <Stat
          label="Deposit outstanding"
          value={formatMoneyExact(loan.depositOutstanding)}
          tone={loan.depositOutstanding > 0 ? "red" : undefined}
        />
        <Stat label="Financed" value={formatMoneyExact(loan.principal)} hint="Fees are charged on this" />
        <Stat label="Service charge" value={formatMoneyExact(loan.totalFee)} />
        <Stat label="Total repayable" value={formatMoneyExact(loan.totalRepayable)} />
        <Stat
          label="Overdue"
          value={loan.overdueAmount > 0 ? `${formatMoneyExact(loan.overdueAmount)} · ${loan.daysPastDue} days` : "None"}
          tone={loan.overdueAmount > 0 ? "red" : undefined}
        />
        <Stat label="Principal paid" value={formatMoneyExact(loan.principalPaid)} tone="green" />
        <Stat label="Charges paid" value={formatMoneyExact(loan.feesPaid)} tone="green" />
        <Stat label="Principal outstanding" value={formatMoneyExact(loan.principalOutstanding)} />
        <Stat label="Charges outstanding" value={formatMoneyExact(loan.feesOutstanding)} />
      </div>

      {loan.creditBalance > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This loan holds an overpayment credit of{" "}
          <span className="font-semibold">{formatMoneyExact(loan.creditBalance)}</span>. It is refundable to the borrower.
        </div>
      )}

      <Card title="Merchant">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {loan.merchant ? (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/finance/merchants/${loan.merchant.id}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {loan.merchant.name}
                </Link>
                <MerchantStatusBadge status={loan.merchant.status} />
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {merchantKindLabels[loan.merchant.kind] ?? loan.merchant.kind}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              No merchant assigned yet. One is needed before this loan can be paid out.
            </p>
          )}
          {awaiting && (
            <button onClick={() => setModal("merchant")} className={buttonClass("outline")}>
              {loan.merchant ? "Change merchant" : "Assign merchant"}
            </button>
          )}
        </div>
      </Card>

      <DisbursementPanel loan={loan} onChanged={reload} />

      <Card title="Terms">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <Row label="Model" value={humanize(loan.model)} />
          <Row label="Service charge" value={`${loan.feePercentPerPeriod}% per ${loan.periodUnit}`} />
          <Row label="Periods" value={`${loan.periods} ${loan.periodUnit}s`} />
          <Row label="Next due" value={formatDay(loan.nextDueOn)} />
          <Row label="Disbursed on" value={formatDay(loan.disbursedOn)} />
          <Row label="Paid to" value={[loan.payeeName, loan.payeeAccount].filter(Boolean).join(" · ") || "—"} />
          <Row label="Completed on" value={formatDay(loan.completedOn)} />
          <Row label="Written off on" value={formatDay(loan.writtenOffOn)} />
          {loan.writeOffReason && <Row label="Write-off reason" value={loan.writeOffReason} />}
        </dl>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-ink">Pay and repayments</h2>
        <p className="mb-4 mt-1 text-sm text-slate-600">
          Pay on the customer's behalf through the virtual account. The payment is recorded against you as the payer.
          To record money that was paid outside the app, use “Record repayment” above.
        </p>
        <LoanPayments loan={loan} onChanged={reload} />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Transactions</h2>
        <TransactionsTable transactions={loan.transactions} emptyMessage="No money movements on this loan yet." />
      </section>

      {modal === "merchant" && (
        <ActionModal
          title={loan.merchant ? "Change merchant" : "Assign merchant"}
          description={
            (verified.data ?? []).length === 0 && !verified.loading
              ? "There are no verified merchants yet. Verify one under Finance, then Merchants, first."
              : "Only verified merchants can be paid. You can change this until the loan is paid out."
          }
          submitLabel="Save merchant"
          fields={[
            {
              name: "merchantId",
              label: "Merchant",
              kind: "select",
              required: true,
              defaultValue: loan.merchant?.id ?? "",
              options: (verified.data ?? []).map((m) => ({ label: m.name, value: m.id })),
            },
          ]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await assignLoanMerchant(id, v.merchantId);
            toast.success("Merchant assigned");
            reload();
          }}
        />
      )}

      {modal === "deposit" && (
        <ActionModal
          title="Record deposit"
          description={`Deposit still needed: ${formatMoneyExact(loan.depositOutstanding)}. Anything beyond what is needed is held as refundable credit. Record it only after the money has arrived.`}
          submitLabel="Record deposit"
          wide
          fields={[
            { name: "amount", label: "Amount (₦)", kind: "money", required: true },
            { name: "reference", label: "Reference", kind: "text", required: true, helper: "The bank transfer ID. It must be unique." },
            { name: "paidOn", label: "Paid on", kind: "date", defaultValue: todayISO() },
            { name: "method", label: "Method (optional)", kind: "text", placeholder: "e.g. Bank transfer" },
            {
              name: "payerRole",
              label: "Paid by",
              kind: "select",
              required: true,
              defaultValue: "applicant",
              options: [
                { label: "Applicant", value: "applicant" },
                { label: "Agent", value: "agent" },
                { label: "Admin", value: "admin" },
                { label: "Other", value: "other" },
              ],
            },
            { name: "payerName", label: "Payer name (optional)", kind: "text" },
          ]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await recordDeposit(id, {
              amount: v.amount,
              reference: v.reference,
              paidOn: v.paidOn,
              method: v.method,
              payerRole: v.payerRole as PayerRole,
              payerName: v.payerName,
            });
            toast.success("Deposit recorded");
            reload();
          }}
        />
      )}

      {modal === "depositRefund" && (
        <ActionModal
          title="Refund deposit"
          description={`Pays back the ${formatMoneyExact(loan.depositPaid)} deposit held on this loan. This is required before the loan can be cancelled.`}
          submitLabel="Record refund"
          wide
          fields={[
            { name: "reference", label: "Reference", kind: "text", required: true, helper: "The bank transfer ID. It must be unique." },
            { name: "paidOn", label: "Paid on", kind: "date", defaultValue: todayISO() },
          ]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await refundDeposit(id, { reference: v.reference, paidOn: v.paidOn });
            toast.success("Deposit refund recorded");
            reload();
          }}
        />
      )}

      {modal === "repay" && (
        <ActionModal
          title={loan.status === "written_off" ? "Record recovery" : "Record repayment"}
          description={
            loan.status === "written_off"
              ? "This loan was written off, so the payment is recorded as a recovery."
              : "Record a payment that was made outside the app and has been received."
          }
          submitLabel="Record payment"
          wide
          fields={[
            { name: "amount", label: "Amount (₦)", kind: "money", required: true },
            { name: "reference", label: "Reference", kind: "text", required: true, helper: "The bank transfer ID. It must be unique." },
            { name: "paidOn", label: "Paid on", kind: "date", defaultValue: todayISO() },
            { name: "method", label: "Method (optional)", kind: "text", placeholder: "e.g. Bank transfer" },
          ]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await repayLoan(id, {
              amount: v.amount,
              reference: v.reference,
              paidOn: v.paidOn,
              method: v.method,
            });
            toast.success("Payment recorded");
            reload();
          }}
        />
      )}

      {modal === "refund" && (
        <ActionModal
          title="Refund credit"
          description={`Pay back part or all of the ${formatMoneyExact(loan.creditBalance)} overpayment held on this loan.`}
          submitLabel="Record refund"
          wide
          fields={[
            { name: "amount", label: "Amount (₦)", kind: "money", required: true },
            { name: "reference", label: "Reference", kind: "text", required: true, helper: "The bank transfer ID. It must be unique." },
            { name: "paidOn", label: "Paid on", kind: "date", defaultValue: todayISO() },
          ]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await refundLoanCredit(id, {
              amount: v.amount,
              reference: v.reference,
              paidOn: v.paidOn,
            });
            toast.success("Credit refund recorded");
            reload();
          }}
        />
      )}

      {modal === "writeoff" && (
        <ActionModal
          title="Write off loan"
          description="The remaining balance is written off. Later payments are recorded as recoveries."
          submitLabel="Write off"
          destructive
          fields={[{ name: "reason", label: "Reason", kind: "textarea", required: true }]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await writeOffLoan(id, v.reason);
            toast.success("Loan written off");
            reload();
          }}
        />
      )}

      {modal === "cancel" && (
        <ActionModal
          title="Cancel this loan?"
          description="Only loans that haven't been paid out can be cancelled, and any deposit must be refunded first. The application stays approved."
          submitLabel="Cancel loan"
          destructive
          fields={[]}
          onClose={() => setModal(null)}
          onSubmit={async () => {
            await cancelLoan(id);
            toast.success("Loan cancelled");
            reload();
          }}
        />
      )}
    </div>
  );
}