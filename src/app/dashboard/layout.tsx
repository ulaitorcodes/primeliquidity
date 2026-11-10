import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardShell } from "@/components/dashboard/shell";
import { KycBanner } from "@/components/kyc/kyc-banner";
import { ProgramsProvider } from "@/lib/programs/programs-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="user">
      <ProgramsProvider>
        <DashboardShell variant="user">
          <KycBanner />
          {children}
        </DashboardShell>
      </ProgramsProvider>
    </AuthGuard>
  );
}