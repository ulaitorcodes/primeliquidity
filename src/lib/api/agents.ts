import { apiFetch } from "./http";
import { buildQuery } from "./query";
import type { Agent, DateRange, Performance } from "./types";

function rangeQuery(r: DateRange) {
  return buildQuery({ from: r.from, to: r.to, granularity: r.granularity });
}

/* ---- self (role "agent") ---- */

export function getMyAgent() {
  return apiFetch<Agent>("/agents/me/");
}

export function getMyPerformance(range: DateRange) {
  return apiFetch<Performance>(`/agents/me/performance/${rangeQuery(range)}`);
}

/* ---- admin ---- */

export interface AgentListParams {
  status?: "active" | "suspended" | "";
  search?: string;
}

export interface AgentCreateInput {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  allowedPrograms?: string[];
  notes?: string;
}

export interface AgentUpdateInput {
  name?: string;
  phone?: string;
  allowedPrograms?: string[];
  notes?: string;
}

export function listAgents(params: AgentListParams = {}) {
  return apiFetch<Agent[]>(
    `/agents/${buildQuery({ status: params.status, search: params.search })}`
  );
}

export function getAgent(id: string) {
  return apiFetch<Agent>(`/agents/${id}/`);
}

export function createAgent(body: AgentCreateInput) {
  return apiFetch<Agent>("/agents/", { method: "POST", body });
}

export function updateAgent(id: string, body: AgentUpdateInput) {
  return apiFetch<Agent>(`/agents/${id}/`, { method: "PATCH", body });
}

export function suspendAgent(id: string, reason?: string) {
  return apiFetch<Agent>(`/agents/${id}/suspend/`, {
    method: "POST",
    body: reason ? { reason } : {},
  });
}

export function activateAgent(id: string) {
  return apiFetch<Agent>(`/agents/${id}/activate/`, { method: "POST", body: {} });
}

export function resetAgentPassword(id: string) {
  return apiFetch<Agent>(`/agents/${id}/reset-password/`, {
    method: "POST",
    body: {},
  });
}

export function getAgentPerformance(id: string, range: DateRange) {
  return apiFetch<Performance>(`/agents/${id}/performance/${rangeQuery(range)}`);
}

/** Send exactly one of applicationIds / applicantEmail. agentId null = unassign. */
export interface AssignBody {
  agentId: string | null;
  applicationIds?: string[];
  applicantEmail?: string;
}

export function assignAgent(body: AssignBody) {
  return apiFetch<{ agentId: string | null; assigned: number; applicationIds: string[] }>(
    "/agents/assign/",
    { method: "POST", body }
  );
}