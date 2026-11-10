"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import type { MerchantKind } from "@/lib/api/finance-types";
import { ApiError } from "@/lib/api/http";
import {
  addBankAccount,
  getMerchant,
  markNameVerified,
  reactivateMerchant,
  rejectMerchant,
  setPrimaryAccount,
  suspendMerchant,
  updateMerchant,
  verifyMerchant,
} from "@/lib/api/merchants";
import { formatDate, formatDateTime } from "@/lib/format";
import { merchantKindLabels, merchantKindOptions } from "@/lib/merchant-options";
import { useLoad } from "@/lib/use-load";
import { MerchantStatusBadge } from "@/components/finance/badges";
import { ActionModal } from "@/components/ui/action-modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";

type ModalKind = "verify" | "reject" | "suspend" | "reactivate" | "edit" | "account" | null;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value || "—"}</dd>
    </div>
  );
}

export default function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const loader = useCallback(() => getMerchant(id), [id]);
  const { data: m, loading, error, reload } = useLoad(loader);
  const [modal, setModal] = useState<ModalKind>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function accountAction(kind: "primary" | "verified", accountId: string) {
    if (
      kind === "verified" &&
      !window.confirm("Confirm that the account name matches the bank's records for this account number?")
    )
      return;

    setBusyKey(`${kind}:${accountId}`);
    try {
      if (kind === "primary") await setPrimaryAccount(id, accountId);
      else await markNameVerified(id, accountId);
      toast.success(kind === "primary" ? "Primary account updated" : "Account name marked as verified");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyKey(null);
    }
  }

  if (loading && m === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!m) {
    return (
      <div className="space-y-4">
        <Link href="/admin/finance/merchants" className="text-sm font-medium text-slate-600 hover:text-ink">
          ← Back to merchants
        </Link>
        <ErrorNotice message={error ?? "Merchant not found."} />
      </div>
    );
  }

  const hasVerifiedAccount = m.accounts.some((a) => a.isActive && a.nameVerified);

  return (
    <div className="space-y-8">
      <Link
        href="/admin/finance/merchants"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to merchants
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">{m.name}</h1>
            <MerchantStatusBadge status={m.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {merchantKindLabels[m.kind] ?? m.kind} · {m.source === "self_applied" ? "Applied on their own" : "Added by an admin"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setModal("edit")} className={buttonClass("outline")}>
            <Pencil size={16} /> Edit
          </button>
          {m.status === "pending" && (
            <>
              <button
                onClick={() => setModal("reject")}
                className={buttonClass("outline", "md", "border-red-200 text-red-700 hover:bg-red-50")}
              >
                Reject
              </button>
              <button onClick={() => setModal("verify")} className={buttonClass("primary")}>
                Verify
              </button>
            </>
          )}
          {m.status === "verified" && (
            <button
              onClick={() => setModal("suspend")}
              className={buttonClass("outline", "md", "border-red-200 text-red-700 hover:bg-red-50")}
            >
              Suspend
            </button>
          )}
          {m.status === "suspended" && (
            <button onClick={() => setModal("reactivate")} className={buttonClass("primary")}>
              Reactivate
            </button>
          )}
        </div>
      </div>

      <ErrorNotice message={error} />

      {m.status === "rejected" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Rejected</p>
          <p className="mt-1">{m.rejectionReason || "No reason was recorded."}</p>
        </div>
      )}

      {m.status === "pending" && !hasVerifiedAccount && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Before verifying, check the business details and confirm the bank account name below.
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Details</h2>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Row label="Contact" value={m.contactName} />
          <Row label="Email" value={m.contactEmail} />
          <Row label="Phone" value={m.contactPhone} />
          <Row label="Registration number" value={m.registrationNumber} />
          <Row label="Tax ID" value={m.taxId} />
          <Row label="Verified on" value={m.verifiedAt ? formatDateTime(m.verifiedAt) : null} />
          <Row label="Added" value={formatDate(m.createdAt)} />
          <div className="sm:col-span-2">
            <Row label="Address" value={m.address} />
          </div>
          {m.notes && (
            <div className="sm:col-span-3">
              <Row label="Notes" value={<span className="whitespace-pre-line">{m.notes}</span>} />
            </div>
          )}
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-ink">Bank accounts</h2>
          <button onClick={() => setModal("account")} className={buttonClass("outline")}>
            <Plus size={16} /> Add account
          </button>
        </div>

        {m.accounts.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            No bank account yet. Add one so this merchant can be paid.
          </p>
        ) : (
          <ul className="space-y-3">
            {m.accounts.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{a.accountName}</p>
                    <p className="text-sm text-slate-600">
                      {a.bankName} · {a.accountNumber}
                      {a.bankCode ? ` · code ${a.bankCode}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-medium">
                      {a.isPrimary && (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700">Primary</span>
                      )}
                      <span
                        className={
                          a.nameVerified
                            ? "rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700"
                            : "rounded-full bg-amber-50 px-2 py-0.5 text-amber-700"
                        }
                      >
                        {a.nameVerified ? "Name verified" : "Name not verified"}
                      </span>
                      {!a.isActive && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">Inactive</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!a.nameVerified && (
                      <button
                        disabled={busyKey !== null}
                        onClick={() => accountAction("verified", a.id)}
                        className={buttonClass("outline")}
                      >
                        Mark name verified
                      </button>
                    )}
                    {!a.isPrimary && a.isActive && (
                      <button
                        disabled={busyKey !== null}
                        onClick={() => accountAction("primary", a.id)}
                        className={buttonClass("ghost")}
                      >
                        Make primary
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {modal === "verify" && (
        <ActionModal
          title="Verify this merchant?"
          description="Once verified, loans can be paid out to this merchant. Check the business details and bank account first."
          submitLabel="Verify merchant"
          fields={[]}
          onClose={() => setModal(null)}
          onSubmit={async () => {
            await verifyMerchant(id);
            toast.success("Merchant verified");
            reload();
          }}
        />
      )}

      {modal === "reject" && (
        <ActionModal
          title="Reject this merchant?"
          description="The reason is recorded on the merchant."
          submitLabel="Reject merchant"
          destructive
          fields={[{ name: "reason", label: "Reason", kind: "textarea", required: true }]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await rejectMerchant(id, v.reason);
            toast.success("Merchant rejected");
            reload();
          }}
        />
      )}

      {modal === "suspend" && (
        <ActionModal
          title="Suspend this merchant?"
          description="They can't be paid while suspended."
          submitLabel="Suspend merchant"
          destructive
          fields={[{ name: "reason", label: "Reason", kind: "textarea", required: true }]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await suspendMerchant(id, v.reason);
            toast.success("Merchant suspended");
            reload();
          }}
        />
      )}

      {modal === "reactivate" && (
        <ActionModal
          title="Reactivate this merchant?"
          description="They can be paid again."
          submitLabel="Reactivate"
          fields={[]}
          onClose={() => setModal(null)}
          onSubmit={async () => {
            await reactivateMerchant(id);
            toast.success("Merchant reactivated");
            reload();
          }}
        />
      )}

      {modal === "edit" && (
        <ActionModal
          title="Edit merchant"
          submitLabel="Save changes"
          wide
          fields={[
            { name: "name", label: "Business name", kind: "text", required: true, full: true, defaultValue: m.name },
            {
              name: "kind",
              label: "Type of business",
              kind: "select",
              required: true,
              options: merchantKindOptions,
              defaultValue: m.kind,
            },
            { name: "registrationNumber", label: "Registration number", kind: "text", defaultValue: m.registrationNumber ?? "" },
            { name: "taxId", label: "Tax ID", kind: "text", defaultValue: m.taxId ?? "" },
            { name: "contactName", label: "Contact name", kind: "text", defaultValue: m.contactName ?? "" },
            { name: "contactEmail", label: "Contact email", kind: "text", defaultValue: m.contactEmail ?? "" },
            { name: "contactPhone", label: "Contact phone", kind: "text", defaultValue: m.contactPhone ?? "" },
            { name: "address", label: "Address", kind: "textarea", defaultValue: m.address ?? "" },
            { name: "notes", label: "Notes", kind: "textarea", defaultValue: m.notes ?? "" },
          ]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            await updateMerchant(id, {
              name: v.name,
              kind: v.kind as MerchantKind,
              registrationNumber: v.registrationNumber,
              taxId: v.taxId,
              contactName: v.contactName,
              contactEmail: v.contactEmail,
              contactPhone: v.contactPhone,
              address: v.address,
              notes: v.notes,
            });
            toast.success("Merchant updated");
            reload();
          }}
        />
      )}

      {modal === "account" && (
        <ActionModal
          title="Add bank account"
          description="The account name must match the name on the account. Mark it as verified once you've confirmed it."
          submitLabel="Add account"
          wide
          fields={[
            { name: "bankName", label: "Bank name", kind: "text", required: true },
            { name: "bankCode", label: "Bank code (optional)", kind: "text" },
            { name: "accountNumber", label: "Account number", kind: "text", required: true, helper: "10 digits" },
            { name: "accountName", label: "Account name", kind: "text", required: true },
          ]}
          onClose={() => setModal(null)}
          onSubmit={async (v) => {
            if (!/^\d{10}$/.test(v.accountNumber)) {
              throw new ApiError("The account number must be exactly 10 digits.", 400);
            }
            await addBankAccount(id, {
              bankName: v.bankName,
              bankCode: v.bankCode,
              accountNumber: v.accountNumber,
              accountName: v.accountName,
            });
            toast.success("Bank account added");
            reload();
          }}
        />
      )}
    </div>
  );
}