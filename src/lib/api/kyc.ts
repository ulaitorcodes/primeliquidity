import { ApiError, apiFetch } from "./http";
import { buildQuery } from "./query";

export type KycStatus =
  | "not_started"
  | "draft"
  | "submitted"
  | "approved"
  | "changes_requested"
  | "rejected";

export type KycDocumentKind = "id_front" | "id_back" | "selfie" | "proof_of_address";

export interface KycDocument {
  kind: KycDocumentKind;
  capturedLive: boolean;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export interface Kyc {
  /** null until the person has started */
  id: string | null;
  email: string;
  status: KycStatus;
  legalName: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  address: string | null;
  /** Never the full number: use KycIdentity (admin) for that */
  bvnMasked: string | null;
  ninMasked: string | null;
  idType: string | null;
  idNumberMasked: string | null;
  idExpiry: string | null;
  employmentStatus: string | null;
  employerName: string | null;
  employerAddress: string | null;
  jobTitle: string | null;
  nextOfKinName: string | null;
  nextOfKinPhone: string | null;
  nextOfKinRelationship: string | null;
  consentGiven: boolean;
  documents: KycDocument[];
  /** field names, "document:id_front", "document:selfie", "consent" */
  missing: string[];
  editable: boolean;
  canSubmit: boolean;
  reviewNote: string | null;
  /** shape not pinned down by the spec: render defensively */
  verification: unknown;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string | null;
}

/** Any subset of the KYC fields, plus consent: true */
export type KycPatch = Record<string, string | boolean>;

export interface KycIdentity {
  bvn: string | null;
  nin: string | null;
  idNumber: string | null;
}

export interface KycAuditEntry {
  action: string;
  detail: string | null;
  /** a name or an object with a name: read with actorName() */
  actor: unknown;
  at: string;
}

/**
 * ref is "me" or a profile id. The spec lists GET only for "me", so a profile id
 * falls back to the list if the detail endpoint isn't available.
 */
export async function getKycProfile(ref: string): Promise<Kyc> {
  try {
    return await apiFetch<Kyc>(`/kyc/profiles/${ref}/`);
  } catch (err) {
    if (ref !== "me" && err instanceof ApiError && (err.status === 404 || err.status === 405)) {
      const list = await apiFetch<Kyc[]>("/kyc/profiles/");
      const found = list.find((k) => k.id === ref);
      if (found) return found;
    }
    throw err;
  }
}

export function patchKyc(ref: string, body: KycPatch) {
  return apiFetch<Kyc>(`/kyc/profiles/${ref}/`, { method: "PATCH", body });
}

/** capturedLive must be true for the selfie (taken with the camera). */
export function uploadKycDocument(
  ref: string,
  kind: KycDocumentKind,
  file: Blob,
  filename: string,
  capturedLive = false
) {
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", file, filename);
  if (capturedLive) form.append("capturedLive", "true");
  return apiFetch<unknown>(`/kyc/profiles/${ref}/documents/`, { method: "POST", body: form });
}

export function submitKyc(ref: string) {
  return apiFetch<Kyc>(`/kyc/profiles/${ref}/submit/`, { method: "POST", body: {} });
}

/** Needs the Bearer token, so it's fetched here and shown through a blob URL. */
export function fetchKycDocument(ref: string, kind: KycDocumentKind) {
  return apiFetch<Blob>(`/kyc/profiles/${ref}/documents/${kind}/`, { responseType: "blob" });
}

/* ---- agents and admins ---- */

/** Agents can start KYC only for people they registered or are assigned. */
export function startKyc(email: string) {
  return apiFetch<Kyc>("/kyc/profiles/", {
    method: "POST",
    body: { email: email.trim().toLowerCase() },
  });
}

export interface KycListParams {
  status?: KycStatus | "";
  search?: string;
}

export function listKycProfiles(params: KycListParams = {}) {
  return apiFetch<Kyc[]>(`/kyc/profiles/${buildQuery({ ...params })}`);
}

export function getKycStatuses(emails: string[]) {
  return apiFetch<Record<string, KycStatus>>(
    `/kyc/statuses/${buildQuery({ emails: emails.join(",") })}`
  );
}

/* ---- admin review ---- */

export function approveKyc(id: string) {
  return apiFetch<unknown>(`/kyc/profiles/${id}/approve/`, { method: "POST", body: {} });
}

export function requestKycChanges(id: string, reason: string) {
  return apiFetch<unknown>(`/kyc/profiles/${id}/request-changes/`, {
    method: "POST",
    body: { reason },
  });
}

export function rejectKyc(id: string, reason: string) {
  return apiFetch<unknown>(`/kyc/profiles/${id}/reject/`, { method: "POST", body: { reason } });
}

/** FULL values. Every call is logged on the server: confirm first, never cache or print. */
export function getKycIdentity(id: string) {
  return apiFetch<KycIdentity>(`/kyc/profiles/${id}/identity/`);
}

export function getKycAudit(id: string) {
  return apiFetch<KycAuditEntry[]>(`/kyc/profiles/${id}/audit/`);
}