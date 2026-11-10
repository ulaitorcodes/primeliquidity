"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Copy, Loader2, TriangleAlert } from "lucide-react";
import { ApiError } from "@/lib/api/http";
import {
  createPayment,
  getPayment,
  simulateBankConfirmation,
  type PayBody,
  type Payment,
  type PayTarget,
} from "@/lib/api/payments";
import { useSession } from "@/lib/auth/use-session";
import { formatDateTime, formatDay, formatMoneyExact } from "@/lib/format";
import {
  coverage,
  formatCountdown,
  purposeTitle,
  remainingNaira,
} from "@/lib/payments-format";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";
import { PaymentStatusBadge } from "./payment-badge";

const isDev = process.env.NODE_ENV !== "production";

/** Rebuild the request body from an existing payment (to create a fresh one). */
function bodyFrom(p: Payment): PayBody {
  return {
    purpose: p.purpose,
    installmentNumber:
      p.purpose === "installment" && p.installmentNumber ? p.installmentNumber : undefined,
    amount: p.purpose === "custom" ? p.amount.toFixed(2) : undefined,
  };
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const toast = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied the ${label}`);
    } catch {
      toast.error("Couldn't copy. Select it and copy it by hand.");
    }
  }

  return (
    <button type="button" onClick={copy} className={buttonClass("outline")}>
      <Copy size={16} /> Copy
    </button>
  );
}

export function PayModal({
  target,
  existing,
  onClose,
  onSettled,
}: {
  /** Create a new payment request for this */
  target?: PayTarget;
  /** Or open a request that already exists (resume) */
  existing?: Payment;
  onClose: () => void;
  /** Called once the bank has confirmed all or part of the payment */
  onSettled?: () => void;
}) {
  const toast = useToast();
  const { user } = useSession();
  const loanId = (existing?.loanId ?? target?.loanId) as string;

  const [payment, setPayment] = useState<Payment | null>(existing ?? null);
  const [creating, setCreating] = useState(!existing);
  const [problem, setProblem] = useState<{ message: string; unavailable: boolean } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [simBusy, setSimBusy] = useState(false);

  const lastBody = useRef<PayBody | null>(existing ? bodyFrom(existing) : null);
  const started = useRef(false);
  const settled = useRef(false);
  const onSettledRef = useRef(onSettled);

  useEffect(() => {
    onSettledRef.current = onSettled;
  }, [onSettled]);

  const create = useCallback(
    async (body: PayBody) => {
      lastBody.current = body;
      settled.current = false;
      setCreating(true);
      setProblem(null);
      try {
        setPayment(await createPayment(loanId, body));
      } catch (err) {
        setPayment(null);
        setProblem({
          message: err instanceof Error ? err.message : "Couldn't set up the payment.",
          unavailable: err instanceof ApiError && err.status === 503,
        });
      } finally {
        setCreating(false);
      }
    },
    [loanId]
  );

  // Create the request once (the server returns the same open one if it already exists)
  useEffect(() => {
    if (existing || !target || started.current) return;
    started.current = true;
    void create({
      purpose: target.purpose,
      installmentNumber: target.installmentNumber,
      amount: target.amount,
    });
  }, [existing, target, create]);

  // A request opened from the history may have changed since the list loaded
  useEffect(() => {
    if (!existing) return;
    getPayment(existing.id)
      .then(setPayment)
      .catch(() => undefined);
  }, [existing]);

  const paymentId = payment?.id;
  const status = payment?.status;
  const expiresAt = payment?.expiresAt ?? null;

  // Countdown
  useEffect(() => {
    if (status !== "pending") return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [status]);

  // Poll until the bank confirms
  useEffect(() => {
    if (!paymentId || status !== "pending") return;
    let busy = false;
    const t = window.setInterval(async () => {
      if (busy) return;
      busy = true;
      try {
        setPayment(await getPayment(paymentId));
      } catch {
        // try again on the next tick
      } finally {
        busy = false;
      }
    }, 7000);
    return () => window.clearInterval(t);
  }, [paymentId, status]);

  // Tell the parent (once) so it can refresh the loan
  useEffect(() => {
    if ((status === "paid" || status === "partially_paid") && !settled.current) {
      settled.current = true;
      onSettledRef.current?.();
    }
  }, [status]);

  const secondsLeft = expiresAt
    ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000))
    : null;
  const expired =
    !!payment && (payment.status === "expired" || (payment.status === "pending" && secondsLeft === 0));

  const title = payment
    ? purposeTitle(payment.purpose, payment.installmentNumber)
    : target
      ? purposeTitle(target.purpose, target.installmentNumber)
      : "Payment";

  async function simulate() {
    if (!payment) return;
    setSimBusy(true);
    try {
      await simulateBankConfirmation(payment.id);
      setPayment(await getPayment(payment.id));
      toast.success("Simulated the bank confirmation");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setSimBusy(false);
    }
  }

  function payRemaining(p: Payment) {
    const base = bodyFrom(p);
    if (p.purpose === "custom") {
      void create({ ...base, amount: remainingNaira(p.amount, p.paidAmount).text });
    } else {
      // installment, payoff and deposit are recomputed by the server from what is still owed
      void create(base);
    }
  }

  return (
    <Modal open onClose={onClose} title={title}>
      {creating && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-600">
          <Loader2 size={18} className="animate-spin text-brand-600" /> Setting up your payment...
        </div>
      )}

      {!creating && !payment && (
        <div className="space-y-4">
          <ErrorNotice message={problem?.message ?? "Couldn't set up the payment."} />
          {problem?.unavailable && (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              You can still pay by transfer to the company account, then ask your agent or an admin to record the
              payment against this loan.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className={buttonClass("ghost")}>
              Close
            </button>
            {lastBody.current && (
              <button onClick={() => void create(lastBody.current as PayBody)} className={buttonClass("primary")}>
                Try again
              </button>
            )}
          </div>
        </div>
      )}

      {!creating && payment && payment.status === "paid" && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900">
            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold">Payment received</p>
              <p className="mt-1">
                {formatMoneyExact(payment.paidAmount || payment.amount)} was confirmed by the bank
                {payment.paidAt ? ` on ${formatDateTime(payment.paidAt)}` : ""}.
              </p>
            </div>
          </div>
          <button onClick={onClose} className={buttonClass("primary", "md", "w-full")}>
            Done
          </button>
        </div>
      )}

      {!creating && payment && payment.status === "partially_paid" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <p className="flex items-center gap-2 font-semibold">
              <TriangleAlert size={18} /> Part of the payment arrived
            </p>
            <p className="mt-2 text-sm">
              We received {formatMoneyExact(payment.paidAmount)} of {formatMoneyExact(payment.amount)}. Still to pay:{" "}
              <strong>{formatMoneyExact(remainingNaira(payment.amount, payment.paidAmount).value)}</strong>.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className={buttonClass("ghost")}>
              Close
            </button>
            <button onClick={() => payRemaining(payment)} className={buttonClass("primary")}>
              Pay the remaining balance
            </button>
          </div>
        </div>
      )}

      {!creating && payment && expired && payment.status !== "paid" && payment.status !== "partially_paid" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-ink">This payment request has expired</p>
            <p className="mt-1">
              Please create a new one before sending any money. If you already sent a transfer, contact your agent or
              an admin.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className={buttonClass("ghost")}>
              Close
            </button>
            <button onClick={() => void create(bodyFrom(payment))} className={buttonClass("primary")}>
              Create a new request
            </button>
          </div>
        </div>
      )}

      {!creating && payment && payment.status === "pending" && !expired && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <PaymentStatusBadge status={payment.status} />
            {coverage(payment) && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {coverage(payment)}
              </span>
            )}
          </div>

          <div className="rounded-xl bg-brand-50 p-4">
            <p className="text-xs uppercase tracking-wide text-brand-700">Send exactly</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-3xl font-bold text-brand-900">{formatMoneyExact(payment.amount)}</p>
              <CopyButton text={payment.amount.toFixed(2)} label="amount" />
            </div>
            <p className="mt-1 text-xs text-brand-800">Send this exact amount so it can be matched to the loan.</p>
          </div>

          {payment.account ? (
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Transfer to</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="select-all font-mono text-2xl font-semibold tracking-wider text-ink">
                  {payment.account.accountNumber}
                </p>
                <CopyButton text={payment.account.accountNumber} label="account number" />
              </div>
              <p className="mt-1 text-sm text-slate-700">{payment.account.accountName}</p>
              <p className="text-sm text-slate-500">{payment.account.bankName}</p>
            </div>
          ) : (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              The account details aren't available yet. Close this and try again in a moment.
            </p>
          )}

          {payment.breakdown.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-ink">What this pays</p>
              <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 text-sm">
                {payment.breakdown.map((b, i) => (
                  <li key={`${b.number ?? "x"}-${i}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="text-slate-700">
                      {b.number !== null ? `Installment ${b.number}` : "Deposit"}
                      {b.dueOn ? ` · due ${formatDay(b.dueOn)}` : ""}
                    </span>
                    <span className="font-medium text-ink">{formatMoneyExact(b.remaining)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {secondsLeft !== null && (
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <Clock size={16} /> This account number is valid for{" "}
              <span className="font-semibold tabular-nums text-ink">{formatCountdown(secondsLeft)}</span>
            </p>
          )}

          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-brand-600" />
            <p>
              Waiting for the bank to confirm your transfer. This page checks automatically, so you can leave it
              open. Nothing is marked as paid until the bank confirms.
            </p>
          </div>

          {typeof payment.instructions === "string" && payment.instructions && (
            <p className="text-sm text-slate-600">{payment.instructions}</p>
          )}

          {payment.payer && (
            <p className="text-xs text-slate-500">
              Requested by {payment.payer.name} ({payment.payer.role}). The payer is recorded on the payment.
            </p>
          )}

          {isDev && user?.role === "admin" && (
            <div className="rounded-xl border border-dashed border-slate-300 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Local testing only</p>
              <button onClick={simulate} disabled={simBusy} className={buttonClass("ghost", "md", "mt-1")}>
                {simBusy ? <Loader2 size={16} className="animate-spin" /> : "Simulate bank confirmation"}
              </button>
              <p className="mt-1 break-all text-[11px] text-slate-400">Request id: {payment.id}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={onClose} className={buttonClass("outline")}>
              Close, I'll pay later
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}