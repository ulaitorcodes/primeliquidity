"use client";

import { useCallback, useEffect } from "react";
import { listLoanPayments, type Payment } from "@/lib/api/payments";
import { formatDateTime, formatMoneyExact } from "@/lib/format";
import { coverage, purposeLabel } from "@/lib/payments-format";
import { useLoad } from "@/lib/use-load";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";
import { PaymentStatusBadge } from "./payment-badge";

export function PaymentHistory({
  loanId,
  refreshKey,
  onOpen,
}: {
  loanId: string;
  /** bump it to reload */
  refreshKey: number;
  /** open a still-pending request again */
  onOpen: (p: Payment) => void;
}) {
  const loader = useCallback(() => listLoanPayments(loanId), [loanId]);
  const { data, loading, error, reload } = useLoad(loader);

  useEffect(() => {
    if (refreshKey > 0) reload();
  }, [refreshKey, reload]);

  const items = [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 font-semibold text-ink">Payments</h2>
      <ErrorNotice message={error} />

      {loading && data === null ? (
        <Skeleton className="h-20 w-full" />
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">No payments yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Requested</th>
                <th className="py-2 pr-4 font-medium">For</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Received</th>
                <th className="py-2 pr-4 font-medium">By</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((p) => {
                const open =
                  p.status === "pending" && (!p.expiresAt || new Date(p.expiresAt).getTime() > Date.now());
                return (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap py-3 pr-4 text-slate-600">{formatDateTime(p.createdAt)}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink">{purposeLabel(p)}</p>
                      {coverage(p) && <p className="text-xs text-slate-500">{coverage(p)}</p>}
                    </td>
                    <td className="py-3 pr-4">{formatMoneyExact(p.amount)}</td>
                    <td className="py-3 pr-4">{p.paidAmount > 0 ? formatMoneyExact(p.paidAmount) : "—"}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {p.payer ? `${p.payer.name} (${p.payer.role})` : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <PaymentStatusBadge status={p.status} />
                    </td>
                    <td className="py-3 text-right">
                      {open && (
                        <button onClick={() => onOpen(p)} className={buttonClass("outline")}>
                          Open
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}