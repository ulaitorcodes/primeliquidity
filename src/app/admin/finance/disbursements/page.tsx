"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { listDisbursements } from "@/lib/api/finance";
import type { DisbursementChannel, DisbursementStatus } from "@/lib/api/finance-types";
import { actorName, formatDateTime, formatMoneyExact, humanize } from "@/lib/format";
import { useLoad } from "@/lib/use-load";
import { DisbursementStatusBadge, disbursementLabels } from "@/components/finance/badges";
import { DisbursementActions } from "@/components/finance/disbursement-actions";
import { ErrorNotice } from "@/components/ui/error-notice";
import { TableSkeleton } from "@/components/ui/skeleton";

const selectClass =
  "rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export default function DisbursementsPage() {
  const [status, setStatus] = useState<DisbursementStatus | "">("");
  const [channel, setChannel] = useState<DisbursementChannel | "">("");

  const loader = useCallback(() => listDisbursements({ status, channel }), [status, channel]);
  const { data, loading, error, reload } = useLoad(loader);
  const items = data ?? [];
  const waiting = items.filter((d) => d.status === "pending_authorization").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Disbursements</h1>
        <p className="text-sm text-slate-600">
          Payments to merchants. To start one, open a loan that is ready to deploy.
        </p>
      </div>

      <ErrorNotice message={error} />

      {waiting > 0 && status === "" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <span className="font-semibold">{waiting}</span> deployment{waiting === 1 ? " is" : "s are"} waiting for an
          authorization code.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as DisbursementStatus | "")}
          className={selectClass}
        >
          <option value="">All statuses</option>
          {(Object.keys(disbursementLabels) as DisbursementStatus[]).map((s) => (
            <option key={s} value={s}>
              {disbursementLabels[s]}
            </option>
          ))}
        </select>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as DisbursementChannel | "")}
          className={selectClass}
        >
          <option value="">All channels</option>
          <option value="system">System</option>
          <option value="external">External</option>
        </select>
      </div>

      {loading && data === null ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No disbursements match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Started</th>
                <th className="px-5 py-3 font-medium">Loan</th>
                <th className="px-5 py-3 font-medium">Merchant</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Channel</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Details</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((d) => (
                <tr key={d.id} className="align-top hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {formatDateTime(d.createdAt)}
                    <p className="text-xs text-slate-500">by {actorName(d.initiatedBy)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/finance/loans/${d.loanId}`} className="font-medium text-brand-700 hover:underline">
                      {d.loanReference}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{d.merchantName ?? "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-ink">{formatMoneyExact(d.amount)}</td>
                  <td className="px-5 py-4 capitalize text-slate-600">{d.channel}</td>
                  <td className="px-5 py-4">
                    <DisbursementStatusBadge status={d.status} />
                    {d.status === "processing" && (
                      <p className="mt-1 text-xs font-medium text-amber-700">Do not retry. Check with provider.</p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {d.means && <p>{humanize(d.means)}</p>}
                    {d.reference && <p>Ref: {d.reference}</p>}
                    {d.providerReference && <p>Provider: {d.providerReference}</p>}
                    {d.failureReason && <p className="text-red-600">{d.failureReason}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <DisbursementActions disbursement={d} onChanged={reload} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}