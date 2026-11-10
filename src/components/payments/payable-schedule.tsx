import type { LoanInstallment } from "@/lib/api/finance-types";
import { formatDay, formatMoneyExact } from "@/lib/format";
import { InstallmentStateBadge } from "@/components/finance/badges";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const th = "px-4 py-3 font-medium";
const td = "px-4 py-3";

function isUnpaid(i: LoanInstallment) {
  return i.state !== "paid" && Number(i.remaining ?? 1) > 0;
}

export function PayableScheduleTable({
  schedule,
  canPay,
  onPay,
}: {
  schedule: LoanInstallment[];
  /** false hides the Pay column (loan isn't active) */
  canPay: boolean;
  onPay: (installmentNumber: number) => void;
}) {
  if (schedule.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        The schedule will appear after the loan has been paid out.
      </p>
    );
  }

  const firstUnpaid = schedule.find(isUnpaid)?.number ?? null;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className={th}>#</th>
            <th className={th}>Due</th>
            <th className={th}>Principal</th>
            <th className={th}>Charge</th>
            <th className={th}>Total due</th>
            <th className={th}>Remaining</th>
            <th className={th}>Paid on</th>
            <th className={th}>State</th>
            {canPay && <th className={th} />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {schedule.map((i) => {
            const unpaid = isUnpaid(i);
            const includesEarlier = firstUnpaid !== null && i.number > firstUnpaid;
            return (
              <tr key={i.number} className={cn(i.state === "overdue" && "bg-red-50/40")}>
                <td className={td}>{i.number}</td>
                <td className={td}>{formatDay(i.dueOn)}</td>
                <td className={td}>{formatMoneyExact(i.principalDue)}</td>
                <td className={td}>{formatMoneyExact(i.feeDue)}</td>
                <td className={`${td} font-medium text-ink`}>{formatMoneyExact(i.totalDue)}</td>
                <td className={td}>{formatMoneyExact(i.remaining)}</td>
                <td className={td}>{formatDay(i.paidOn)}</td>
                <td className={td}>
                  <InstallmentStateBadge state={i.state} />
                </td>
                {canPay && (
                  <td className={cn(td, "text-right")}>
                    {unpaid && (
                      <div>
                        <button
                          onClick={() => onPay(i.number)}
                          className={buttonClass(i.state === "overdue" ? "primary" : "outline")}
                        >
                          Pay
                        </button>
                        {includesEarlier && (
                          <p className="mt-1 text-[11px] text-slate-500">with earlier ones</p>
                        )}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}