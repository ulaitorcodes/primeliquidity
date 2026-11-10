import type { AnswerValue } from "./applications";
import { apiFetch } from "./http";
import type { KycStatus } from "./kyc";
import { buildQuery } from "./query";

export type PrefillSource = "profile" | "previousApplication";

export interface Prefill {
  programSlug: string;
  email: string;
  answers: Record<string, AnswerValue>;
  sources: Record<string, PrefillSource>;
  kycStatus: KycStatus;
}

/** Agents pass the email of the person they are registering. */
export function getPrefill(programSlug: string, email?: string) {
  return apiFetch<Prefill>(`/applications/prefill/${buildQuery({ programSlug, email })}`);
}