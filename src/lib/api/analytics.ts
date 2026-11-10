import { apiFetch } from "./http";
import { buildQuery } from "./query";
import type {
  AgentsAnalytics,
  AnalyticsOverview,
  AnswersBreakdown,
  DateRange,
} from "./types";

export function getAnalyticsOverview(range: DateRange, program?: string) {
  return apiFetch<AnalyticsOverview>(
    `/analytics/overview/${buildQuery({
      from: range.from,
      to: range.to,
      granularity: range.granularity,
      program,
    })}`
  );
}

export interface AgentsAnalyticsParams {
  from: string;
  to: string;
  sort?: string;
  order?: "asc" | "desc";
  status?: "active" | "suspended" | "";
}

export function getAgentsAnalytics(params: AgentsAnalyticsParams) {
  return apiFetch<AgentsAnalytics>(`/analytics/agents/${buildQuery({ ...params })}`);
}

export function getAnswersBreakdown(
  range: { from: string; to: string },
  program: string,
  field: string
) {
  return apiFetch<AnswersBreakdown>(
    `/analytics/answers/${buildQuery({
      from: range.from,
      to: range.to,
      program,
      field,
    })}`
  );
}