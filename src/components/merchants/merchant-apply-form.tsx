"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { applyAsMerchant } from "@/lib/api/merchants";
import type { MerchantKind } from "@/lib/api/finance-types";
import { ApiError } from "@/lib/api/http";
import { merchantKindOptions } from "@/lib/merchant-options";
import { ErrorNotice } from "@/components/ui/error-notice";
import { FormField, inputClass } from "@/components/ui/form-field";
import { buttonClass } from "@/components/ui/button";

type Values = {
  name: string;
  kind: string;
  address: string;
  registrationNumber: string;
  taxId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  notes: string;
};

const empty: Values = {
  name: "",
  kind: "",
  address: "",
  registrationNumber: "",
  taxId: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  bankName: "",
  bankCode: "",
  accountNumber: "",
  accountName: "",
  notes: "",
};

const BANK_FIELDS = ["bankName", "bankCode", "accountNumber", "accountName"];

export function MerchantApplyForm() {
  const [v, setV] = useState<Values>(empty);
  const [local, setLocal] = useState<Record<string, string>>({});
  const [server, setServer] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string } | null>(null);
  const submitting = useRef(false);

  function set(name: keyof Values, value: string) {
    setV((prev) => ({ ...prev, [name]: value }));
    setLocal((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setServer({});
  }

  /** The nested bank account errors might come back as "accountNumber" or "bankAccount.accountNumber". */
  function errorFor(name: string) {
    if (local[name]) return local[name];
    const keys = BANK_FIELDS.includes(name)
      ? [name, `bankAccount.${name}`, `bankAccount_${name}`]
      : [name];
    for (const k of keys) if (server[k]?.[0]) return server[k][0];
    return undefined;
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!v.name.trim()) e.name = "Enter the business name";
    if (!v.kind) e.kind = "Choose the type of business";
    if (!v.contactName.trim()) e.contactName = "Enter a contact person";
    if (!/^\S+@\S+\.\S+$/.test(v.contactEmail.trim())) e.contactEmail = "Enter a valid email address";
    if (v.contactPhone.replace(/\D/g, "").length < 10) e.contactPhone = "Enter a valid phone number";
    if (!v.bankName.trim()) e.bankName = "Enter the bank name";
    if (!/^\d{10}$/.test(v.accountNumber.trim())) e.accountNumber = "Account number must be exactly 10 digits";
    if (!v.accountName.trim()) e.accountName = "Enter the account name";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    setFormError(null);

    const errs = validate();
    setLocal(errs);
    if (Object.keys(errs).length) return;

    submitting.current = true;
    setBusy(true);
    try {
      const res = await applyAsMerchant({
        name: v.name.trim(),
        kind: v.kind as MerchantKind,
        contactName: v.contactName.trim(),
        contactEmail: v.contactEmail.trim().toLowerCase(),
        contactPhone: v.contactPhone.trim(),
        address: v.address.trim() || undefined,
        registrationNumber: v.registrationNumber.trim() || undefined,
        taxId: v.taxId.trim() || undefined,
        notes: v.notes.trim() || undefined,
        bankAccount: {
          bankName: v.bankName.trim(),
          bankCode: v.bankCode.trim() || undefined,
          accountNumber: v.accountNumber.trim(),
          accountName: v.accountName.trim(),
        },
      });
      setDone({ name: res.name });
    } catch (err) {
      if (err instanceof ApiError) {
        setServer(err.fieldErrors);
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setBusy(false);
      submitting.current = false;
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-8 text-center">
        <CheckCircle2 className="mx-auto text-brand-600" size={48} />
        <h2 className="mt-4 text-2xl font-semibold text-ink">Application received</h2>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          Thank you. We'll verify the details for <span className="font-medium text-ink">{done.name}</span> and contact you at{" "}
          {v.contactEmail}. You can be paid once your business and bank account are verified.
        </p>
        <Link href="/" className={buttonClass("primary", "md", "mt-6")}>
          Back home
        </Link>
      </div>
    );
  }

  const input = (name: keyof Values, label: string, opts: { required?: boolean; helper?: string; placeholder?: string; inputMode?: "numeric" | "tel" | "email" } = {}) => (
    <FormField label={label} required={opts.required} error={errorFor(name)} helper={opts.helper}>
      <input
        className={inputClass}
        value={v[name]}
        placeholder={opts.placeholder}
        inputMode={opts.inputMode}
        onChange={(e) => set(name, e.target.value)}
      />
    </FormField>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-ink">Business details</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">{input("name", "Business name", { required: true })}</div>
          <FormField label="Type of business" required error={errorFor("kind")}>
            <select className={inputClass} value={v.kind} onChange={(e) => set("kind", e.target.value)}>
              <option value="">Select...</option>
              {merchantKindOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
          {input("registrationNumber", "Registration number (optional)")}
          {input("taxId", "Tax ID (optional)")}
          <div className="sm:col-span-2">
            <FormField label="Address (optional)" error={errorFor("address")}>
              <textarea
                rows={2}
                className={inputClass}
                value={v.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-ink">Contact person</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">{input("contactName", "Full name", { required: true })}</div>
          {input("contactEmail", "Email address", { required: true, inputMode: "email" })}
          {input("contactPhone", "Phone number", { required: true, inputMode: "tel", placeholder: "080..." })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-ink">Bank account for payments</h2>
        <p className="mt-1 text-sm text-slate-600">
          Payments are made to this account. The account name must match the name on the account, because we verify it before paying.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {input("bankName", "Bank name", { required: true })}
          {input("bankCode", "Bank code (optional)")}
          {input("accountNumber", "Account number", { required: true, inputMode: "numeric", helper: "10 digits" })}
          {input("accountName", "Account name", { required: true })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <FormField label="Anything else we should know? (optional)" error={errorFor("notes")}>
          <textarea
            rows={3}
            className={inputClass}
            value={v.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </FormField>
      </section>

      <ErrorNotice message={formError} />

      <button type="submit" disabled={busy} className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : "Submit application"}
      </button>
    </form>
  );
}