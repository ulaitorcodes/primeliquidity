import { apiFetch } from "./http";
import type { AgentRef } from "./types";

export type ApplicationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

export type AnswerValue = string | number | boolean;

export interface Application {
  id: string;
  reference: string;
  programSlug: string;
  applicantName: string;
  applicantEmail: string;
  status: ApplicationStatus;
  submittedAt: string;
  answers: Record<string, AnswerValue>;
  /**
   * Display names for answers that are ids, e.g. { school: "Greenfield Secondary School" }
   * for a merchant-backed select. Provided by the backend.
   */
  answerLabels?: Record<string, string>;
  /** who registered this applicant */
  agent: AgentRef | null;
  /** the agent this application is assigned to */
  assignedAgent: { id: string; name: string } | null;
}

export interface StatusHistoryItem {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedBy: string | null;
  createdAt: string;
}

export interface ApplicationDetail extends Application {
  statusHistory: StatusHistoryItem[];
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  byProgram: { programSlug: string; programName: string; count: number }[];
}

export interface ListParams {
  program?: string;
  status?: string;
  search?: string;
  /** admin only: filter by agent id */
  agent?: string;
}

export function submitApplication(
  programSlug: string,
  answers: Record<string, AnswerValue>
) {
  // "optional": links the account (or the agent) if logged in, still works anonymously
  return apiFetch<Application>("/applications/", {
    method: "POST",
    body: { programSlug, answers },
    auth: "optional",
  });
}

export function listApplications(params: ListParams = {}) {
  const qs = new URLSearchParams();
  if (params.program) qs.set("program", params.program);
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  if (params.agent) qs.set("agent", params.agent);
  const query = qs.toString();
  return apiFetch<Application[]>(`/applications/${query ? `?${query}` : ""}`);
}

export function getApplication(id: string) {
  return apiFetch<ApplicationDetail>(`/applications/${id}/`);
}

export function updateApplicationStatus(id: string, status: ApplicationStatus) {
  return apiFetch<ApplicationDetail>(`/applications/${id}/status/`, {
    method: "PATCH",
    body: { status },
  });
}

/** Superseded by /analytics/overview/; kept for any screen that still uses it. */
export function getApplicationStats() {
  return apiFetch<ApplicationStats>("/applications/stats/");
}