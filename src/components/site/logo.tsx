import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ variant = "default" }: { variant?: "default" | "light" }) {
  const light = variant === "light";

  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold",
          light ? "bg-white text-brand-700" : "bg-brand-600 text-white"
        )}
      >
        PL
      </span>
      <span
        className={cn(
          "text-lg font-semibold tracking-tight",
          light ? "text-white" : "text-ink"
        )}
      >
        Prime Liquidity
      </span>
    </Link>
  );
}