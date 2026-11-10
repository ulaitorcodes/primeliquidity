"use client";

import type { DateRange, Granularity } from "@/lib/api/types";
import {
  daysBetween,
  defaultGranularity,
  lastDaysRange,
  rangeForDays,
  toISODate,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

const presets = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
];

const inputClass =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export function RangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const today = toISODate(new Date());

  function setCustom(from: string, to: string) {
    if (!from || !to) return;
    const fixedTo = to < from ? from : to;
    onChange({
      from,
      to: fixedTo,
      granularity: defaultGranularity(daysBetween(from, fixedTo)),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const r = rangeForDays(p.days);
          const active = value.from === r.from && value.to === r.to;
          return (
            <button
              key={p.days}
              onClick={() => onChange(lastDaysRange(p.days))}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <input
          type="date"
          value={value.from}
          max={today}
          onChange={(e) => setCustom(e.target.value, value.to)}
          className={inputClass}
          aria-label="From date"
        />
        <span>to</span>
        <input
          type="date"
          value={value.to}
          max={today}
          onChange={(e) => setCustom(value.from, e.target.value)}
          className={inputClass}
          aria-label="To date"
        />
      </div>

      <select
        value={value.granularity}
        onChange={(e) => onChange({ ...value, granularity: e.target.value as Granularity })}
        className={inputClass}
        aria-label="Group by"
      >
        <option value="day">By day</option>
        <option value="week">By week</option>
        <option value="month">By month</option>
      </select>
    </div>
  );
}