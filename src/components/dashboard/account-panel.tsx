"use client";

import { useSession } from "@/lib/auth/use-session";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

const roleLabels = { user: "Applicant", agent: "Agent", admin: "Admin" } as const;

export function AccountPanel() {
  const { user } = useSession();

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Account</h1>
        <p className="text-sm text-slate-600">Your profile and password.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-ink">Profile</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="mt-1 text-sm text-ink">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 break-all text-sm text-ink">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Role</dt>
            <dd className="mt-1 text-sm text-ink">{user ? roleLabels[user.role] : ""}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-ink">Change password</h2>
        <ChangePasswordForm
          onChanged={() => {
            if (user) localStorage.setItem(`pl_pw_ok_${user.id}`, "1");
          }}
        />
      </section>
    </div>
  );
}