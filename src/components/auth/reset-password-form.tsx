"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { clearSession } from "@/lib/api/session";
import { buttonClass } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const uid = params.get("uid");
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!uid || !token) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-ink">This link is incomplete</h1>
        <p className="mt-2 text-sm text-slate-600">
          Open the link from your email again, or request a new one.
        </p>
        <Link href="/forgot-password" className={buttonClass("primary", "md", "mt-6")}>
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto text-brand-600" size={40} />
        <h1 className="mt-4 text-2xl font-bold text-ink">Password reset</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your password has been changed. Log in again with the new one.
        </p>
        <Link href="/login" className={buttonClass("primary", "md", "mt-6")}>
          Log in
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setPasswordErrors([]);
    setConfirmError(null);
    setLinkExpired(false);

    if (!password) {
      setPasswordErrors(["Enter a new password"]);
      return;
    }
    if (password !== confirm) {
      setConfirmError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(uid as string, token as string, password);
      clearSession(); // every old token was revoked: the user must log in again
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setFormError("Too many attempts, try again later.");
        } else if (err.fieldErrors.token) {
          setLinkExpired(true);
        } else if (err.fieldErrors.newPassword) {
          setPasswordErrors(err.fieldErrors.newPassword);
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-ink">Choose a new password</h1>
      <p className="mt-1 text-sm text-slate-600">You'll log in with it afterwards.</p>

      {linkExpired && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">This link is invalid or has expired.</p>
          <p className="mt-1">Reset links work once and last 1 hour.</p>
          <Link href="/forgot-password" className="mt-2 inline-block font-medium underline">
            Request a new link
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          {passwordErrors.map((m) => (
            <p key={m} className="mt-1.5 text-xs text-red-600">
              {m}
            </p>
          ))}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm new password</label>
          <input
            type="password"
            className={inputClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          {confirmError && <p className="mt-1.5 text-xs text-red-600">{confirmError}</p>}
        </div>

        <ErrorNotice message={formError} />

        <button type="submit" disabled={loading} className={buttonClass("primary", "md", "w-full")}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Reset password"}
        </button>
      </form>
    </div>
  );
}