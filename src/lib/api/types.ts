export type Granularity = "day" | "week" | "month";

export interface DateRange {
  from: string;
  to: string;
  granularity: Granularity;
}

export interface AgentRef {
  id: string;
  name: string;
  code: string;
}

export interface StatusCounts {
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
}

export interface Stats {
  applications: number;
  /** distinct applicants */
  people: number;
  byStatus: StatusCounts;
  /** percent 0-100 of decided applications; null = no decisions yet */
  approvalRate: number | null;
  /** amount typed on the form, not money disbursed */
  requestedAmount: number;
  approvedAmount: number;
  lastRegisteredAt: string | null;
}

export interface ProgramStats extends Stats {
  programSlug: string;
  programName: string;
}

export interface TimeseriesPoint {
  date: string;
  applications: number;
  approved: number;
  rejected: number;
  requestedAmount: number;
}

/* ---- agents ---- */

export type AgentStatus = "active" | "suspended";

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  /** e.g. "AGT-12345" */
  code: string;
  status: AgentStatus;
  suspendedReason: string | null;
  suspendedAt: string | null;
  /** empty = the agent may use ALL programs */
  allowedPrograms: string[];
  notes: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  stats: Stats;
  /** only present on create and reset-password, shown once */
  temporaryPassword?: string;
}

export interface Performance {
  range: DateRange;
  totals: Stats;
  byProgram: ProgramStats[];
  timeseries: TimeseriesPoint[];
}

export interface AgentRow extends Stats {
  rank: number;
  agentId: string;
  name: string;
  email: string;
  code: string;
  status: AgentStatus;
}

/* ---- analytics (admin) ---- */

export interface SourceBreakdown {
  applications: number;
  approved: number;
  rejected: number;
  approvalRate: number | null;
}

export interface OverviewTotals extends Stats {
  repeatApplicants: number;
  averageAmount: number | null;
  largestAmount: number | null;
  averageDecisionHours: number | null;
}

export interface AnalyticsOverview {
  range: DateRange;
  totals: OverviewTotals;
  bySource: { agent: SourceBreakdown; direct: SourceBreakdown };
  byProgram: ProgramStats[];
  timeseries: TimeseriesPoint[];
  /** "right now", ignores the date range */
  backlog: { pending: number; underReview: number; oldestPendingAt: string | null };
  agents: {
    total: number;
    active: number;
    suspended: number;
    activeInRange: number;
    top: AgentRow[];
  };
  accounts: { total: number; users: number; agents: number; admins: number; newInRange: number };
}

export interface AgentsAnalytics {
  range: DateRange;
  summary: {
    totalAgents: number;
    activeAgents: number;
    suspendedAgents: number;
    agentsWithActivity: number;
    agentsWithoutActivity: number;
    applications: number;
    averagePerActiveAgent: number | null;
  };
  agents: AgentRow[];
}

export interface AnswersBreakdown {
  range: DateRange;
  program: string;
  field: string;
  label: string;
  type: string;
  total: number;
  breakdown: { value: string | number | boolean; label: string; count: number }[];
}