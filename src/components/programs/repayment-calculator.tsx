"use client";

import { useState } from "react";
import type { CalculatorConfig } from "@/lib/programs/types";
import { calculateRepayment } from "@/lib/programs/calc";
import { formatNaira } from "@/lib/utils";

export function RepaymentCalculator({ config }: { config: CalculatorConfig }) {
  const [amount, setAmount] = useState(config.defaultAmount);
  const [weeks, setWeeks] = useState(config.defaultWeeks);
  const result = calculateRepayment(config, amount, weeks);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-ink">Repayment calculator</h3>
      <p className="mt-1 text-sm text-slate-600">
        See what you'd pay each week.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-medium text-slate-700">Amount</label>
            <span className="text-sm font-semibold text-ink">
              {formatNaira(amount)}
            </span>
          </div>
          <input
            type="range"
            min={config.minAmount}
            max={config.maxAmount}
            step={5000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-2 w-full accent-brand-600"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-medium text-slate-700">
              Repayment period
            </label>
            <span className="text-sm font-semibold text-ink">{weeks} weeks</span>
          </div>
          <input
            type="range"
            min={config.minWeeks}
            max={config.maxWeeks}
            step={1}
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="mt-2 w-full accent-brand-600"
          />
        </div>
      </div>

      <dl className="mt-6 space-y-3 rounded-xl bg-brand-50 p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-600">Service charge ({config.weeklyRatePct}%/week)</dt>
          <dd className="font-medium text-ink">{formatNaira(result.serviceCharge)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-600">Total to repay</dt>
          <dd className="font-medium text-ink">{formatNaira(result.total)}</dd>
        </div>
        <div className="flex justify-between border-t border-brand-200 pt-3">
          <dt className="font-medium text-brand-900">Weekly payment</dt>
          <dd className="text-base font-bold text-brand-900">
            {formatNaira(result.weekly)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-slate-500">
        Estimate only. Final terms are confirmed when your application is approved.
      </p>
    </div>
  );
}