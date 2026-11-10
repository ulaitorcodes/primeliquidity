import Link from "next/link";
import { Logo } from "./logo";
import { CurrentYear } from "./current-year";

export function Footer() {
  return (
    <footer id="contact" className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-slate-600">
            Trade and asset financing that helps businesses and families get
            what they need today and pay over time.
          </p>
        </div>
        <div className="text-sm text-slate-600">
          <p className="mb-3 font-semibold text-ink">Contact</p>
          {/* TODO: replace with your real contact details */}
          <p>hello@example.com</p>
          <p>+234 000 000 0000</p>
        </div>
        <div className="text-sm text-slate-600">
          <p className="mb-3 font-semibold text-ink">Company</p>
          <Link href="/merchants/apply" className="mb-2 block font-medium text-brand-700 hover:underline">
            Become a merchant
          </Link>
          <p>
            © <CurrentYear /> Prime Liquidity. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}