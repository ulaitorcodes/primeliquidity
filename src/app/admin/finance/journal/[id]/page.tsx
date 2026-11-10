"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Undo2 } from "lucide-react";
import { getTransaction, reverseTransaction } from "@/lib/api/finance";
import {
  actorName,
  formatDateTime,
  formatDay,
  formatMoneyExact,
  humanize,
  refId,
} from "@/lib/format";
import { usePrograms } from "@/lib/programs/programs-context";
import { useLoad } from "@/lib/use-load";
import { TransactionTypeBadge } from "@/components/finance/badges";
import { ActionModal } from "@/components/ui/action-modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { getProgram } = usePrograms();
  const loader = useCallback(() => getTransaction(id), [id]);
  const { data: tx, loading, error, reload } = useLoad(loader);
  const [reversing, setReversing] = useState(false);

  if (loading && tx === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="space-y-4">
        <Link href="/admin/finance/journal" className="text-sm font-medium text-slate-600 hover:text-ink">
          ← Back to journal
        </Link>
        <ErrorNotice message={error ?? "Transaction not found."} />
      </div>
    );
  }

  const reversedById = refId(tx.reversedBy);
  const reversesId = refId(tx.reverses);
  // A reversal itself can't be reversed again, and a transaction can be reversed only once
  const canReverse = !reversedById && tx.type !== "reversal";
  const metadata = tx.metadata && Object.keys(tx.metadata).length > 0 ? tx.metadata : null;

  return (
    <div className="space-y-8">
      <Link
        href="/admin/finance/journal"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to journal
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">{tx.reference}</h1>
            <TransactionTypeBadge type={tx.type} />
            {reversedById && (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">Reversed</span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">{tx.description}</p>
        </div>

        {canReverse && (
          <button
            onClick={() => setReversing(true)}
            className={buttonClass("outline", "md", "border-red-200 text-red-700 hover:bg-red-50")}
          >
            <Undo2 size={16} /> Reverse
          </button>
        )}
      </div>

      <ErrorNotice message={error} />

      {reversedById && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          This transaction was reversed.{" "}
          <Link href={`/admin/finance/journal/${reversedById}`} className="font-semibold underline">
            View the reversal
          </Link>
          .
        </div>
      )}

      {reversesId && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          This is a reversal of{" "}
          <Link href={`/admin/finance/journal/${reversesId}`} className="font-semibold text-brand-700 underline">
            another transaction
          </Link>
          .
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Details</h2>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Row label="Amount">
            <span className="text-lg font-bold">{formatMoneyExact(tx.amount)}</span>
          </Row>
          <Row label="Date">{formatDay(tx.occurredOn)}</Row>
          <Row label="Program">
            {tx.programSlug ? (getProgram(tx.programSlug)?.name ?? tx.programSlug) : "General pool"}
          </Row>
          <Row label="Recorded by">{actorName(tx.createdBy)}</Row>
          <Row label="Recorded at">{formatDateTime(tx.createdAt)}</Row>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Ledger entries</h2>
        {!tx.entries || tx.entries.length === 0 ? (
          <p className="text-sm text-slate-500">Not available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Account</th>
                  <th className="py-2 pr-4 font-medium">Direction</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 font-medium">Linked to</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tx.entries.map((e, i) => (
                  <tr key={i}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink">{e.accountName}</p>
                      <p className="text-xs text-slate-500">{e.account}</p>
                    </td>
                    <td className="py-3 pr-4 capitalize">{humanize(e.direction)}</td>
                    <td className="py-3 pr-4">{formatMoneyExact(e.amount)}</td>
                    <td className="py-3">
                      {e.loanId && (
                        <Link href={`/admin/finance/loans/${e.loanId}`} className="text-brand-700 hover:underline">
                          Loan
                        </Link>
                      )}
                      {e.loanId && e.funderId && " · "}
                      {e.funderId && (
                        <Link href={`/admin/finance/funders/${e.funderId}`} className="text-brand-700 hover:underline">
                          Funder
                        </Link>
                      )}
                      {!e.loanId && !e.funderId && "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {metadata && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-ink">Metadata</h2>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {Object.entries(metadata).map(([key, value]) => (
              <Row key={key} label={humanize(key)}>
                {typeof value === "string" || typeof value === "number" || typeof value === "boolean"
                  ? String(value)
                  : JSON.stringify(value)}
              </Row>
            ))}
          </dl>
        </section>
      )}

      {reversing && (
        <ActionModal
          title="Reverse this transaction?"
          description="This posts the mirror entries to undo the original. The original stays in the journal, and a transaction can be reversed only once."
          submitLabel="Reverse transaction"
          destructive
          fields={[{ name: "reason", label: "Reason", kind: "textarea", required: true }]}
          onClose={() => setReversing(false)}
          onSubmit={async (v) => {
            await reverseTransaction(id, v.reason);
            toast.success("Transaction reversed");
            reload();
          }}
        />
      )}
    </div>
  );
}