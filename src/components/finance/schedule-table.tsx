import type { LoanInstallment, PlanInstallment } from "@/lib/api/finance-types";
import { formatDay, formatMoneyExact } from "@/lib/format";
import { InstallmentStateBadge } from "./badges";

const th = "px-4 py-3 font-medium";
const td = "px-4 py-3";

export function PlanScheduleTable({ schedule }: { schedule: PlanInstallment[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className={th}>#</th>
            <th className={th}>Due</th>
            <th className={th}>Principal</th>
            <th className={th}>Service charge</th>
            <th className={th}>Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {schedule.map((i) => (
            <tr key={i.number}>
              <td className={td}>{i.number}</td>
              <td className={td}>{formatDay(i.dueOn)}</td>
              <td className={td}>{formatMoneyExact(i.principalDue)}</td>
              <td className={td}>{formatMoneyExact(i.feeDue)}</td>
              <td className={`${td} font-medium text-ink`}>{formatMoneyExact(i.totalDue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LoanScheduleTable({ schedule }: { schedule: LoanInstallment[] }) {
  if (schedule.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">No schedule yet.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className={th}>#</th>
            <th className={th}>Due</th>
            <th className={th}>Principal due</th>
            <th className={th}>Charge due</th>
            <th className={th}>Total due</th>
            <th className={th}>Principal paid</th>
            <th className={th}>Charge paid</th>
            <th className={th}>Remaining</th>
            <th className={th}>Paid on</th>
            <th className={th}>State</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {schedule.map((i) => (
            <tr key={i.number}>
              <td className={td}>{i.number}</td>
              <td className={td}>{formatDay(i.dueOn)}</td>
              <td className={td}>{formatMoneyExact(i.principalDue)}</td>
              <td className={td}>{formatMoneyExact(i.feeDue)}</td>
              <td className={`${td} font-medium text-ink`}>{formatMoneyExact(i.totalDue)}</td>
              <td className={td}>{formatMoneyExact(i.principalPaid)}</td>
              <td className={td}>{formatMoneyExact(i.feePaid)}</td>
              <td className={td}>{formatMoneyExact(i.remaining)}</td>
              <td className={td}>{formatDay(i.paidOn)}</td>
              <td className={td}>
                <InstallmentStateBadge state={i.state} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}