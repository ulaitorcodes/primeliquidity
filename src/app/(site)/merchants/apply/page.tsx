import type { Metadata } from "next";
import { MerchantApplyForm } from "@/components/merchants/merchant-apply-form";

export const metadata: Metadata = { title: "Become a merchant" };

export default function MerchantApplyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold text-brand-600">Merchants</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Become a merchant</h1>
      <p className="mt-2 mb-8 text-slate-600">
        Schools, landlords, developers and suppliers can apply to be paid directly through Prime Liquidity. Tell us about
        your business and add the bank account we should pay.
      </p>
      <MerchantApplyForm />
    </section>
  );
}