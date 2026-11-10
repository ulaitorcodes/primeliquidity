import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const tones = {
  slate: "bg-slate-100 text-slate-700",
  amber: "bg-amber-50 text-amber-700",
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "slate",
  loading = false,
  hint,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  loading?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tones[tone])}>
          <Icon size={18} />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-24" />
      ) : (
        <>
          <p className="mt-3 text-2xl font-bold text-ink sm:text-3xl">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </>
      )}
    </div>
  );
}