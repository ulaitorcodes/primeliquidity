"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { buttonClass } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSent(res.detail || "If an account exists for that email, we've sent a link to reset your password.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Too many attempts, try again later.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <MailCheck className="mx-auto text-brand-600" size={40} />
        <h1 className="mt-4 text-2xl font-bold text-ink">Check your email</h1>
        <p className="mt-2 text-sm text-slate-600">{sent}</p>
        <p className="mt-2 text-xs text-slate-500">The link works once and expires after 1 hour.</p>
        <Link href="/login" className={buttonClass("outline", "md", "mt-6")}>
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-ink">Forgot your password?</h1>
      <p className="mt-1 text-sm text-slate-600">
        Enter your email and we'll send you a link to choose a new one.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <ErrorNotice message={error} />

        <button type="submit" disabled={loading} className={buttonClass("primary", "md", "w-full")}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}