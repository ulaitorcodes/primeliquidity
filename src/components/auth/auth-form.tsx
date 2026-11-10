"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { login, register } from "@/lib/api/auth";
import { homeForRole } from "@/lib/auth/routes";
import { buttonClass } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

/** Only allow redirects to paths inside this app. */
function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const search = useSearchParams();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";
  const next = safeNext(search.get("next"));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isLogin && name.trim().length < 2) return setError("Enter your full name");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    setLoading(true);
    try {
      const user = isLogin
        ? await login(email, password)
        : await register(name, email, password);
      toast.success(
        isLogin
          ? `Welcome back, ${user.name.split(" ")[0]}`
          : "Account created. Welcome to Prime Liquidity!"
      );
      router.replace(next ?? homeForRole(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-ink">
        {isLogin ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {isLogin
          ? "Log in to view your applications."
          : "Track your applications in one place."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {!isLogin && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            {isLogin && (
              <Link href="/forgot-password" className="text-xs font-medium text-brand-700 hover:underline">
                Forgot password?
              </Link>
            )}
          </div>
          <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className={buttonClass("primary", "md", "w-full")}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : isLogin ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {isLogin ? "New here? " : "Already have an account? "}
        <Link
          href={isLogin ? "/register" : "/login"}
          className="font-medium text-brand-700 hover:underline"
        >
          {isLogin ? "Create an account" : "Log in"}
        </Link>
      </p>
    </div>
  );
}