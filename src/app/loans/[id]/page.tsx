
import { Suspense } from "react";
import LoanLinkContent from "./LoanLinkContent";

export default function LoanLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-600 border-t-transparent" />
        </div>
      }
    >
      <LoanLinkContent />
    </Suspense>
  );
}
