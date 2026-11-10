export interface BarItem {
  key: string;
  label: string;
  value: number;
  hint?: string;
  /** Tailwind background class, e.g. "bg-emerald-500" */
  color?: string;
}

export function BreakdownBars({
  items,
  emptyMessage = "Not available yet.",
  format,
}: {
  items: BarItem[];
  emptyMessage?: string;
  format?: (value: number) => string;
}) {
  const max = items.reduce((m, i) => Math.max(m, i.value), 0);

  if (items.length === 0 || max === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-slate-700">{item.label}</span>
            <span className="shrink-0 font-medium text-ink">
              {format ? format(item.value) : item.value.toLocaleString("en-NG")}
              {item.hint && (
                <span className="ml-2 text-xs font-normal text-slate-500">{item.hint}</span>
              )}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full ${item.color ?? "bg-brand-600"}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}