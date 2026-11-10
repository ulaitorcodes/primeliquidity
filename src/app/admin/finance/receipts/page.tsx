"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { listReceipts, simulateUnknownTransfer, type HeldReceipt, type ReceiptStatus } from "@/lib/api/payments";
import { formatDateTime, formatMoneyExact, humanize } from "@/lib/format";
import { useLoad } from "@/lib/use-load";
import { ApplyReceiptModal } from "@/components/payments/apply-receipt-modal";
import { ActionModal } from "@/components/ui/action-modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const isDev = process.env.NODE_ENV !== "production";

const tabs: { key: ReceiptStatus; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "applied", label: "Applied" },
];

export default function ReceiptsPage() {
  const toast = useToast();
  const [status, setStatus] = useState<ReceiptStatus>("open");
  const [applying, setApplying] = useState<HeldReceipt | null>(null);
  const [simulating, setSimulating] = useState(false);

  const loader = useCallback(() => listReceipts(status), [status]);
  const { data, loading, error, reload } = useLoad(loader);
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Held receipts</h1>
        <p className="text-sm text-slate-600">
          Money that reached the bank but couldn't be applied to a loan. Apply it to the right loan once you've
          checked.
        </p>
      </div>

      <ErrorNotice message={error} />

      {data && !data.reconciled && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <p>
            The held receipts ({formatMoneyExact(data.openTotal)}) don't match the ledger balance (
            {formatMoneyExact(data.ledgerBalance)}).{" "}
            <Link href="/admin/finance/integrity" className="font-semibold underline">
              Run the integrity check
            </Link>{" "}
            and find out why.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Open total</p>
          {loading && data === null ? (
            <Skeleton className="mt-3 h-8 w-32" />
          ) : (
            <p className="mt-2 text-2xl font-bold text-ink">{formatMoneyExact(data?.openTotal)}</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Ledger balance</p>
          {loading && data === null ? (
            <Skeleton className="mt-3 h-8 w-32" />
          ) : (
            <p className="mt-2 text-2xl font-bold text-ink">{formatMoneyExact(data?.ledgerBalance)}</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Reconciled</p>
          {loading && data === null ? (
            <Skeleton className="mt-3 h-8 w-24" />
          ) : data ? (
            <p
              className={cn(
                "mt-2 inline-flex items-center gap-2 text-lg font-bold",
                data.reconciled ? "text-emerald-700" : "text-red-600"
              )}
            >
              {data.reconciled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
              {data.reconciled ? "Yes" : "No"}
            </p>
          ) : (
            <p className="mt-2 text-lg font-bold text-slate-400">—</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              status === t.key
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && data === null ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {status === "open" ? "No held receipts. Everything that arrived was matched to a loan." : "Nothing has been applied yet."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Received</th>
                <th className="px-5 py-3 font-medium">Provider</th>
                <th className="px-5 py-3 font-medium">Account</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Payer</th>
                <th className="px-5 py-3 font-medium">Why it's held</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((r) => (
                <tr key={r.id} className="align-top hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDateTime(r.receivedAt)}</td>
                  <td className="px-5 py-4 capitalize text-slate-600">{r.provider}</td>
                  <td className="px-5 py-4 font-mono text-slate-700">{r.accountNumber ?? "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-ink">{formatMoneyExact(r.amount)}</td>
                  <td className="px-5 py-4 text-slate-700">{r.payerName ?? "—"}</td>
                  <td className="px-5 py-4">
                    <p className="text-slate-700">{humanize(r.outcome)}</p>
                    {r.reason && <p className="text-xs text-slate-500">{r.reason}</p>}
                  </td>
                  <td className="px-5 py-4">
                    {r.appliedLoanId ? (
                      <div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          Applied
                        </span>
                        <Link
                          href={`/admin/finance/loans/${r.appliedLoanId}`}
                          className="mt-1 block text-xs font-medium text-brand-700 hover:underline"
                        >
                          View loan
                        </Link>
                      </div>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                        Open
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {!r.appliedLoanId && (
                      <button onClick={() => setApplying(r)} className={buttonClass("primary")}>
                        Apply to loan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isDev && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Local testing only</p>
          <p className="mt-1 text-sm text-slate-600">
            Pretend money arrived for an account the system doesn't know, to see it appear here.
          </p>
          <button onClick={() => setSimulating(true)} className={buttonClass("outline", "md", "mt-3")}>
            Simulate an unknown transfer
          </button>
        </div>
      )}

      {applying && (
        <ApplyReceiptModal
          receipt={applying}
          onClose={() => setApplying(null)}
          onDone={() => {
            setApplying(null);
            toast.success("Receipt applied");
            reload();
          }}
        />
      )}

      {simulating && (
        <ActionModal
          title="Simulate an unknown transfer"
          description="Local testing only. The backend ignores this in production."
          submitLabel="Simulate"
          fields={[
            { name: "accountNumber", label: "Account number", kind: "text", required: true, placeholder: "0123456789" },
            { name: "amount", label: "Amount (₦)", kind: "money", required: true },
          ]}
          onClose={() => setSimulating(false)}
          onSubmit={async (v) => {
            await simulateUnknownTransfer(v.accountNumber, v.amount);
            toast.success("Simulated");
            reload();
          }}
        />
      )}
    </div>
  );
}