import { asArray } from "./array";
import { apiFetch } from "./http";
import { buildQuery } from "./query";
import type {
  BankAccountInput,
  Merchant,
  MerchantInput,
  MerchantKind,
  MerchantStatus,
} from "./finance-types";

/** PUBLIC, no auth. */
export function applyAsMerchant(body: MerchantInput) {
  return apiFetch<{ id: string; name: string; status: MerchantStatus }>("/merchants/apply/", {
    method: "POST",
    body,
    auth: "none",
  });
}

/* ---- public directory (used by application forms) ---- */

export interface DirectoryMerchant {
  id: string;
  name: string;
  kind: string;
}

/**
 * Verified merchants of one kind, for the select fields in application forms.
 * Public: the backend ignores any token on this endpoint, so none is sent.
 * Returns at most 500 by default. `search` is "name contains".
 */
export async function listMerchantDirectory(kind: string, search?: string) {
  return asArray<DirectoryMerchant>(
    await apiFetch<unknown>(`/merchants/directory/${buildQuery({ kind, search })}`, {
      auth: "none",
    })
  );
}

/* ---- admin only ---- */

export interface MerchantListParams {
  status?: MerchantStatus | "";
  kind?: MerchantKind | "";
  search?: string;
}

export async function listMerchants(params: MerchantListParams = {}) {
  return asArray<Merchant>(await apiFetch<unknown>(`/merchants/${buildQuery({ ...params })}`));
}

export function getMerchant(id: string) {
  return apiFetch<Merchant>(`/merchants/${id}/`);
}

export function createMerchant(body: MerchantInput) {
  return apiFetch<Merchant>("/merchants/", { method: "POST", body });
}

export function updateMerchant(id: string, body: Partial<Omit<MerchantInput, "bankAccount">>) {
  return apiFetch<Merchant>(`/merchants/${id}/`, { method: "PATCH", body });
}

export function verifyMerchant(id: string) {
  return apiFetch<unknown>(`/merchants/${id}/verify/`, { method: "POST", body: {} });
}

export function rejectMerchant(id: string, reason: string) {
  return apiFetch<unknown>(`/merchants/${id}/reject/`, { method: "POST", body: { reason } });
}

export function suspendMerchant(id: string, reason: string) {
  return apiFetch<unknown>(`/merchants/${id}/suspend/`, { method: "POST", body: { reason } });
}

export function reactivateMerchant(id: string) {
  return apiFetch<unknown>(`/merchants/${id}/reactivate/`, { method: "POST", body: {} });
}

export function addBankAccount(merchantId: string, body: BankAccountInput) {
  return apiFetch<unknown>(`/merchants/${merchantId}/bank-accounts/`, { method: "POST", body });
}

export function setPrimaryAccount(merchantId: string, accountId: string) {
  return apiFetch<unknown>(`/merchants/${merchantId}/bank-accounts/${accountId}/primary/`, {
    method: "POST",
    body: {},
  });
}

export function markNameVerified(merchantId: string, accountId: string) {
  return apiFetch<unknown>(`/merchants/${merchantId}/bank-accounts/${accountId}/name-verified/`, {
    method: "POST",
    body: {},
  });
}