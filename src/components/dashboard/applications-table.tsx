"use client";

import Link from "next/link";
import type { Application } from "@/lib/api/applications";
import { useKycStatuses } from "@/lib/api/use-kyc-statuses";
import { usePrograms } from "@/lib/programs/programs-context";
import { KycStatusBadge } from "@/components/kyc/kyc-status-badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./status-badge";

export interface RowSelection {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[], checked: boolean) => void;
}

export function ApplicationsTable({
  applications,
  loading = false,
  showApplicant = false,
  showAgent = false,
  showKyc,
  selection,
  detailHref,
  emptyMessage = "No applications yet.",
}: {
  applications: Application[];
  loading?: boolean;
  showApplicant?: boolean;
  showAgent?: boolean;
  /** Defaults to showApplicant: admin and agent lists show KYC, applicants' own lists don't */
  showKyc?: boolean;
  selection?: RowSelection;
  detailHref?: (a: Application) => string;
  emptyMessage?: string;
}) {
  const { getProgram } = usePrograms();
  const kycOn = showKyc ?? showApplicant;
  const kyc = useKycStatuses(
    applications.map((a) => a.applicantEmail),
    kycOn && !loading
  );

  if (loading) return <TableSkeleton />;

  if (applications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  const allSelected = !!selection && applications.every((a) => selection.selected.has(a.id));

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {selection && (
              <th className="w-10 px-5 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) =>
                    selection.onToggleAll(
                      applications.map((a) => a.id),
                      e.target.checked
                    )
                  }
                  aria-label="Select all"
                  className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                />
              </th>
            )}
            <th className="px-5 py-3 font-medium">Reference</th>
            <th className="px-5 py-3 font-medium">Program</th>
            {showApplicant && <th className="px-5 py-3 font-medium">Applicant</th>}
            {kycOn && <th className="px-5 py-3 font-medium">KYC</th>}
            {showAgent && <th className="px-5 py-3 font-medium">Source</th>}
            <th className="px-5 py-3 font-medium">Date</th>
            <th className="px-5 py-3 font-medium">Status</th>
            {detailHref && <th className="px-5 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applications.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50/60">
              {selection && (
                <td className="px-5 py-4">
                  <input
                    type="checkbox"
                    checked={selection.selected.has(a.id)}
                    onChange={() => selection.onToggle(a.id)}
                    aria-label={`Select ${a.reference}`}
                    className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                  />
                </td>
              )}
              <td className="px-5 py-4 font-medium text-ink">{a.reference}</td>
              <td className="px-5 py-4 text-slate-700">
                {getProgram(a.programSlug)?.name ?? a.programSlug}
              </td>
              {showApplicant && (
                <td className="px-5 py-4">
                  <p className="text-slate-800">{a.applicantName}</p>
                  <p className="text-xs text-slate-500">{a.applicantEmail}</p>
                </td>
              )}
              {kycOn && (
                <td className="px-5 py-4">
                  {kyc.ready ? (
                    <KycStatusBadge status={kyc.statuses[a.applicantEmail.toLowerCase()] ?? "not_started"} />
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              )}
              {showAgent && (
                <td className="px-5 py-4">
                  {a.agent ? (
                    <>
                      <p className="text-slate-800">{a.agent.name}</p>
                      <p className="text-xs text-slate-500">{a.agent.code}</p>
                    </>
                  ) : (
                    <span className="text-slate-500">Direct</span>
                  )}
                  {a.assignedAgent && (
                    <p className="mt-0.5 text-xs text-blue-700">Assigned: {a.assignedAgent.name}</p>
                  )}
                </td>
              )}
              <td className="px-5 py-4 text-slate-600">
                {new Date(a.submittedAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={a.status} />
              </td>
              {detailHref && (
                <td className="px-5 py-4 text-right">
                  <Link href={detailHref(a)} className="font-medium text-brand-700 hover:underline">
                    View
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}