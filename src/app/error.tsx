"use client";

import { useEffect } from "react";
import { Logo } from "@/components/site/logo";
import { buttonClass } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 text-center">
      <Logo />
      <h1 className="mt-12 text-3xl font-bold tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-slate-600">
        An unexpected error occurred. You can try again, and if it keeps
        happening, please come back in a few minutes.
      </p>
      <button onClick={reset} className={buttonClass("primary", "md", "mt-8")}>
        Try again
      </button>
    </div>
  );
}