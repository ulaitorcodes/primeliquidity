import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/dashboard/shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="admin">
      <DashboardShell variant="admin">{children}</DashboardShell>
    </AuthGuard>
  );
}