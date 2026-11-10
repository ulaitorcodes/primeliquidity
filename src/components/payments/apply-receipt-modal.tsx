"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { listLoans } from "@/lib/api/finance";
import { applyReceipt, type HeldReceipt } from "@/lib/api/payments";
import { formatMoneyExact } from "@/lib/format";
import { useLoad } from "@/lib/use-load";
import { LoanStatusBadge } from "@/components/finance/badges";
import { ErrorNotice } from "@/components/ui/error-notice";
import { FormField, inputClass } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ApplyReceiptModal({
  receipt,
  onClose,
  onDone,
}: {
  receipt: HeldReceipt;
  onClose: () => void;
  onDone: () => void;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loanId, setLoanId] = useState("");
  const [purpose, setPurpose] = useState<"repayment" | "deposit">("repayment");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loader = useCallback(() => listLoans({ search: search || undefined }), [search]);
  const loans = useLoad(loader);
  const list = (loans.data ?? []).slice(0, 25);
  const selected = (loans.data ?? []).find((l) => l.id === loanId) ?? null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    if (!loanId) {
      setError("Choose the loan to apply this receipt to.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await applyReceipt(receipt.id, { loanId, purpose });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't apply the receipt");
      setBusy(false);
      submitting.current = false;
    }
  }

  return (
    <Modal open onClose={onClose} title="Apply held receipt" wide>
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-semibold text-ink">{formatMoneyExact(receipt.amount)}</span> from{" "}
            {receipt.payerName ?? "an unknown payer"}
            {receipt.accountNumber ? ` to account ${receipt.accountNumber}` : ""}.
          </p>
          {receipt.reason && <p className="mt-1 text-slate-500">Held because: {receipt.reason}</p>}
        </div>

        <FormField label="Find the loan">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputClass} pl-9`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search borrower or loan reference"
            />
          </div>
        </FormField>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
          {loans.loading && loans.data === null ? (
            <Skeleton className="h-24 w-full" />
          ) : list.length === 0 ? (
            <p className="p-4 text-center text-sm text-slate-500">No loans found.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {list.map((l) => (
                <li key={l.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 px-4 py-3 text-sm hover:bg-slate-50",
                      loanId === l.id && "bg-brand-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="loan"
                      checked={loanId === l.id}
                      onChange={() => {
                        setLoanId(l.id);
                        setPurpose(l.status === "approved" ? "deposit" : "repayment");
                      }}
                      className="mt-1 accent-brand-600"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink">{l.reference}</span>
                        <LoanStatusBadge status={l.status} />
                      </div>
                      <p className="text-slate-600">
                        {l.borrowerName} · {l.programName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Principal outstanding {formatMoneyExact(l.principalOutstanding)}
                        {l.depositOutstanding > 0 ? ` · deposit outstanding ${formatMoneyExact(l.depositOutstanding)}` : ""}
                      </p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <FormField label="Apply it as">
          <select
            className={inputClass}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as "repayment" | "deposit")}
          >
            <option value="repayment">A repayment</option>
            <option value="deposit">A deposit</option>
          </select>
        </FormField>

        {selected && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            This applies {formatMoneyExact(receipt.amount)} to <strong>{selected.reference}</strong> (
            {selected.borrowerName}) as a {purpose}. Check it before you continue.
          </p>
        )}

        <ErrorNotice message={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={buttonClass("ghost")}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={buttonClass("primary")}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : "Apply receipt"}
          </button>
        </div>
      </form>
    </Modal>
  );
}