import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/dashboard/shell";
import { ProgramsProvider } from "@/lib/programs/programs-context";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="agent">
      <ProgramsProvider>
        <DashboardShell variant="agent">{children}</DashboardShell>
      </ProgramsProvider>
    </AuthGuard>
  );
}