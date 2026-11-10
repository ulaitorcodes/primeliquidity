import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/dashboard/shell";
import { ProgramsProvider } from "@/lib/programs/programs-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="admin">
      <ProgramsProvider>
        <DashboardShell variant="admin">{children}</DashboardShell>
      </ProgramsProvider>
    </AuthGuard>
  );
}