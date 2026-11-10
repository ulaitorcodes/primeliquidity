"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import type { MerchantKind, MerchantStatus } from "@/lib/api/finance-types";
import { ApiError } from "@/lib/api/http";
import { createMerchant, listMerchants } from "@/lib/api/merchants";
import { formatDate } from "@/lib/format";
import { merchantKindLabels, merchantKindOptions } from "@/lib/merchant-options";
import { useLoad } from "@/lib/use-load";
import { MerchantStatusBadge } from "@/components/finance/badges";
import { ActionModal } from "@/components/ui/action-modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const selectClass =
  "rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

const tabs: { key: MerchantStatus | ""; label: string }[] = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "suspended", label: "Suspended" },
  { key: "rejected", label: "Rejected" },
];

export default function MerchantsPage() {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<MerchantStatus | "">("");
  const [kind, setKind] = useState<MerchantKind | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loader = useCallback(
    () => listMerchants({ status, kind, search: search || undefined }),
    [status, kind, search]
  );
  const { data, loading, error } = useLoad(loader);
  const merchants = data ?? [];
  const pendingCount = merchants.filter((m) => m.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Merchants</h1>
          <p className="text-sm text-slate-600">
            Schools, landlords, developers and suppliers. Only verified merchants can be paid.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className={buttonClass("primary")}>
          <Plus size={16} /> New merchant
        </button>
      </div>

      <ErrorNotice message={error} />

      {status === "" && pendingCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>
            <span className="font-semibold">{pendingCount}</span> merchant{pendingCount === 1 ? " is" : "s are"} waiting to be
            verified.
          </p>
          <button onClick={() => setStatus("pending")} className="font-medium underline">
            Show them
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, contact or email"
            className={`${selectClass} w-72 pl-9`}
          />
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value as MerchantKind | "")} className={selectClass}>
          <option value="">All kinds</option>
          {merchantKindOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key || "all"}
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
      ) : merchants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No merchants match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Merchant</th>
                <th className="px-5 py-3 font-medium">Kind</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Primary account</th>
                <th className="px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {merchants.map((m) => {
                const primary = m.accounts.find((a) => a.isPrimary) ?? m.accounts[0];
                return (
                  <tr key={m.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-medium text-ink">{m.name}</td>
                    <td className="px-5 py-4 text-slate-600">{merchantKindLabels[m.kind] ?? m.kind}</td>
                    <td className="px-5 py-4">
                      <MerchantStatusBadge status={m.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {m.source === "self_applied" ? "Self-applied" : "Added by admin"}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-800">{m.contactName ?? "—"}</p>
                      <p className="text-xs text-slate-500">{m.contactEmail}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {primary ? (
                        <>
                          {primary.bankName}
                          <span className="block text-xs text-slate-500">
                            ····{primary.accountNumber.slice(-4)}
                            {primary.nameVerified ? " · name verified" : " · name not verified"}
                          </span>
                        </>
                      ) : (
                        <span className="text-amber-700">No account</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(m.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/finance/merchants/${m.id}`} className="font-medium text-brand-700 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <ActionModal
          title="New merchant"
          description="Merchants you add yourself still need to be verified before they can be paid."
          submitLabel="Create merchant"
          wide
          fields={[
            { name: "name", label: "Business name", kind: "text", required: true, full: true },
            {
              name: "kind",
              label: "Type of business",
              kind: "select",
              required: true,
              options: merchantKindOptions,
            },
            { name: "registrationNumber", label: "Registration number", kind: "text" },
            { name: "taxId", label: "Tax ID", kind: "text" },
            { name: "contactName", label: "Contact name", kind: "text", required: true },
            { name: "contactEmail", label: "Contact email", kind: "text", required: true },
            { name: "contactPhone", label: "Contact phone", kind: "text", required: true },
            { name: "address", label: "Address", kind: "textarea" },
            { name: "notes", label: "Notes", kind: "textarea" },
            { name: "bankName", label: "Bank name", kind: "text", helper: "Bank details are optional now but needed before payment." },
            { name: "bankCode", label: "Bank code", kind: "text" },
            { name: "accountNumber", label: "Account number", kind: "text", helper: "10 digits" },
            { name: "accountName", label: "Account name", kind: "text" },
          ]}
          onClose={() => setCreating(false)}
          onSubmit={async (f) => {
            const anyBank = f.bankName || f.accountNumber || f.accountName;
            if (anyBank && !(f.bankName && f.accountNumber && f.accountName)) {
              throw new ApiError(
                "Enter the bank name, account number and account name, or leave all of the bank details blank.",
                400
              );
            }
            if (f.accountNumber && !/^\d{10}$/.test(f.accountNumber)) {
              throw new ApiError("The account number must be exactly 10 digits.", 400);
            }

            const merchant = await createMerchant({
              name: f.name,
              kind: f.kind as MerchantKind,
              contactName: f.contactName,
              contactEmail: f.contactEmail,
              contactPhone: f.contactPhone,
              address: f.address,
              registrationNumber: f.registrationNumber,
              taxId: f.taxId,
              notes: f.notes,
              bankAccount: anyBank
                ? {
                    bankName: f.bankName,
                    bankCode: f.bankCode,
                    accountNumber: f.accountNumber,
                    accountName: f.accountName,
                  }
                : undefined,
            });
            toast.success("Merchant created");
            router.push(`/admin/finance/merchants/${merchant.id}`);
          }}
        />
      )}
    </div>
  );
}