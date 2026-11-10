"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Landmark } from "lucide-react";
import type { ApplicationDetail } from "@/lib/api/applications";
import { listLoans } from "@/lib/api/finance";
import { formatMoneyExact } from "@/lib/format";
import { usePrograms } from "@/lib/programs/programs-context";
import { useLoad } from "@/lib/use-load";
import { LoanStatusBadge } from "@/components/finance/badges";
import { CreateLoanModal } from "@/components/finance/create-loan-modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";

export function ApplicationLoanCard({ application }: { application: ApplicationDetail }) {
  const router = useRouter();
  const toast = useToast();
  const { getProgram } = usePrograms();
  const loader = useCallback(() => listLoans({ applicationId: application.id }), [application.id]);
  const { data: loans, loading, error } = useLoad(loader);
  const [open, setOpen] = useState(false);

  const openLoans = (loans ?? []).filter((l) => l.status !== "cancelled");
  const canCreate = application.status === "approved" && openLoans.length === 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <Landmark size={18} className="text-brand-600" /> Loan
        </h2>
        {canCreate && (
          <button onClick={() => setOpen(true)} className={buttonClass("primary")}>
            Create loan
          </button>
        )}
      </div>

      <div className="mt-4">
        <ErrorNotice message={error} />
        {loading && loans === null ? (
          <Skeleton className="h-10 w-full" />
        ) : (loans ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">
            {application.status === "approved"
              ? "No loan has been created for this application yet."
              : "A loan can be created once this application is approved."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(loans ?? []).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <Link href={`/admin/finance/loans/${l.id}`} className="font-medium text-brand-700 hover:underline">
                    {l.reference}
                  </Link>
                  <p className="text-xs text-slate-500">
                    Invoice {formatMoneyExact(l.invoiceTotal)} · financed {formatMoneyExact(l.principal)}
                  </p>
                </div>
                <LoanStatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && (
        <CreateLoanModal
          application={application}
          program={getProgram(application.programSlug)}
          onClose={() => setOpen(false)}
          onCreated={(loan) => {
            toast.success("Loan created");
            router.push(`/admin/finance/loans/${loan.id}`);
          }}
        />
      )}
    </section>
  );
}