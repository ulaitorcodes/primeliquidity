"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { listLoans } from "@/lib/api/finance";
import type { LoanStatus } from "@/lib/api/finance-types";
import { formatDay, formatMoneyExact } from "@/lib/format";
import { usePrograms } from "@/lib/programs/programs-context";
import { useLoad } from "@/lib/use-load";
import { LoanStatusBadge, loanStatusLabels } from "@/components/finance/badges";
import { ErrorNotice } from "@/components/ui/error-notice";
import { TableSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const selectClass =
  "rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export default function LoansPage() {
  const { programs } = usePrograms();
  const [program, setProgram] = useState("");
  const [status, setStatus] = useState<LoanStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loader = useCallback(
    () => listLoans({ program: program || undefined, status, search: search || undefined }),
    [program, status, search]
  );
  const { data, loading, error } = useLoad(loader);
  const loans = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Loans</h1>
        <p className="text-sm text-slate-600">
          Loans are created from approved applications. Open an approved application and choose “Create loan”.
        </p>
      </div>

      <ErrorNotice message={error} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search borrower or reference"
            className={`${selectClass} w-72 pl-9`}
          />
        </div>
        <select value={program} onChange={(e) => setProgram(e.target.value)} className={selectClass}>
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as LoanStatus | "")} className={selectClass}>
          <option value="">All statuses</option>
          {(Object.keys(loanStatusLabels) as LoanStatus[]).map((s) => (
            <option key={s} value={s}>
              {loanStatusLabels[s]}
            </option>
          ))}
        </select>
      </div>

      {loading && data === null ? (
        <TableSkeleton />
      ) : loans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No loans match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Loan</th>
                <th className="px-5 py-3 font-medium">Borrower</th>
                <th className="px-5 py-3 font-medium">Merchant</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Deposit (paid / needed)</th>
                <th className="px-5 py-3 font-medium">Financed</th>
                <th className="px-5 py-3 font-medium">Total repayable</th>
                <th className="px-5 py-3 font-medium">Overdue</th>
                <th className="px-5 py-3 font-medium">Next due</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">{l.reference}</p>
                    <p className="text-xs text-slate-500">{l.programName}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-800">{l.borrowerName}</p>
                    <p className="text-xs text-slate-500">{l.borrowerEmail}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {l.merchant ? l.merchant.name : <span className="text-amber-700">Not assigned</span>}
                  </td>
                  <td className="px-5 py-4">
                    <LoanStatusBadge status={l.status} />
                  </td>
                  <td className="px-5 py-4">{formatMoneyExact(l.invoiceTotal)}</td>
                  <td className="px-5 py-4">
                    {formatMoneyExact(l.depositPaid)}
                    <span className="block text-xs text-slate-500">of {formatMoneyExact(l.depositAmount)}</span>
                  </td>
                  <td className="px-5 py-4">{formatMoneyExact(l.principal)}</td>
                  <td className="px-5 py-4">{formatMoneyExact(l.totalRepayable)}</td>
                  <td className={cn("px-5 py-4", l.overdueAmount > 0 && "font-medium text-red-600")}>
                    {l.overdueAmount > 0 ? (
                      <>
                        {formatMoneyExact(l.overdueAmount)}
                        <span className="block text-xs font-normal">{l.daysPastDue} days late</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{formatDay(l.nextDueOn)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/finance/loans/${l.id}`} className="font-medium text-brand-700 hover:underline">
                      View
                    </Link>
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