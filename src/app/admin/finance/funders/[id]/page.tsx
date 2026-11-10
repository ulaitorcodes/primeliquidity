"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, Pencil } from "lucide-react";
import {
  contribute,
  getFunder,
  getFundersReport,
  listTransactions,
  updateFunder,
  withdraw,
} from "@/lib/api/finance";
import type { FunderKind } from "@/lib/api/finance-types";
import { formatMoneyExact, todayISO } from "@/lib/format";
import { usePrograms } from "@/lib/programs/programs-context";
import { useLoad } from "@/lib/use-load";
import { ActiveBadge } from "@/components/finance/badges";
import { TransactionsTable } from "@/components/finance/transactions-table";
import { ActionModal, type ActionField } from "@/components/ui/action-modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";

type ModalKind = "contribute" | "withdraw" | "edit" | null;

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

export default function FunderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { programs, getProgram } = usePrograms();
  const [modal, setModal] = useState<ModalKind>(null);

  const funderLoader = useCallback(() => getFunder(id), [id]);
  const funder = useLoad(funderLoader);
  const reportLoader = useCallback(() => getFundersReport(), []);
  const report = useLoad(reportLoader);
  const txLoader = useCallback(() => listTransactions({ funderId: id, limit: 50 }), [id]);
  const txs = useLoad(txLoader);

  function reloadAll() {
    funder.reload();
    report.reload();
    txs.reload();
  }

  const f = funder.data;
  const mine = report.data?.funders.find((x) => x.funderId === id);

  const programOptions = [
    { label: "General pool (no program)", value: "" },
    ...programs.map((p) => ({ label: p.name, value: p.slug })),
  ];

  const moneyFields = (dateName: string, dateLabel: string): ActionField[] => [
    { name: "amount", label: "Amount (₦)", kind: "money", required: true },
    { name: "reference", label: "Reference", kind: "text", required: true, helper: "The bank transfer ID. It must be unique." },
    { name: dateName, label: dateLabel, kind: "date", defaultValue: todayISO() },
    { name: "programSlug", label: "Earmark to program", kind: "select", options: programOptions },
    { name: "note", label: "Note", kind: "textarea" },
  ];

  if (funder.loading && f === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!f) {
    return (
      <div className="space-y-4">
        <Link href="/admin/finance/funders" className="text-sm font-medium text-slate-600 hover:text-ink">
          ← Back to funders
        </Link>
        <ErrorNotice message={funder.error ?? "Funder not found."} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/admin/finance/funders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to funders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">{f.name}</h1>
            <ActiveBadge active={f.isActive} />
          </div>
          <p className="mt-1 text-sm capitalize text-slate-600">
            {f.kind}
            {f.email ? ` · ${f.email}` : ""}
            {f.phone ? ` · ${f.phone}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setModal("edit")} className={buttonClass("outline")}>
            <Pencil size={16} /> Edit
          </button>
          <button onClick={() => setModal("withdraw")} className={buttonClass("outline")}>
            <ArrowUpFromLine size={16} /> Record withdrawal
          </button>
          <button onClick={() => setModal("contribute")} className={buttonClass("primary")}>
            <ArrowDownToLine size={16} /> Record contribution
          </button>
        </div>
      </div>

      <ErrorNotice message={funder.error} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Contributed" value={formatMoneyExact(f.contributed)} />
        <Tile label="Withdrawn" value={formatMoneyExact(f.withdrawn)} />
        <Tile label="Balance" value={formatMoneyExact(f.balance)} />
      </div>

      {f.notes && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-ink">Notes</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{f.notes}</p>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Balance by program</h2>
        <ErrorNotice message={report.error} />
        {report.loading && report.data === null ? (
          <Skeleton className="h-20 w-full" />
        ) : !mine || mine.byProgram.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Not available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Program</th>
                  <th className="py-2 pr-4 font-medium">Contributed</th>
                  <th className="py-2 pr-4 font-medium">Withdrawn</th>
                  <th className="py-2 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mine.byProgram.map((p) => (
                  <tr key={p.programSlug ?? "pool"}>
                    <td className="py-3 pr-4 font-medium text-ink">
                      {p.programName ?? (p.programSlug ? (getProgram(p.programSlug)?.name ?? p.programSlug) : "General pool")}
                    </td>
                    <td className="py-3 pr-4">{formatMoneyExact(p.contributed)}</td>
                    <td className="py-3 pr-4">{formatMoneyExact(p.withdrawn)}</td>
                    <td className="py-3 font-medium text-ink">{formatMoneyExact(p.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Transactions</h2>
        <ErrorNotice message={txs.error} />
        {txs.loading && txs.data === null ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : (
          <TransactionsTable
            transactions={txs.data?.results ?? []}
            emptyMessage="No money movements for this funder yet."
          />
        )}
      </section>

      {modal === "contribute" && (
        <ActionModal
          title="Record contribution"
          description="Capital the funder has put in. Record it only after the money has arrived."
          submitLabel="Record contribution"
          wide
          fields={moneyFields("receivedOn", "Received on")}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await contribute(id, {
              amount: v.amount,
              reference: v.reference,
              receivedOn: v.receivedOn,
              programSlug: v.programSlug,
              note: v.note,
            });
            toast.success("Contribution recorded");
            reloadAll();
          }}
        />
      )}

      {modal === "withdraw" && (
        <ActionModal
          title="Record withdrawal"
          description="Capital paid back to the funder. The server rejects it if there isn't enough balance or cash."
          submitLabel="Record withdrawal"
          wide
          fields={moneyFields("paidOn", "Paid on")}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await withdraw(id, {
              amount: v.amount,
              reference: v.reference,
              paidOn: v.paidOn,
              programSlug: v.programSlug,
              note: v.note,
            });
            toast.success("Withdrawal recorded");
            reloadAll();
          }}
        />
      )}

      {modal === "edit" && (
        <ActionModal
          title="Edit funder"
          submitLabel="Save changes"
          wide
          fields={[
            { name: "name", label: "Name", kind: "text", required: true, full: true, defaultValue: f.name },
            {
              name: "kind",
              label: "Kind",
              kind: "select",
              required: true,
              defaultValue: f.kind,
              options: [
                { label: "Individual", value: "individual" },
                { label: "Company", value: "company" },
              ],
            },
            { name: "phone", label: "Phone", kind: "text", defaultValue: f.phone ?? "" },
            { name: "email", label: "Email", kind: "text", full: true, defaultValue: f.email ?? "" },
            { name: "notes", label: "Notes", kind: "textarea", defaultValue: f.notes ?? "" },
            {
              name: "isActive",
              label: "Status",
              kind: "select",
              required: true,
              defaultValue: f.isActive ? "true" : "false",
              options: [
                { label: "Active", value: "true" },
                { label: "Inactive", value: "false" },
              ],
            },
          ]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            const updated = await updateFunder(id, {
              name: v.name,
              kind: v.kind as FunderKind,
              email: v.email,
              phone: v.phone,
              notes: v.notes,
              isActive: v.isActive === "true",
            });
            funder.setData(updated);
            toast.success("Funder updated");
          }}
        />
      )}
    </div>
  );
}