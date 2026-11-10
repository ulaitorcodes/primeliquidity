"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { listTransactions } from "@/lib/api/finance";
import type { TransactionType } from "@/lib/api/finance-types";
import { usePrograms } from "@/lib/programs/programs-context";
import { useLoad } from "@/lib/use-load";
import { transactionTypeLabels } from "@/components/finance/badges";
import { TransactionsTable } from "@/components/finance/transactions-table";
import { ErrorNotice } from "@/components/ui/error-notice";
import { TableSkeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";

const PAGE = 25;

const selectClass =
  "rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export default function JournalPage() {
  const { programs } = usePrograms();
  const [type, setType] = useState<TransactionType | "">("");
  const [program, setProgram] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loader = useCallback(
    () =>
      listTransactions({
        type,
        program: program || undefined,
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
        limit: PAGE,
        offset,
      }),
    [type, program, search, from, to, offset]
  );
  const { data, loading, error } = useLoad(loader);

  const total = data?.total ?? 0;
  const first = total === 0 ? 0 : offset + 1;
  const last = Math.min(offset + PAGE, total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Journal</h1>
        <p className="text-sm text-slate-600">
          Every money movement. Records can't be edited or deleted. Mistakes are corrected by reversing them.
        </p>
      </div>

      <ErrorNotice message={error} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search reference or description"
            className={`${selectClass} w-72 pl-9`}
          />
        </div>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as TransactionType | "");
            setOffset(0);
          }}
          className={selectClass}
        >
          <option value="">All types</option>
          {(Object.keys(transactionTypeLabels) as TransactionType[]).map((t) => (
            <option key={t} value={t}>
              {transactionTypeLabels[t]}
            </option>
          ))}
        </select>
        <select
          value={program}
          onChange={(e) => {
            setProgram(e.target.value);
            setOffset(0);
          }}
          className={selectClass}
        >
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setOffset(0);
            }}
            className={selectClass}
            aria-label="From date"
          />
          <span>to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setOffset(0);
            }}
            className={selectClass}
            aria-label="To date"
          />
        </div>
      </div>

      {loading && data === null ? (
        <TableSkeleton rows={8} />
      ) : (
        <TransactionsTable
          transactions={data?.results ?? []}
          emptyMessage="No transactions match your filters."
        />
      )}

      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <p>
            {first}–{last} of {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE))}
              className={buttonClass("outline")}
            >
              Previous
            </button>
            <button
              disabled={offset + PAGE >= total}
              onClick={() => setOffset(offset + PAGE)}
              className={buttonClass("outline")}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}