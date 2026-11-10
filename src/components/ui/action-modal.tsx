"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/http";
import { parseMoneyInput } from "@/lib/money";
import { Modal } from "@/components/ui/modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { FormField, inputClass } from "@/components/ui/form-field";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActionField {
  name: string;
  label: string;
  kind: "text" | "money" | "date" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  helper?: string;
  defaultValue?: string;
  options?: { label: string; value: string }[];
  /** span both columns */
  full?: boolean;
}

export function ActionModal({
  title,
  description,
  submitLabel,
  fields,
  destructive = false,
  wide = false,
  onClose,
  onSubmit,
}: {
  title: string;
  description?: string;
  submitLabel: string;
  fields: ActionField[];
  destructive?: boolean;
  wide?: boolean;
  onClose: () => void;
  /** Gets only non-empty, trimmed values. Throw (e.g. ApiError) to keep the modal open. */
  onSubmit: (values: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""]))
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ transactionId: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  function setValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current || duplicate) return;
    setFormError(null);

    const local: Record<string, string> = {};
    const out: Record<string, string> = {};

    for (const f of fields) {
      const raw = (values[f.name] ?? "").trim();

      if (f.kind === "money") {
        const parsed = parseMoneyInput(raw);
        if (parsed.error) local[f.name] = parsed.error;
        else if (!parsed.value) {
          if (f.required) local[f.name] = `${f.label} is required`;
        } else out[f.name] = parsed.value;
        continue;
      }

      if (!raw) {
        if (f.required) local[f.name] = `${f.label} is required`;
        continue;
      }
      out[f.name] = raw;
    }

    setErrors(local);
    if (Object.keys(local).length) return;

    submitting.current = true;
    setBusy(true);
    try {
      await onSubmit(out);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          const id = err.data.transactionId;
          setDuplicate({ transactionId: typeof id === "string" ? id : null });
        } else {
          const fe: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(err.fieldErrors)) if (msgs[0]) fe[key] = msgs[0];
          setErrors(fe);
          setFormError(err.message);
        }
      } else {
        console.error(err);
        setFormError(
          err instanceof Error && err.message
            ? `Something went wrong: ${err.message}`
            : "Something went wrong. Please try again."
        );
      }
      setBusy(false);
      submitting.current = false;
    }
  }

  return (
    <Modal open onClose={onClose} title={title} wide={wide}>
      {description && <p className="mb-4 text-sm text-slate-600">{description}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={cn((f.full || f.kind === "textarea") && "sm:col-span-2")}>
                <FormField
                  label={f.label}
                  required={f.required}
                  error={errors[f.name]}
                  helper={f.helper}
                >
                  {f.kind === "textarea" ? (
                    <textarea
                      rows={3}
                      className={inputClass}
                      value={values[f.name]}
                      placeholder={f.placeholder}
                      disabled={!!duplicate}
                      onChange={(e) => setValue(f.name, e.target.value)}
                    />
                  ) : f.kind === "select" ? (
                    <select
                      className={inputClass}
                      value={values[f.name]}
                      disabled={!!duplicate}
                      onChange={(e) => setValue(f.name, e.target.value)}
                    >
                      {f.required && <option value="">Select...</option>}
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.kind === "date" ? "date" : "text"}
                      inputMode={f.kind === "money" ? "decimal" : undefined}
                      className={inputClass}
                      value={values[f.name]}
                      placeholder={f.kind === "money" ? (f.placeholder ?? "0.00") : f.placeholder}
                      disabled={!!duplicate}
                      onChange={(e) => setValue(f.name, e.target.value)}
                    />
                  )}
                </FormField>
              </div>
            ))}
          </div>
        )}

        {duplicate && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Already recorded</p>
            <p className="mt-1">
              A transaction with this reference already exists, so nothing was saved. Don't submit it again.
            </p>
            {duplicate.transactionId && (
              <Link
                href={`/admin/finance/journal/${duplicate.transactionId}`}
                className="mt-2 inline-block font-medium underline"
              >
                View the existing transaction
              </Link>
            )}
          </div>
        )}

        <ErrorNotice message={formError} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={buttonClass("ghost")}>
            {duplicate ? "Close" : "Cancel"}
          </button>
          {!duplicate && (
            <button
              type="submit"
              disabled={busy}
              className={buttonClass(
                "primary",
                "md",
                destructive ? "bg-red-600 hover:bg-red-700" : undefined
              )}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : submitLabel}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}