"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { createDisbursement, listDisbursements } from "@/lib/api/finance";
import type { LoanDetail, Merchant, PaymentMeans } from "@/lib/api/finance-types";
import { getMerchant } from "@/lib/api/merchants";
import { actorName, formatDateTime, formatDay, formatMoneyExact, humanize, todayISO } from "@/lib/format";
import { useLoad } from "@/lib/use-load";
import { ActionModal } from "@/components/ui/action-modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";
import { DisbursementStatusBadge } from "./badges";
import { DisbursementActions } from "./disbursement-actions";

const meansOptions: { label: string; value: PaymentMeans }[] = [
  { label: "Bank transfer", value: "bank_transfer" },
  { label: "Cash", value: "cash" },
  { label: "Cheque", value: "cheque" },
  { label: "POS", value: "pos" },
  { label: "Mobile money", value: "mobile_money" },
  { label: "Other", value: "other" },
];

export function DisbursementPanel({
  loan,
  onChanged,
}: {
  loan: LoanDetail;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [modal, setModal] = useState<"system" | "external" | null>(null);

  const listLoader = useCallback(() => listDisbursements({ loanId: loan.id }), [loan.id]);
  const list = useLoad(listLoader);

  const merchantId = loan.merchant?.id ?? null;
  const merchantLoader = useCallback(
    (): Promise<Merchant | null> => (merchantId ? getMerchant(merchantId) : Promise.resolve(null)),
    [merchantId]
  );
  const merchant = useLoad<Merchant | null>(merchantLoader);

  const disbursements = list.data ?? [];
  const inFlight = disbursements.some(
    (d) => d.status === "pending_authorization" || d.status === "processing"
  );
  const ready = loan.readyToDisburse;
  const awaiting = loan.status === "approved";
  const canDeploy = awaiting && ready?.ready === true && !inFlight;

  const accounts = (merchant.data?.accounts ?? []).filter((a) => a.isActive);
  const accountOptions = [
    { label: "Primary account (default)", value: "" },
    ...accounts.map((a) => ({
      label: `${a.bankName} · ${a.accountNumber} · ${a.accountName}${a.isPrimary ? " (primary)" : ""}${
        a.nameVerified ? "" : " (name not verified)"
      }`,
      value: a.id,
    })),
  ];

  function refresh() {
    list.reload();
    onChanged();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold text-ink">Deployment</h2>
      <p className="mt-1 text-sm text-slate-600">
        Paying the merchant the full invoice total of{" "}
        <span className="font-medium text-ink">{formatMoneyExact(loan.invoiceTotal)}</span>.
      </p>

      {awaiting && (
        <div className="mt-5 space-y-4">
          {ready?.ready ? (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <ShieldCheck size={18} className="mt-0.5 shrink-0" />
              <p>Ready to deploy. The merchant is verified and the deposit has been received.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-semibold">
                <TriangleAlert size={16} /> Not ready to deploy yet
              </p>
              {ready && ready.blockers.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {ready.blockers.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">The server hasn't said why. Reload the page, or check the merchant and the deposit.</p>
              )}
              <Link href="/admin/finance/merchants" className="mt-3 inline-block font-medium underline">
                Manage merchants
              </Link>
            </div>
          )}

          {inFlight && (
            <p className="text-sm text-slate-600">
              A deployment is already in progress. Finish or cancel it before starting another.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              disabled={!canDeploy}
              onClick={() => setModal("system")}
              className={buttonClass("primary")}
            >
              Deploy through the system
            </button>
            <button
              disabled={!canDeploy}
              onClick={() => setModal("external")}
              className={buttonClass("outline")}
            >
              Record external payment
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Deployments</h3>
        <ErrorNotice message={list.error} />
        {list.loading && list.data === null ? (
          <Skeleton className="h-20 w-full" />
        ) : disbursements.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing has been deployed for this loan yet.</p>
        ) : (
          <ul className="space-y-3">
            {disbursements.map((d) => (
              <li key={d.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <DisbursementStatusBadge status={d.status} />
                    <span className="text-sm font-semibold text-ink">{formatMoneyExact(d.amount)}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
                      {d.channel}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{formatDateTime(d.createdAt)}</span>
                </div>

                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-slate-600 sm:grid-cols-2">
                  {d.payee && (d.payee.accountNumber || d.payee.accountName) && (
                    <div>
                      <span className="text-slate-500">Paid to: </span>
                      {[d.payee.accountName, d.payee.bankName, d.payee.accountNumber].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {d.means && (
                    <div>
                      <span className="text-slate-500">Means: </span>
                      {humanize(d.means)}
                    </div>
                  )}
                  {d.reference && (
                    <div>
                      <span className="text-slate-500">Reference: </span>
                      {d.reference}
                    </div>
                  )}
                  {d.providerReference && (
                    <div>
                      <span className="text-slate-500">Provider reference: </span>
                      {d.providerReference}
                    </div>
                  )}
                  {d.paidOn && (
                    <div>
                      <span className="text-slate-500">Paid on: </span>
                      {formatDay(d.paidOn)}
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">Started by: </span>
                    {actorName(d.initiatedBy)}
                  </div>
                  {d.authorizedAt && (
                    <div>
                      <span className="text-slate-500">Authorized by: </span>
                      {actorName(d.authorizedBy)} · {formatDateTime(d.authorizedAt)}
                    </div>
                  )}
                  {d.note && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">Note: </span>
                      {d.note}
                    </div>
                  )}
                </dl>

                {d.status === "pending_authorization" && (
                  <p className="mt-3 text-xs text-amber-700">
                    {d.codeExpiresAt ? `Code expires ${formatDateTime(d.codeExpiresAt)}. ` : ""}
                    {d.codeAttemptsLeft !== null && d.codeAttemptsLeft !== undefined
                      ? `Attempts left: ${d.codeAttemptsLeft}.`
                      : ""}
                  </p>
                )}

                {d.status === "processing" && (
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                    The provider has not confirmed this payment. <strong>Do not retry.</strong> Check with the provider.
                  </p>
                )}

                {d.status === "failed" && (
                  <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                    Failed. No money moved.{d.failureReason ? ` ${d.failureReason}` : ""}
                  </p>
                )}

                <div className="mt-3">
                  <DisbursementActions disbursement={d} onChanged={refresh} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal === "system" && (
        <ActionModal
          title="Deploy through the system"
          description="This starts the payout, but nothing is paid yet. A 6-digit code is emailed to another admin, who must enter it within 15 minutes to release the money."
          submitLabel="Send authorization code"
          wide
          fields={[
            {
              name: "accountId",
              label: "Pay to account",
              kind: "select",
              options: accountOptions,
              full: true,
              helper: "Leave on the primary account unless the merchant asked for another.",
            },
          ]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await createDisbursement(loan.id, { channel: "system", accountId: v.accountId });
            toast.success("Code emailed. Waiting for authorization.");
            refresh();
          }}
        />
      )}

      {modal === "external" && (
        <ActionModal
          title="Record external payment"
          description="Use this when the merchant was already paid outside the app. It completes immediately, so double check the reference."
          submitLabel="Record payment"
          wide
          fields={[
            {
              name: "means",
              label: "Means of payment",
              kind: "select",
              required: true,
              options: meansOptions,
            },
            {
              name: "reference",
              label: "Reference",
              kind: "text",
              required: true,
              helper: "The transfer ID or receipt number. It must be unique.",
            },
            { name: "paidOn", label: "Paid on", kind: "date", defaultValue: todayISO() },
            { name: "accountId", label: "Paid to account", kind: "select", options: accountOptions },
            { name: "note", label: "Note", kind: "textarea" },
          ]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await createDisbursement(loan.id, {
              channel: "external",
              means: v.means as PaymentMeans,
              reference: v.reference,
              paidOn: v.paidOn,
              accountId: v.accountId,
              note: v.note,
            });
            toast.success("External payment recorded");
            refresh();
          }}
        />
      )}
    </section>
  );
}
