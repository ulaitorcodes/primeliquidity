"use client";

import { useState } from "react";
import type { Granularity, TimeseriesPoint } from "@/lib/api/types";
import { formatBucket } from "@/lib/dates";
import { formatNaira } from "@/lib/utils";

const W = 640;
const H = 220;
const PAD = { l: 36, r: 8, t: 10, b: 26 };

function niceCeil(n: number) {
  if (n <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(n));
  const f = n / pow;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * pow;
}

export function TimeseriesChart({
  points,
  granularity,
}: {
  points: TimeseriesPoint[];
  granularity: Granularity;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = points.reduce((m, p) => Math.max(m, p.applications), 0);

  if (points.length === 0 || max === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
        No activity in this period yet.
      </div>
    );
  }

  const yMax = niceCeil(max);
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const step = plotW / points.length;
  const barW = Math.max(2, Math.min(28, step * 0.65));
  const yOf = (v: number) => PAD.t + plotH - (v / yMax) * plotH;
  const labelEvery = Math.ceil(points.length / 6);
  const ticks = [0, yMax / 2, yMax];

  const hovered = hover !== null ? points[hover] : null;
  const tipLeft =
    hover !== null
      ? Math.min(Math.max(((PAD.l + step * (hover + 0.5)) / W) * 100, 18), 82)
      : 0;

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Applications over time"
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
              <text x={PAD.l - 6} y={yOf(t) + 3} textAnchor="end" fontSize="10" fill="#64748b">
                {Number.isInteger(t) ? t : t.toFixed(1)}
              </text>
            </g>
          ))}

          {points.map((p, i) => {
            const x = PAD.l + step * i + (step - barW) / 2;
            const other = Math.max(0, p.applications - p.approved - p.rejected);
            const segments = [
              { v: p.approved, c: "#10b981" },
              { v: p.rejected, c: "#ef4444" },
              { v: other, c: "#cbd5e1" },
            ];
            let acc = 0;
            return (
              <g key={p.date}>
                <rect
                  x={PAD.l + step * i}
                  y={PAD.t}
                  width={step}
                  height={plotH}
                  fill={hover === i ? "rgba(16,185,129,0.08)" : "transparent"}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
                {segments.map((s, k) => {
                  if (s.v <= 0) return null;
                  const top = yOf(acc + s.v);
                  const height = yOf(acc) - top;
                  acc += s.v;
                  return (
                    <rect
                      key={k}
                      x={x}
                      y={top}
                      width={barW}
                      height={height}
                      fill={s.c}
                      rx={1}
                      pointerEvents="none"
                    />
                  );
                })}
                {i % labelEvery === 0 && (
                  <text
                    x={PAD.l + step * (i + 0.5)}
                    y={H - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                  >
                    {formatBucket(p.date, granularity)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg"
            style={{ left: `${tipLeft}%` }}
          >
            <p className="font-semibold text-ink">{formatBucket(hovered.date, granularity)}</p>
            <p className="mt-1 text-slate-600">Applications: {hovered.applications}</p>
            <p className="text-emerald-700">Approved: {hovered.approved}</p>
            <p className="text-red-600">Rejected: {hovered.rejected}</p>
            <p className="text-slate-600">Requested: {formatNaira(hovered.requestedAmount)}</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Approved
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Rejected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Pending / under review
        </span>
      </div>
    </div>
  );
}