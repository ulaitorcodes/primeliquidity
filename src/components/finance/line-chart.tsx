"use client";

import { useState } from "react";
import { formatCompactMoney, formatMoneyExact } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

const W = 640;
const H = 240;
const PAD = { l: 58, r: 14, t: 12, b: 28 };

function niceCeil(n: number) {
  if (n <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(n));
  const f = n / pow;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * pow;
}

export function MultiLineChart({
  labels,
  series,
}: {
  labels: string[];
  series: LineSeries[];
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [hover, setHover] = useState<number | null>(null);

  const hasData = series.some((s) => s.values.some((v) => v > 0));
  if (labels.length === 0 || !hasData) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
        No money movement in this period yet.
      </div>
    );
  }

  const visible = series.filter((s) => !hidden.includes(s.key));
  const max = visible.reduce((m, s) => s.values.reduce((a, v) => Math.max(a, v), m), 0);
  const yMax = niceCeil(max);
  const n = labels.length;
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const xOf = (i: number) => PAD.l + (n === 1 ? plotW / 2 : (plotW * i) / (n - 1));
  const yOf = (v: number) => PAD.t + plotH - (v / yMax) * plotH;
  const labelEvery = Math.ceil(n / 6);
  const ticks = [0, yMax / 2, yMax];

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W - PAD.l;
    const idx = n === 1 ? 0 : Math.round((x / plotW) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, idx)));
  }

  const tipLeft = hover !== null ? Math.min(Math.max((xOf(hover) / W) * 100, 20), 80) : 0;

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Money movement over time"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={yOf(t)}
                y2={yOf(t)}
                stroke="#e2e8f0"
                strokeDasharray={t === 0 ? undefined : "3 3"}
              />
              <text x={PAD.l - 8} y={yOf(t) + 3} textAnchor="end" fontSize="10" fill="#64748b">
                {formatCompactMoney(t)}
              </text>
            </g>
          ))}

          {visible.map((s) => (
            <g key={s.key}>
              <path
                d={s.values
                  .map((v, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`)
                  .join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {n <= 40 &&
                s.values.map((v, i) => (
                  <circle key={i} cx={xOf(i)} cy={yOf(v)} r={hover === i ? 4 : 2.5} fill={s.color} />
                ))}
            </g>
          ))}

          {hover !== null && (
            <line x1={xOf(hover)} x2={xOf(hover)} y1={PAD.t} y2={PAD.t + plotH} stroke="#94a3b8" strokeDasharray="3 3" />
          )}

          {labels.map((label, i) =>
            i % labelEvery === 0 ? (
              <text key={i} x={xOf(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#64748b">
                {label}
              </text>
            ) : null
          )}
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-52 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg"
            style={{ left: `${tipLeft}%` }}
          >
            <p className="font-semibold text-ink">{labels[hover]}</p>
            {visible.map((s) => (
              <p key={s.key} className="mt-1 flex justify-between gap-3 text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="font-medium text-ink">{formatMoneyExact(s.values[hover])}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {series.map((s) => {
          const off = hidden.includes(s.key);
          return (
            <button
              key={s.key}
              onClick={() =>
                setHidden((prev) => (off ? prev.filter((k) => k !== s.key) : [...prev, s.key]))
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors",
                off ? "border-slate-200 text-slate-400" : "border-slate-300 text-slate-700"
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: off ? "#cbd5e1" : s.color }} />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}