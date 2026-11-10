import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost";
type Size = "md" | "lg";

export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    size === "md" && "px-4 py-2.5 text-sm",
    size === "lg" && "px-6 py-3.5 text-base",
    variant === "primary" && "bg-brand-600 text-white hover:bg-brand-700",
    variant === "outline" &&
      "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    variant === "ghost" && "text-slate-700 hover:bg-slate-100",
    className
  );
}