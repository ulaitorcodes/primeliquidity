"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { listKycProfiles, startKyc, type KycStatus } from "@/lib/api/kyc";
import { formatDate } from "@/lib/format";
import { kycStatusLabels } from "@/lib/kyc-options";
import { useLoad } from "@/lib/use-load";
import { KycStatusBadge } from "@/components/kyc/kyc-status-badge";
import { ActionModal } from "@/components/ui/action-modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs: { key: KycStatus | ""; label: string }[] = [
  { key: "", label: "All" },
  { key: "submitted", label: "Waiting for review" },
  { key: "changes_requested", label: kycStatusLabels.changes_requested },
  { key: "approved", label: kycStatusLabels.approved },
  { key: "rejected", label: kycStatusLabels.rejected },
  { key: "draft", label: kycStatusLabels.draft },
];

export function KycQueue({
  basePath,
  title,
  subtitle,
  defaultStatus = "",
  allowStart = false,
}: {
  /** Where a row opens, e.g. "/admin/kyc" */
  basePath: string;
  title: string;
  subtitle: string;
  defaultStatus?: KycStatus | "";
  /** Agents can start KYC for a person by email */
  allowStart?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<KycStatus | "">(defaultStatus);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loader = useCallback(
    () => listKycProfiles({ status, search: search || undefined }),
    [status, search]
  );
  const { data, loading, error } = useLoad(loader);
  const items = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
        {allowStart && (
          <button onClick={() => setStarting(true)} className={buttonClass("primary")}>
            <Plus size={16} /> Start KYC for a person
          </button>
        )}
      </div>

      <ErrorNotice message={error} />

      <div className="relative w-full max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name or email"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
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
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Nothing here.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Person</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3 font-medium">Reviewed</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((k) => (
                <tr key={k.id ?? k.email} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">{k.legalName || "—"}</p>
                    <p className="text-xs text-slate-500">{k.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <KycStatusBadge status={k.status} />
                  </td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(k.submittedAt)}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(k.reviewedAt)}</td>
                  <td className="px-5 py-4 text-right">
                    {k.id && (
                      <Link href={`${basePath}/${k.id}`} className="font-medium text-brand-700 hover:underline">
                        Open
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {starting && (
        <ActionModal
          title="Start KYC for a person"
          description="You can only start it for people you registered or are assigned. If they already started, this opens their profile."
          submitLabel="Start KYC"
          fields={[{ name: "email", label: "Their email address", kind: "text", required: true }]}
          onClose={() => setStarting(false)}
          onSubmit={async (v) => {
            const kyc = await startKyc(v.email);
            toast.success("KYC started");
            if (kyc.id) router.push(`${basePath}/${kyc.id}`);
          }}
        />
      )}
    </div>
  );
}