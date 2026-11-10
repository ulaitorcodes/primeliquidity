"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  BookOpen,
  Calculator,
  FileText,
  HandCoins,
  Inbox,
  KeyRound,
  Landmark,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  ShieldCheck,
  Store,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { useSession } from "@/lib/auth/use-session";
import { logout } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

type Variant = "user" | "agent" | "admin";

const navByVariant: Record<Variant, NavSection[]> = {
  user: [
    {
      items: [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/dashboard/programs", label: "My programs", icon: Layers },
        { href: "/dashboard/applications", label: "Applications", icon: FileText },
        { href: "/dashboard/loans", label: "My loans", icon: Wallet },
        { href: "/dashboard/kyc", label: "KYC", icon: BadgeCheck },
        { href: "/dashboard/account", label: "Account", icon: KeyRound },
      ],
    },
  ],
  agent: [
    {
      items: [
        { href: "/agent", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/agent/register", label: "Register applicant", icon: UserPlus },
        { href: "/agent/applicants", label: "My applicants", icon: Users },
        { href: "/agent/kyc", label: "KYC", icon: BadgeCheck },
        { href: "/agent/loans", label: "Loans", icon: Wallet },
        { href: "/agent/calculator", label: "Calculator", icon: Calculator },
        { href: "/agent/account", label: "Account", icon: KeyRound },
      ],
    },
  ],
  admin: [
    {
      items: [
        { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/admin/applications", label: "Applications", icon: FileText },
        { href: "/admin/kyc", label: "KYC", icon: BadgeCheck },
        { href: "/admin/agents", label: "Agents", icon: Users },
        { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
        { href: "/admin/calculator", label: "Calculator", icon: Calculator },
      ],
    },
    {
      label: "Finance",
      items: [
        { href: "/admin/finance", label: "Dashboard", icon: Landmark, exact: true },
        { href: "/admin/finance/funders", label: "Funders", icon: HandCoins },
        { href: "/admin/finance/merchants", label: "Merchants", icon: Store },
        { href: "/admin/finance/loans", label: "Loans", icon: Wallet },
        { href: "/admin/finance/disbursements", label: "Disbursements", icon: Send },
        { href: "/admin/finance/receipts", label: "Held receipts", icon: Inbox },
        { href: "/admin/finance/journal", label: "Journal", icon: BookOpen },
        { href: "/admin/finance/integrity", label: "Integrity", icon: ShieldCheck },
      ],
    },
    {
      items: [{ href: "/admin/account", label: "Account", icon: KeyRound }],
    },
  ],
};

const variantLabel: Partial<Record<Variant, string>> = {
  admin: "Admin",
  agent: "Agent",
};

export function DashboardShell({
  variant,
  children,
}: {
  variant: Variant;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const sections = navByVariant[variant];

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-brand-700">
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-5">
        <Logo variant="light" />
      </div>

      {variantLabel[variant] && (
        <p className="flex shrink-0 items-center gap-1.5 px-5 pt-5 text-xs font-semibold uppercase tracking-wider text-brand-200">
          <Activity size={12} /> {variantLabel[variant]}
        </p>
      )}

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.label && (
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-brand-200">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-white/15 text-white"
                      : "text-brand-100 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="mb-2 px-3">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-brand-200">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-100 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block print:hidden">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-brand-700 px-4 lg:hidden print:hidden">
          <Logo variant="light" />
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg p-2 text-white hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}