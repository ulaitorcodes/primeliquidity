export function unitLabel(unit: string, n: number) {
  const base = unit === "day" ? "day" : unit === "month" ? "month" : "week";
  return n === 1 ? base : `${base}s`;
}