import { KycQueue } from "@/components/kyc/kyc-queue";

export default function AdminKycPage() {
  return (
    <KycQueue
      basePath="/admin/kyc"
      title="KYC"
      subtitle="Review identity verification. Applications can't be approved until KYC is."
      defaultStatus="submitted"
    />
  );
}