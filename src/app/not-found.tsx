import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 text-center">
      <Logo />
      <p className="mt-12 text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-slate-600">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className={buttonClass("primary")}>
          Back home
        </Link>
        <Link href="/programs" className={buttonClass("outline")}>
          Browse programs
        </Link>
      </div>
    </div>
  );
}