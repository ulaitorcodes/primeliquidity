"use client";

import Link from "next/link";
import type { Transaction } from "@/lib/api/finance-types";
import { formatDay, formatMoneyExact, refId } from "@/lib/format";
import { usePrograms } from "@/lib/programs/programs-context";
import { TransactionTypeBadge } from "./badges";

export function TransactionsTable({
  transactions,
  emptyMessage = "No transactions yet.",
}: {
  transactions: Transaction[];
  emptyMessage?: string;
}) {
  const { getProgram } = usePrograms();

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-5 py-3 font-medium">Type</th>
            <th className="px-5 py-3 font-medium">Reference</th>
            <th className="px-5 py-3 font-medium">Description</th>
            <th className="px-5 py-3 font-medium">Program</th>
            <th className="px-5 py-3 font-medium">Amount</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((t) => {
            const reversed = !!refId(t.reversedBy);
            const isReversal = !!refId(t.reverses);
            return (
              <tr key={t.id} className="hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDay(t.occurredOn)}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <TransactionTypeBadge type={t.type} />
                    {reversed && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        Reversed
                      </span>
                    )}
                    {isReversal && t.type !== "reversal" && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Reversal
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 font-medium text-ink">{t.reference}</td>
                <td className="max-w-[260px] truncate px-5 py-4 text-slate-600">{t.description}</td>
                <td className="px-5 py-4 text-slate-600">
                  {t.programSlug ? (getProgram(t.programSlug)?.name ?? t.programSlug) : "General pool"}
                </td>
                <td className={`whitespace-nowrap px-5 py-4 font-medium ${reversed ? "text-slate-400 line-through" : "text-ink"}`}>
                  {formatMoneyExact(t.amount)}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link href={`/admin/finance/journal/${t.id}`} className="font-medium text-brand-700 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}