import { MyLoansList } from "@/components/loans/my-loans";

export default function AgentLoansPage() {
  return <MyLoansList basePath="/agent/loans" showBorrower />;
}