"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert, XCircle } from "lucide-react";
import {
  authorizeDisbursement,
  cancelDisbursement,
  resendDisbursementCode,
} from "@/lib/api/finance";
import type { Disbursement } from "@/lib/api/finance-types";
import { formatDateTime } from "@/lib/format";
import { ErrorNotice } from "@/components/ui/error-notice";
import { FormField, inputClass } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";

function messageOf(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function AuthorizeModal({
  disbursement: d,
  onClose,
  onChanged,
}: {
  disbursement: Disbursement;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Disbursement | null>(null);
  const submitting = useRef(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code");
      return;
    }

    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      setResult(await authorizeDisbursement(d.id, code.trim()));
    } catch (err) {
      setError(messageOf(err, "Authorization failed"));
    } finally {
      submitting.current = false;
      setBusy(false);
      onChanged(); // refresh attempts left / status behind the modal
    }
  }

  if (result) {
    return (
      <Modal open onClose={onClose} title="Deployment result">
        {result.status === "completed" && (
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900">
            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold">Payment completed</p>
              {result.providerReference && <p className="mt-1">Provider reference: {result.providerReference}</p>}
            </div>
          </div>
        )}

        {result.status === "failed" && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-900">
            <XCircle className="mt-0.5 shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold">Payment failed. No money moved.</p>
              {result.failureReason && <p className="mt-1">{result.failureReason}</p>}
            </div>
          </div>
        )}

        {result.status === "processing" && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <TriangleAlert className="mt-0.5 shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold">The provider has not confirmed this payment yet.</p>
              <p className="mt-1">
                Do <strong>not</strong> retry. Check with the payment provider before doing anything else.
              </p>
              {result.providerReference && <p className="mt-1">Provider reference: {result.providerReference}</p>}
            </div>
          </div>
        )}

        {!["completed", "failed", "processing"].includes(result.status) && (
          <p className="text-sm text-slate-700">Status: {result.status}</p>
        )}

        <button onClick={onClose} className={buttonClass("primary", "md", "mt-6 w-full")}>
          Close
        </button>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Authorize deployment">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Enter the 6-digit code that was emailed to the authorizing admin. Nothing is paid until it is accepted.
        </p>

        <FormField label="Code" required>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className={`${inputClass} text-center text-lg tracking-[0.4em]`}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ""));
              setError(null);
            }}
            placeholder="000000"
          />
        </FormField>

        <div className="space-y-1 text-xs text-slate-500">
          {d.codeExpiresAt && <p>Expires {formatDateTime(d.codeExpiresAt)}.</p>}
          {d.codeAttemptsLeft !== null && d.codeAttemptsLeft !== undefined && (
            <p>Attempts left: {d.codeAttemptsLeft}. Too many wrong tries cancels this deployment.</p>
          )}
        </div>

        <ErrorNotice message={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={buttonClass("ghost")}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={buttonClass("primary")}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : "Authorize and pay"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DisbursementActions({
  disbursement: d,
  onChanged,
}: {
  disbursement: Disbursement;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [authorizing, setAuthorizing] = useState(false);
  const [busy, setBusy] = useState<"resend" | "cancel" | null>(null);
  const pending = d.status === "pending_authorization";

  async function resend() {
    setBusy("resend");
    try {
      await resendDisbursementCode(d.id);
      toast.success("A new code has been emailed");
      onChanged();
    } catch (err) {
      toast.error(messageOf(err, "Couldn't resend the code"));
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    if (!window.confirm("Cancel this deployment? Nothing has been paid yet.")) return;
    setBusy("cancel");
    try {
      await cancelDisbursement(d.id);
      toast.success("Deployment cancelled");
      onChanged();
    } catch (err) {
      toast.error(messageOf(err, "Couldn't cancel the deployment"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {pending && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAuthorizing(true)} className={buttonClass("primary")}>
            Enter code
          </button>
          <button disabled={busy !== null} onClick={resend} className={buttonClass("outline")}>
            {busy === "resend" ? <Loader2 size={16} className="animate-spin" /> : "Resend code"}
          </button>
          <button
            disabled={busy !== null}
            onClick={cancel}
            className={buttonClass("ghost", "md", "text-red-700 hover:bg-red-50")}
          >
            Cancel
          </button>
        </div>
      )}

      {authorizing && (
        <AuthorizeModal
          disbursement={d}
          onClose={() => setAuthorizing(false)}
          onChanged={onChanged}
        />
      )}
    </>
  );
}
