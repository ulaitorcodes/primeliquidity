import { KycQueue } from "@/components/kyc/kyc-queue";

export default function AgentKycPage() {
  return (
    <KycQueue
      basePath="/agent/kyc"
      title="KYC"
      subtitle="Identity verification for the people you registered or are assigned."
      allowStart
    />
  );
}