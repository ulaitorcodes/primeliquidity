"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { changePassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { buttonClass } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { useToast } from "@/components/ui/toast";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

function PasswordField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="password"
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ChangePasswordForm({ onChanged }: { onChanged?: () => void }) {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const local: Record<string, string> = {};
    if (!current) local.currentPassword = "Enter your current password";
    if (next.length < 6) local.newPassword = "Password must be at least 6 characters";
    if (next !== confirm) local.confirm = "Passwords don't match";
    setErrors(local);
    if (Object.keys(local).length) return;

    setLoading(true);
    try {
      const res = await changePassword(current, next);
      toast.success(res.detail || "Password updated.");
      setCurrent("");
      setNext("");
      setConfirm("");
      onChanged?.();
    } catch (err) {
      if (err instanceof ApiError) {
        const fe: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(err.fieldErrors)) if (msgs[0]) fe[key] = msgs[0];
        setErrors(fe);
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordField label="Current password" value={current} onChange={setCurrent} error={errors.currentPassword} />
      <PasswordField label="New password" value={next} onChange={setNext} error={errors.newPassword} />
      <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} error={errors.confirm} />
      <ErrorNotice message={formError} />
      <button type="submit" disabled={loading} className={buttonClass("primary")}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : "Update password"}
      </button>
    </form>
  );
}