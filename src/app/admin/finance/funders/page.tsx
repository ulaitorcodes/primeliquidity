"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createFunder, listFunders } from "@/lib/api/finance";
import type { FunderKind } from "@/lib/api/finance-types";
import { formatMoneyExact } from "@/lib/format";
import { useLoad } from "@/lib/use-load";
import { ActiveBadge } from "@/components/finance/badges";
import { ActionModal } from "@/components/ui/action-modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";

export default function FundersPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useLoad(listFunders);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const q = query.trim().toLowerCase();
  const funders = (data ?? []).filter(
    (f) => !q || f.name.toLowerCase().includes(q) || (f.email ?? "").toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Funders</h1>
          <p className="text-sm text-slate-600">People and companies who put capital in.</p>
        </div>
        <button onClick={() => setCreating(true)} className={buttonClass("primary")}>
          <Plus size={16} /> New funder
        </button>
      </div>

      <ErrorNotice message={error} />

      <div className="relative w-full max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {loading && data === null ? (
        <TableSkeleton />
      ) : funders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {(data ?? []).length === 0 ? "No funders yet. Add the first one." : "No funders match your search."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Funder</th>
                <th className="px-5 py-3 font-medium">Kind</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Contributed</th>
                <th className="px-5 py-3 font-medium">Withdrawn</th>
                <th className="px-5 py-3 font-medium">Balance</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {funders.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">{f.name}</p>
                    {f.email && <p className="text-xs text-slate-500">{f.email}</p>}
                  </td>
                  <td className="px-5 py-4 capitalize text-slate-600">{f.kind}</td>
                  <td className="px-5 py-4">
                    <ActiveBadge active={f.isActive} />
                  </td>
                  <td className="px-5 py-4">{formatMoneyExact(f.contributed)}</td>
                  <td className="px-5 py-4">{formatMoneyExact(f.withdrawn)}</td>
                  <td className="px-5 py-4 font-medium text-ink">{formatMoneyExact(f.balance)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/finance/funders/${f.id}`} className="font-medium text-brand-700 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <ActionModal
          title="New funder"
          submitLabel="Create funder"
          wide
          fields={[
            { name: "name", label: "Name", kind: "text", required: true, full: true },
            {
              name: "kind",
              label: "Kind",
              kind: "select",
              required: true,
              defaultValue: "individual",
              options: [
                { label: "Individual", value: "individual" },
                { label: "Company", value: "company" },
              ],
            },
            { name: "phone", label: "Phone", kind: "text" },
            { name: "email", label: "Email", kind: "text", full: true },
            { name: "notes", label: "Notes", kind: "textarea" },
          ]}
          onClose={() => setCreating(false)}
          onSubmit={async (v) => {
            await createFunder({
              name: v.name,
              kind: v.kind as FunderKind,
              email: v.email,
              phone: v.phone,
              notes: v.notes,
            });
            toast.success("Funder created");
            reload();
          }}
        />
      )}
    </div>
  );
}